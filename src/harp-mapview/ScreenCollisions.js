"use strict";
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */

let exports = {}
exports.ScreenCollisionsDebug = exports.ScreenCollisions = exports.isLineWithBound = exports.DetailedCollisionBox = exports.CollisionBox = void 0;
import * as harp_utils_1 from "@here/harp-utils"
import * as THREE from "three"
import DebugContext_1 from "./DebugContext"
import RBush from "rbush"
const logger = harp_utils_1.LoggerManager.instance.create("ScreenCollissions");
class CollisionBox extends harp_utils_1.Math2D.Box {
    constructor(box) {
        super();
        if (box !== undefined) {
            this.copy(box);
        }
    }
    copy(box) {
        if (box instanceof harp_utils_1.Math2D.Box) {
            this.set(box.x, box.y, box.w, box.h);
        }
        else if (box instanceof THREE.Box2) {
            this.set(box.min.x, box.min.y, box.max.x - box.min.x, box.max.y - box.min.y);
        }
        else {
            this.set(box.minX, box.minY, box.maxX - box.minX, box.maxY - box.minY);
        }
        return this;
    }
    get minX() {
        return this.x;
    }
    set minX(minX) {
        this.x = minX;
    }
    get maxX() {
        return this.x + this.w;
    }
    set maxX(maxX) {
        this.w = maxX - this.x;
    }
    get minY() {
        return this.y;
    }
    set minY(minY) {
        this.y = minY;
    }
    get maxY() {
        return this.y + this.h;
    }
    set maxY(maxY) {
        this.h = maxY - this.y;
    }
}
exports.CollisionBox = CollisionBox;
/**
 * Collision box with additional boxes defining tighter bounds for the enclosed feature
 * (e.g.glyph bounds for text).
 */
