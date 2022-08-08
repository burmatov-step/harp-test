"use strict";
/*
 * Copyright (C) 2018-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.Squares = exports.Circles = exports.MapViewPoints = void 0;
import * as THREE from "three"
/**
 * `MapViewPoints` is a class to extend for the `"circles"` and `"squares"` techniques to
 * implement raycasting of `THREE.Points` as expected in {@link MapView},
 * that are in screen space.
 *
 * @remarks
 * It copies the behaviour of the `raycast` method in [[THREE.Points]] and dispatches it to its
 * children classes, {@link Circles} and {@link Squares}, who hold the intersection testing in the
 * `testPoint` method. This class also has the ability to dismiss the testing via the
 * `enableRayTesting` flag.
 *
 * Its main motivation is to handle the point styles of XYZ projects.
 *
 * @see https://github.com/mrdoob/three.js/blob/master/src/objects/Points.js
 *
 * @internal
 */
class MapViewPoints extends THREE.Points {
    constructor() {
        super(...arguments);
        /**
         * This allows to discard the ray testing.
         */
        this.enableRayTesting = true;
    }
    /**
     * This method is similar to the original method `raycast` in [[THREE.Points]] except that it
     * then calls the tailored `testPoint` method in the children classes to test intersections
     * depending on whether the points are circles or squares, which [[THREE.Points]] cannot do.
     *
     * @param raycaster - The raycaster.
     * @param intersects - The array to fill with the results.
     */
    raycast(raycaster, intersects) {
        if (!this.enableRayTesting) {
            return;
        }
        const geometry = this.geometry;
        const matrixWorld = this.matrixWorld;
        const ndc = raycaster.ray.origin
            .clone()
            .add(raycaster.ray.direction)
            .project(raycaster.camera);
        const mouseCoords = ndcToScreen(ndc, raycaster);
        const testPoint = (point, index) => {
            const pointInfo = getPointInfo(point, matrixWorld, raycaster);
            if (pointInfo.pointIsOnScreen) {
                this.testPoint(point, pointInfo.absoluteScreenPosition, mouseCoords, index, pointInfo.distance, intersects);
            }
        };
        const point = new THREE.Vector3();
        const index = geometry.index;
        const attributes = geometry.attributes;
        const positions = attributes.position.array;
        if (index !== null) {
            const indices = index.array;
            for (let i = 0, il = indices.length; i < il; i++) {
                testPoint(point.fromArray(positions, indices[i] * 3), i);
            }
        }
        else {
            for (let i = 0, l = positions.length / 3; i < l; i++) {
                testPoint(point.fromArray(positions, i * 3), i);
            }
        }
    }
}
exports.MapViewPoints = MapViewPoints;
function ndcToScreen(ndc, raycaster) {
    return new THREE.Vector2(ndc.x + 1, 1 - ndc.y)
        .divideScalar(2)
        .multiply(raycaster.canvasSize)
        .ceil();
}
function getPointInfo(point, matrixWorld, raycaster) {
    const worldPosition = point.clone().applyMatrix4(matrixWorld);
    const distance = worldPosition.distanceTo(raycaster.ray.origin);
    const ndc = worldPosition.project(raycaster.camera);
    const pointIsOnScreen = ndc.x < 1 && ndc.x > -1 && ndc.y < 1 && ndc.y > -1;
    if (pointIsOnScreen) {
        const absoluteScreenPosition = ndcToScreen(ndc, raycaster);
        return {
            absoluteScreenPosition,
            pointIsOnScreen,
            distance
        };
    }
    return {
        pointIsOnScreen
    };
}
/**
 * Point object that implements the raycasting of circles in screen space.
 * @internal
 */
class Circles extends MapViewPoints {
    /** @override */
    testPoint(point, screenPosition, pickCoordinates, index, distance, intersects) {
        const dx = screenPosition.x - pickCoordinates.x;
        const dy = screenPosition.y - pickCoordinates.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const radius = this.material.size / 2;
        if (dist <= radius) {
            intersects.push({
                point,
                distance,
                index,
                object: this
            });
        }
    }
}
exports.Circles = Circles;
/**
 * Point object that implements the raycasting of squares in screen space.
 * @internal
 */
class Squares extends MapViewPoints {
    /** @override */
    testPoint(point, screenPosition, pickCoordinates, index, distance, intersects) {
        const dx = screenPosition.x - pickCoordinates.x;
        const dy = screenPosition.y - pickCoordinates.y;
        const halfSize = this.material.size / 2;
        if (Math.abs(dx) <= halfSize && Math.abs(dy) <= halfSize) {
            intersects.push({
                point,
                distance,
                index,
                object: this
            });
        }
    }
}
exports.Squares = Squares;
export default exports
//# sourceMappingURL=MapViewPoints.js.map