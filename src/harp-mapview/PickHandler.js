"use strict";
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.PickHandler = exports.PickObjectType = void 0;
import * as harp_datasource_protocol_1 from "@here/harp-datasource-protocol"
import * as harp_geoutils_1 from "@here/harp-geoutils"
import * as THREE from "three"
import MapViewPoints_1 from "./MapViewPoints"
import PickingRaycaster_1 from "./PickingRaycaster"
import PickListener_1 from "./PickListener"
import Utils_1 from "./Utils"
/**
 * Describes the general type of a picked object.
 */
var PickObjectType;
(function (PickObjectType) {
    /**
     * Unspecified.
     */
    PickObjectType[PickObjectType["Unspecified"] = 0] = "Unspecified";
    /**
     * A point object.
     */
    PickObjectType[PickObjectType["Point"] = 1] = "Point";
    /**
     * A line object.
     */
    PickObjectType[PickObjectType["Line"] = 2] = "Line";
    /**
     * An area object.
     */
    PickObjectType[PickObjectType["Area"] = 3] = "Area";
    /**
     * The text part of a {@link TextElement}
     */
    PickObjectType[PickObjectType["Text"] = 4] = "Text";
    /**
     * The Icon of a {@link TextElement}.
     */
    PickObjectType[PickObjectType["Icon"] = 5] = "Icon";
    /**
     * Any general 3D object, for example, a landmark.
     */
    PickObjectType[PickObjectType["Object3D"] = 6] = "Object3D";
})(PickObjectType = exports.PickObjectType || (exports.PickObjectType = {}));
const tmpV3 = new THREE.Vector3();
const tmpOBB = new harp_geoutils_1.OrientedBox3();
// Intersects the dependent tile objects using the supplied raycaster. Note, because multiple
// tiles can point to the same dependency we need to store which results we have already
// raycasted, see checkedDependencies.
function intersectDependentObjects(tile, intersects, rayCaster, checkedDependencies, mapView) {
    for (const tileKey of tile.dependencies) {
        const mortonCode = tileKey.mortonCode();
        if (checkedDependencies.has(mortonCode)) {
            continue;
        }
        checkedDependencies.add(mortonCode);
        const otherTile = mapView.visibleTileSet.getCachedTile(tile.dataSource, tileKey, tile.offset, mapView.frameNumber);
        if (otherTile !== undefined) {
            rayCaster.intersectObjects(otherTile.objects, true, intersects);
        }
    }
}
/**
 * Handles the picking of scene geometry and roads.
 * @internal
 */