class DetailedCollisionBox extends CollisionBox {
    constructor(box, detailBoxes) {
        super(box);
        this.detailBoxes = detailBoxes;
    }
}
exports.DetailedCollisionBox = DetailedCollisionBox;
function isLineWithBound(box) {
    return box.line !== undefined;
}
exports.isLineWithBound = isLineWithBound;
const tmpCollisionBox = new CollisionBox();
class ScreenCollisions {
    /**
     * Constructs a new ScreenCollisions object.
     */
    constructor() {
        /** The screen bounding box. */
        this.screenBounds = new harp_utils_1.Math2D.Box();
        /** Tree of allocated bounds. */
        this.rtree = new RBush();
        //
    }
    /**
     * Resets the list of allocated screen bounds.
     */
    reset() {
        this.rtree.clear();
    }
    /**
     * Updates the screen bounds that are used to check if bounding boxes are visible.
     *
     * @param width - The width of the container.
     * @param height - The height of the container.
     */
    update(width, height) {
        this.screenBounds.set(width / -2, height / -2, width, height);
        this.reset();
    }
    /**
     * Marks the region of the screen intersecting with the given bounding box as allocated.
     *
     * @param bounds - The bounding box in NDC scaled coordinates (i.e. top left is -width/2,
     * -height/2)
     */
    allocate(bounds) {
        const bbox = !(bounds instanceof CollisionBox) ? new CollisionBox(bounds) : bounds;
        this.rtree.insert(bbox);
    }
    /**
     * Inserts the given bounds into the rtree.
     *
     * @param bounds - The bounding boxes (the bounding boxes must be in the space returned from the
     * ScreenProjector.project method).
     */
    allocateIBoxes(bounds) {
        this.rtree.load(bounds);
    }
    /**
     * Search for all bounds in the tree intersecting with the given box.
     * @param box - The box used for the search.
     * @returns An array of all IBoxes intersecting with the given box.
     */
    search(box) {
        return this.rtree.search(box);
    }
    /**
     * Checks if the given bounding box is already allocated.
     *
     * @param bounds - The bounding box in world coordinates.
     */
    isAllocated(bounds) {
        const collisionBox = bounds instanceof CollisionBox ? bounds : tmpCollisionBox.copy(bounds);
        const results = this.search(collisionBox);
        return this.intersectsDetails(collisionBox, results);
    }
    /**
     * Checks if the given screen bounds intersects with the frustum of the active camera.
     *
     * @param bounds - The bounding box in world coordinates.
     */
    isVisible(bounds) {
        return this.screenBounds.intersects(bounds);
    }
    /**
     * Checks if the given screen bounds is contained within the frustum of the active camera.
     *
     * @param bounds - The bounding box in world coordinates.
     */
    isFullyVisible(bounds) {
        return this.screenBounds.containsBox(bounds);
    }
    /**
     * Test whether a given [[CollisionBox]] intersects with any of the details in the specified
     * [[IBox]]es.
     *
     * @param testBox - The box to test for intersection.
     * @param boxes - The candidate boxes the test box may intersect with. It's assumed that the
     * global bounds of these boxes intersect with the given test box.
     * @returns `true` if any intersection found.
     */
    intersectsDetails(testBox, boxes) {
        for (const box of boxes) {
            if (box instanceof DetailedCollisionBox) {
                for (const detailBox of box.detailBoxes) {
                    if (detailBox.intersects(testBox)) {
                        return true;
                    }
                }
            }
            else if (isLineWithBound(box)) {
                const boundedLine = box;
                if (this.intersectsLine(testBox, boundedLine)) {
                    return true;
                }
            }
            else {
                return true;
            }
        }
        return false;
    }
    /**
     * Computes the intersection between the supplied CollisionBox and the LineWithBound.
     * @note The [[CollisionBox]] is in Screen Bounds space, whereas the line must be
     * in Screen Coordinate space
     */
    intersectsLine(bbox, boundedLine) {
        const line = boundedLine.line;
        // Note, these aren't normalized, but it doesn't matter, we are just interested
        // in the sign.
        const lineXDiffTransformed = line.end.x - line.start.x;
        // Sign of bottom left, bottom right, top left and top right corners.
        let signBL;
        let signBR;
        let signTL;
        let signTR;
        if (lineXDiffTransformed !== 0) {
            const lineYDiffTransformed = line.end.y - line.start.y;
            const normalX = lineYDiffTransformed;
            const normalY = -lineXDiffTransformed;
            const D = line.start.y - (lineYDiffTransformed / lineXDiffTransformed) * line.start.x;
            signBL = Math.sign(bbox.minX * normalX + (bbox.minY - D) * normalY);
            signBR = Math.sign(bbox.maxX * normalX + (bbox.minY - D) * normalY);
            signTL = Math.sign(bbox.minX * normalX + (bbox.maxY - D) * normalY);
            signTR = Math.sign(bbox.maxX * normalX + (bbox.maxY - D) * normalY);
        }
        else {
            signBL = Math.sign(bbox.minX - line.start.x);
            signBR = Math.sign(bbox.maxX - line.start.x);
            signTL = Math.sign(bbox.minX - line.start.x);
            signTR = Math.sign(bbox.maxX - line.start.x);
        }
        return signBL !== signBR || signBL !== signTL || signBL !== signTR;
    }
}
exports.ScreenCollisions = ScreenCollisions;
/**
 * @hidden
 *
 * Shows requests for screen space during labelling in an HTML canvas, which should be sized like
 * the actual map canvas. It can be placed on top of the map canvas to show exactly which requests
 * for screen space were done.
 *
 * Also logs statistics.
 */
