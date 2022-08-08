"use strict";
let exports = {}
exports.PlaneViewBounds = void 0;
/*
 * Copyright (C) 2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
import harp_geoutils_1 from "@here/harp-geoutils"
import harp_utils_1 from "@here/harp-utils"
import three_1 from "three"
import Utils_1 from "./Utils"
/**
 * Generates Bounds for a camera view and a planar projection.
 *
 * @internal
 */
class PlaneViewBounds {
    constructor(camera, projection, m_options) {
        this.camera = camera;
        this.projection = projection;
        this.m_options = m_options;
        this.m_groundPlaneNormal = new three_1.Vector3(0, 0, 1);
        this.m_groundPlane = new three_1.Plane(this.m_groundPlaneNormal.clone());
        harp_utils_1.assert(projection.type === harp_geoutils_1.ProjectionType.Planar);
    }
    /**
     * @override
     */
    generate() {
        //!!!!!!!ALTITUDE IS NOT TAKEN INTO ACCOUNT!!!!!!!!!
        const coordinates = [];
        // 1.) Raycast into all four corners of the canvas
        //     => if an intersection is found, add it to the polygon
        this.addCanvasCornerIntersection(coordinates);
        // => All 4 corners found an intersection, therefore the screen is covered with the map
        // and the polygon complete
        if (coordinates.length === 4) {
            return this.createPolygon(coordinates);
        }
        //2.) Raycast into the two corners of the horizon cutting the canvas sides
        //    => if an intersection is found, add it to the polygon
        this.addHorizonIntersection(coordinates);
        //Setup the frustum for further checks
        const frustum = new three_1.Frustum().setFromProjectionMatrix(new three_1.Matrix4().multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse));
        // Setup the world corners for further checks.
        // Cast to TileCorners as it cannot be undefined here, due to the forced
        // PlanarProjection above
        const worldCorners = this.getWorldConers(this.projection);
        if (!this.m_options.tileWrappingEnabled) {
            // 3.) If no wrapping, check if any corners of the world plane are inside the view
            //     => if true, add it to the polygon
            [worldCorners.ne, worldCorners.nw, worldCorners.se, worldCorners.sw].forEach(corner => {
                this.addPointInFrustum(corner, frustum, coordinates);
            });
        }
        //4.) Check for any edges of the world plane intersecting with the frustum?
        //    => if true, add to polygon
        if (!this.m_options.tileWrappingEnabled) {
            // if no tile wrapping:
            //       check with limited lines around the world edges
            [
                new three_1.Line3(worldCorners.sw, worldCorners.se),
                new three_1.Line3(worldCorners.ne, worldCorners.nw),
                new three_1.Line3(worldCorners.se, worldCorners.ne),
                new three_1.Line3(worldCorners.nw, worldCorners.sw) //  west edge
            ].forEach(edge => {
                this.addFrustumIntersection(edge, frustum, coordinates);
            });
        }
        else {
            // if tile wrapping:
            //       check for intersections with rays along the south and north edges
            const directionEast = new three_1.Vector3() //west -> east
                .subVectors(worldCorners.sw, worldCorners.se)
                .normalize();
            const directionWest = new three_1.Vector3() //east -> west
                .subVectors(worldCorners.se, worldCorners.sw)
                .normalize();
            [
                new three_1.Ray(worldCorners.se, directionEast),
                new three_1.Ray(worldCorners.se, directionWest),
                new three_1.Ray(worldCorners.ne, directionEast),
                new three_1.Ray(worldCorners.ne, directionWest) //  north west ray
            ].forEach(ray => {
                this.addFrustumIntersection(ray, frustum, coordinates);
            });
        }
        // 5.) Create the Polygon and set needsSort to `true`as we expect it to be convex and
        //     sortable
        return this.createPolygon(coordinates);
    }
    createPolygon(coordinates) {
        if (coordinates.length > 2) {
            return new harp_geoutils_1.GeoPolygon(coordinates, true);
        }
        return undefined;
    }
    getWorldConers(projection) {
        const worldBox = projection.worldExtent(0, 0);
        return {
            sw: worldBox.min,
            se: new three_1.Vector3(worldBox.max.x, worldBox.min.y, 0),
            nw: new three_1.Vector3(worldBox.min.x, worldBox.max.y, 0),
            ne: worldBox.max
        };
    }
    addNDCRayIntersection(ndcPoints, geoPolygon) {
        ndcPoints.forEach(corner => {
            const intersection = Utils_1.MapViewUtils.rayCastWorldCoordinates({ camera: this.camera, projection: this.projection }, corner[0], corner[1]);
            if (intersection) {
                this.validateAndAddToGeoPolygon(intersection, geoPolygon);
            }
        });
    }
    addHorizonIntersection(geoPolygon) {
        const verticalHorizonPosition = this.getVerticalHorizonPositionInNDC();
        if (!verticalHorizonPosition) {
            return;
        }
        this.addNDCRayIntersection([
            [-1, verticalHorizonPosition],
            [1, verticalHorizonPosition] //horizon right
        ], geoPolygon);
    }
    addCanvasCornerIntersection(geoPolygon) {
        this.addNDCRayIntersection([
            [-1, -1],
            [1, -1],
            [1, 1],
            [-1, 1] //upper left
        ], geoPolygon);
    }
    validateAndAddToGeoPolygon(point, geoPolygon) {
        if (this.isInVisibleMap(point)) {
            geoPolygon.push(this.projection.unprojectPoint(point));
        }
    }
    isInVisibleMap(point) {
        if (point.y < 0 || point.y > harp_geoutils_1.EarthConstants.EQUATORIAL_CIRCUMFERENCE) {
            return false;
        }
        if (!this.m_options.tileWrappingEnabled &&
            (point.x < 0 || point.x > harp_geoutils_1.EarthConstants.EQUATORIAL_CIRCUMFERENCE)) {
            return false;
        }
        return true;
    }
    addPointInFrustum(point, frustum, geoPolygon) {
        if (frustum.containsPoint(point)) {
            const geoPoint = this.projection.unprojectPoint(point);
            geoPoint.altitude = 0;
            geoPolygon.push(geoPoint);
        }
    }
    addFrustumIntersection(edge, frustum, geoPolygon) {
        frustum.planes.forEach(plane => {
            let intersection = null;
            const target = new three_1.Vector3();
            if (edge instanceof three_1.Ray && edge.intersectsPlane(plane)) {
                intersection = edge.intersectPlane(plane, target);
            }
            else if (edge instanceof three_1.Line3 && plane.intersectsLine(edge)) {
                intersection = plane.intersectLine(edge, target);
            }
            if (intersection) {
                //uses this check to fix inaccuracies
                if (Utils_1.MapViewUtils.closeToFrustum(intersection, this.camera)) {
                    const geoIntersection = this.projection.unprojectPoint(intersection);
                    //correct altitude caused by inaccuracies, due to large numbers to 0
                    geoIntersection.altitude = 0;
                    geoPolygon.push(geoIntersection);
                }
            }
        });
    }
    getVerticalHorizonPositionInNDC() {
        const bottomMidFarPoint = new three_1.Vector3(-1, -1, 1)
            .unproject(this.camera)
            .add(new three_1.Vector3(1, -1, 1).unproject(this.camera))
            .multiplyScalar(0.5);
        const topMidFarPoint = new three_1.Vector3(-1, 1, 1)
            .unproject(this.camera)
            .add(new three_1.Vector3(1, 1, 1).unproject(this.camera))
            .multiplyScalar(0.5);
        const farPlaneVerticalCenterLine = new three_1.Line3(bottomMidFarPoint, topMidFarPoint);
        const verticalHorizonPosition = new three_1.Vector3();
        if (!this.m_groundPlane.intersectLine(farPlaneVerticalCenterLine, verticalHorizonPosition)) {
            return undefined;
        }
        return verticalHorizonPosition.project(this.camera).y;
    }
}
exports.PlaneViewBounds = PlaneViewBounds;
//# sourceMappingURL=PlaneViewBounds.js.map

export default exports