class PickHandler {
    constructor(mapView, camera, enablePickTechnique = false) {
        this.mapView = mapView;
        this.camera = camera;
        this.enablePickTechnique = enablePickTechnique;
        this.m_pickingRaycaster = new PickingRaycaster_1.PickingRaycaster(mapView.renderer.getSize(new THREE.Vector2()));
    }
    /**
     * Does a raycast on all objects in the scene; useful for picking.
     *
     * @param x - The X position in CSS/client coordinates, without the applied display ratio.
     * @param y - The Y position in CSS/client coordinates, without the applied display ratio.
     * @param parameters - The intersection test behaviour may be adjusted by providing an instance
     * of {@link IntersectParams}.
     * @returns the list of intersection results.
     */
    intersectMapObjects(x, y, parameters) {
        const ndc = this.mapView.getNormalizedScreenCoordinates(x, y);
        const rayCaster = this.setupRaycaster(x, y);
        const pickListener = new PickListener_1.PickListener(parameters);
        if (this.mapView.textElementsRenderer !== undefined) {
            const { clientWidth, clientHeight } = this.mapView.canvas;
            const screenX = ndc.x * clientWidth * 0.5;
            const screenY = ndc.y * clientHeight * 0.5;
            const scenePosition = new THREE.Vector2(screenX, screenY);
            this.mapView.textElementsRenderer.pickTextElements(scenePosition, pickListener);
        }
        const intersects = [];
        const intersectedTiles = this.getIntersectedTiles(rayCaster);
        // This ensures that we check a given dependency only once (because multiple tiles could
        // have the same dependency).
        const checkedDependencies = new Set();
        for (const { tile, distance } of intersectedTiles) {
            if (pickListener.done && pickListener.furthestResult.distance < distance) {
                // Stop when the listener has all results it needs and remaining tiles are further
                // away than then furthest pick result found so far.
                break;
            }
            intersects.length = 0;
            rayCaster.intersectObjects(tile.objects, true, intersects);
            intersectDependentObjects(tile, intersects, rayCaster, checkedDependencies, this.mapView);
            for (const intersect of intersects) {
                pickListener.addResult(this.createResult(intersect, tile));
            }
        }
        // Intersect any objects added by the user.
        intersects.length = 0;
        for (const child of this.mapView.mapAnchors.children) {
            rayCaster.intersectObject(child, true, intersects);
            for (const intersect of intersects) {
                pickListener.addResult(this.createResult(intersect));
            }
        }
        pickListener.finish();
        return pickListener.results;
    }
    /**
     * Returns a ray caster using the supplied screen positions.
     *
     * @param x - The X position in css/client coordinates (without applied display ratio).
     * @param y - The Y position in css/client coordinates (without applied display ratio).
     *
     * @return Raycaster with origin at the camera and direction based on the supplied x / y screen
     * points.
     */
    raycasterFromScreenPoint(x, y) {
        this.m_pickingRaycaster.setFromCamera(this.mapView.getNormalizedScreenCoordinates(x, y), this.camera);
        this.mapView.renderer.getSize(this.m_pickingRaycaster.canvasSize);
        return this.m_pickingRaycaster;
    }
    createResult(intersection, tile) {
        var _a, _b, _c;
        const pickResult = {
            type: PickObjectType.Unspecified,
            point: intersection.point,
            distance: intersection.distance,
            dataSourceName: (_a = intersection.object.userData) === null || _a === void 0 ? void 0 : _a.dataSource,
            dataSourceOrder: (_b = tile === null || tile === void 0 ? void 0 : tile.dataSource) === null || _b === void 0 ? void 0 : _b.dataSourceOrder,
            intersection,
            tileKey: tile === null || tile === void 0 ? void 0 : tile.tileKey
        };
        if (intersection.object.userData === undefined ||
            intersection.object.userData.feature === undefined) {
            return pickResult;
        }
        if (this.enablePickTechnique) {
            pickResult.technique = intersection.object.userData.technique;
        }
        pickResult.renderOrder = (_c = intersection.object) === null || _c === void 0 ? void 0 : _c.renderOrder;
        const featureData = intersection.object.userData.feature;
        this.addObjInfo(featureData, intersection, pickResult);
        if (pickResult.userData) {
            const featureId = harp_datasource_protocol_1.getFeatureId(pickResult.userData);
            pickResult.featureId = featureId === 0 ? undefined : featureId;
        }
        let pickObjectType;
        switch (featureData.geometryType) {
            case harp_datasource_protocol_1.GeometryType.Point:
            case harp_datasource_protocol_1.GeometryType.Text:
                pickObjectType = PickObjectType.Point;
                break;
            case harp_datasource_protocol_1.GeometryType.Line:
            case harp_datasource_protocol_1.GeometryType.ExtrudedLine:
            case harp_datasource_protocol_1.GeometryType.SolidLine:
            case harp_datasource_protocol_1.GeometryType.TextPath:
                pickObjectType = PickObjectType.Line;
                break;
            case harp_datasource_protocol_1.GeometryType.Polygon:
            case harp_datasource_protocol_1.GeometryType.ExtrudedPolygon:
                pickObjectType = PickObjectType.Area;
                break;
            case harp_datasource_protocol_1.GeometryType.Object3D:
                pickObjectType = PickObjectType.Object3D;
                break;
            default:
                pickObjectType = PickObjectType.Unspecified;
        }
        pickResult.type = pickObjectType;
        return pickResult;
    }
    getIntersectedTiles(rayCaster) {
        const tiles = new Array();
        const tileList = this.mapView.visibleTileSet.dataSourceTileList;
        tileList.forEach(dataSourceTileList => {
            if (!dataSourceTileList.dataSource.enablePicking) {
                return;
            }
            dataSourceTileList.renderedTiles.forEach(tile => {
                tmpOBB.copy(tile.boundingBox);
                tmpOBB.position.sub(this.mapView.worldCenter);
                // This offset shifts the box by the given tile offset, see renderTileObjects in
                // MapView
                const worldOffsetX = tile.computeWorldOffsetX();
                tmpOBB.position.x += worldOffsetX;
                const distance = tmpOBB.intersectsRay(rayCaster.ray);
                if (distance !== undefined) {
                    tiles.push({ tile, distance });
                }
            });
        });
        tiles.sort((lhs, rhs) => {
            return lhs.distance - rhs.distance;
        });
        return tiles;
    }
    addObjInfo(featureData, intersect, pickResult) {
        if (featureData.objInfos === undefined) {
            return;
        }
        if (pickResult.intersection.object instanceof MapViewPoints_1.MapViewPoints) {
            pickResult.userData = featureData.objInfos[intersect.index];
            return;
        }
        if (featureData.starts === undefined ||
            featureData.starts.length === 0 ||
            (typeof intersect.faceIndex !== "number" && intersect.index === undefined)) {
            if (featureData.objInfos.length === 1) {
                pickResult.userData = featureData.objInfos[0];
            }
            return;
        }
        if (featureData.starts.length === 1) {
            pickResult.userData = featureData.objInfos[0];
            return;
        }
        const intersectIndex = typeof intersect.faceIndex === "number" ? intersect.faceIndex * 3 : intersect.index;
        // TODO: Implement binary search.
        let objInfosIndex = 0;
        for (const featureStartIndex of featureData.starts) {
            if (featureStartIndex > intersectIndex) {
                break;
            }
            objInfosIndex++;
        }
        pickResult.userData = featureData.objInfos[objInfosIndex - 1];
    }
    setupRaycaster(x, y) {
        const camera = this.mapView.camera;
        const rayCaster = this.raycasterFromScreenPoint(x, y);
        // A threshold must be set for picking of line and line segments, indicating the maximum
        // distance in world units from the ray to a line to consider it as picked. Use the world
        // units equivalent to one pixel at the furthest intersection (i.e. intersection with ground
        // or far plane).
        const furthestIntersection = this.mapView.getWorldPositionAt(x, y, true);
        const furthestDistance = camera.position.distanceTo(furthestIntersection) /
            this.mapView.camera.getWorldDirection(tmpV3).dot(rayCaster.ray.direction);
        rayCaster.params.Line.threshold = Utils_1.MapViewUtils.calculateWorldSizeByFocalLength(this.mapView.focalLength, furthestDistance, 1);
        return rayCaster;
    }
}
exports.PickHandler = PickHandler;
export default exports
//# sourceMappingURL=PickHandler.js.map