class ScreenCollisionsDebug extends ScreenCollisions {
    /**
     * Constructs a new ScreenCollisions object which renders its state to a 2D canvas.
     */
    constructor(debugCanvas) {
        super();
        /** 2D rendering context. */
        this.m_renderContext = null;
        this.m_renderingEnabled = false;
        this.m_numAllocations = 0;
        this.m_numSuccessfulTests = 0;
        this.m_numFailedTests = 0;
        this.m_numSuccessfulVisibilityTests = 0;
        this.m_numFailedVisibilityTests = 0;
        if (debugCanvas !== undefined && debugCanvas !== null) {
            this.m_renderContext = debugCanvas.getContext("2d");
        }
    }
    /**
     * Resets the list of allocated bounds and clears the debug canvas.
     * @override
     */
    reset() {
        super.reset();
        this.m_numAllocations = 0;
        this.m_numSuccessfulTests = 0;
        this.m_numFailedTests = 0;
        this.m_numSuccessfulVisibilityTests = 0;
        this.m_numFailedVisibilityTests = 0;
    }
    /**
     * Updates the screen bounds used to check if bounding boxes are visible.
     *
     * @param width - The width of the container.
     * @param height - The height of the container.
     * @override
     */
    update(width, height) {
        if (this.m_renderingEnabled) {
            logger.log(`Allocations: ${this.m_numAllocations} Successful Tests: ${this.m_numSuccessfulTests} Failed Tests: ${this.m_numFailedTests}  Successful Visibility Tests: ${this.m_numSuccessfulVisibilityTests}  Failed Visibility Tests: ${this.m_numFailedVisibilityTests} `);
        }
        super.update(width, height);
        if (this.m_renderContext !== null) {
            this.m_renderContext.canvas.width = width;
            this.m_renderContext.canvas.height = height;
        }
        // activate in the browser with:
        // window.__debugContext.setValue("DEBUG_SCREEN_COLLISIONS", true)
        this.m_renderingEnabled = DebugContext_1.debugContext.getValue("DEBUG_SCREEN_COLLISIONS");
    }
    /**
     * Marks the region of the screen intersecting with the given bounding box as allocated.
     *
     * @param bounds - the bounding box in world coordinates.
     * @override
     */
    allocate(bounds) {
        super.allocate(bounds);
        this.m_numAllocations++;
        if (this.m_renderingEnabled && this.m_renderContext !== null) {
            this.m_renderContext.strokeStyle = "#6666ff";
            this.m_renderContext.strokeRect(bounds.x - this.screenBounds.x, this.screenBounds.y + this.screenBounds.h - bounds.y, bounds.w, -bounds.h);
        }
    }
    /** @override */
    allocateIBoxes(boundsArray) {
        for (const bounds of boundsArray) {
            this.m_numAllocations++;
            if (this.m_renderingEnabled && this.m_renderContext !== null) {
                this.m_renderContext.strokeStyle = "#aa2222";
                this.m_renderContext.strokeRect(bounds.minX - this.screenBounds.x, this.screenBounds.y + this.screenBounds.h - bounds.minY, bounds.maxX - bounds.minX, -(bounds.maxY - bounds.minY));
            }
        }
        super.allocateIBoxes(boundsArray);
    }
    /** @override */
    intersectsDetails(testBox, boxes) {
        const collisionFound = super.intersectsDetails(testBox, boxes);
        if (this.m_renderingEnabled && this.m_renderContext !== null) {
            const padding = collisionFound ? 2 : 1;
            this.m_renderContext.strokeStyle = collisionFound ? "#FF0000" : "#00ff00";
            this.m_renderContext.strokeRect(testBox.x - this.screenBounds.x - padding, this.screenBounds.y + this.screenBounds.h - testBox.y + padding, testBox.w + 2 * padding, -testBox.h - 2 * padding);
        }
        if (collisionFound) {
            this.m_numFailedTests++;
        }
        else {
            this.m_numSuccessfulTests++;
        }
        return collisionFound;
    }
    /**
     * Checks if the given screen bounds intersects with the frustum of the active camera.
     *
     * @param bounds - The bounding box in world coordinates.
     * @override
     */
    isVisible(bounds) {
        const visible = super.isVisible(bounds);
        if (visible) {
            this.m_numSuccessfulVisibilityTests++;
        }
        else {
            this.m_numFailedVisibilityTests++;
        }
        return visible;
    }
}
exports.ScreenCollisionsDebug = ScreenCollisionsDebug;

export default exports
//# sourceMappingURL=ScreenCollisions.js.map