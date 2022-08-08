"use strict";
let exports = {}
exports.SphereViewBounds = exports.computeEdgeDivisions = void 0;
/*
 * Copyright (C) 2020-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
import harp_geoutils_1 from "@here/harp-geoutils"
import harp_utils_1 from "@here/harp-utils"
import three_1 from "three"
import SphereHorizon_1 from "./SphereHorizon"
import Utils_1 from "./Utils"
// Rough, empirical rule to compute the number of divisions needed for a geopolygon edge to keep
// the deviation from the view bound edge it must follow within acceptable values.
function computeEdgeDivisions(geoStart, geoEnd) {
    const maxLatitudeSpan = 20;
    const maxLongitudeSpan = 5;
    const latitudeSpan = Math.abs(geoEnd.latitude - geoStart.latitude);
    const longitudeSpan = geoStart.minLongitudeSpanTo(geoEnd);
    return Math.ceil(Math.max(latitudeSpan / maxLatitudeSpan, longitudeSpan / maxLongitudeSpan));
}
exports.computeEdgeDivisions = computeEdgeDivisions;
const ccwCanvasCornersNDC = [
    { x: -1, y: -1 },
    { x: 1, y: -1 },
    { x: 1, y: 1 },
    { x: -1, y: 1 } // top left
];
/**
 * Generates Bounds for a camera view and a spherical projection
 *
 * @internal
 */
class SphereViewBounds {
    constructor(camera, projection) {
        this.camera = camera;
        this.projection = projection;
        harp_utils_1.assert(projection.type === harp_geoutils_1.ProjectionType.Spherical);
    }
    /**
     * @override
     */
    generate() {
        const coordinates = this.findBoundsIntersections();
        this.wrapAroundPoles(coordinates);
        return coordinates.length > 2
            ? new harp_geoutils_1.GeoPolygon(coordinates, false, true)
            : undefined;
    }
    addSideSegmentSubdivisions(coordinates, NDCStart, NDCEnd, geoStart, geoEnd) {
        coordinates.push(geoStart);
        const divisionCount = computeEdgeDivisions(geoStart, geoEnd);
        if (divisionCount <= 1) {
            return;
        }
        const NDCStep = new three_1.Vector2(NDCEnd.x - NDCStart.x, NDCEnd.y - NDCStart.y).multiplyScalar(1 / divisionCount);
        const NDCDivision = new three_1.Vector2(NDCStart.x, NDCStart.y);
        for (let i = 0; i < divisionCount - 1; i++) {
            NDCDivision.add(NDCStep);
            const intersection = Utils_1.MapViewUtils.rayCastWorldCoordinates({ camera: this.camera, projection: this.projection }, NDCDivision.x, NDCDivision.y);
            if (intersection) {
                coordinates.push(this.projection.unprojectPoint(intersection));
            }
        }
    }
    addSideIntersections(coordinates, side, geoStartCorner, geoEndCorner, horizon) {
        const startNDCCorner = ccwCanvasCornersNDC[side];
        const endNDCCorner = ccwCanvasCornersNDC[SphereHorizon_1.nextCanvasSide(side)];
        if (geoStartCorner && geoEndCorner) {
            // No horizon visible on this side of the canvas, generate polygon vertices from
            // intersections of the canvas side with the world.
            this.addSideSegmentSubdivisions(coordinates, startNDCCorner, endNDCCorner, geoStartCorner, geoEndCorner);
            return;
        }
        if (!horizon) {
            return;
        }
        // Bounds on this side of the canvas need to be completed with the horizon.
        const horizonIntersections = horizon.getSideIntersections(side);
        if (horizonIntersections.length === 0) {
            return;
        }
        if (geoStartCorner) {
            // Generate polygon vertices from intersections of this canvas side with the world
            // from its starting corner till the last intersection with the horizon.
            const worldHorizonPoint = horizon.getPoint(horizonIntersections[horizonIntersections.length - 1]);
            const geoHorizonPoint = this.projection.unprojectPoint(worldHorizonPoint);
            this.addSideSegmentSubdivisions(coordinates, startNDCCorner, worldHorizonPoint.project(this.camera), geoStartCorner, geoHorizonPoint);
        }
        else {
            // Subdivide horizon from last horizon intersection on previous side to this side first.
            const prevSide = SphereHorizon_1.previousCanvasSide(side);
            let prevSideIntersections = horizon.getSideIntersections(prevSide);
            if (prevSideIntersections.length === 0) {
                // When bottom canvas side cuts the horizon above its center, right horizon
                // tangent is not visible. Last horizon tangent is top one.
                prevSideIntersections = horizon.getSideIntersections(SphereHorizon_1.previousCanvasSide(prevSide));
            }
            harp_utils_1.assert(prevSideIntersections.length > 0);
            horizon.getDivisionPoints(point => {
                coordinates.push(this.projection.unprojectPoint(point));
            }, prevSideIntersections[prevSideIntersections.length - 1], horizonIntersections[0]);
        }
        if (horizonIntersections.length > 1) {
            // Subdivide side segment between two horizon intersections.
            const worldHorizonStart = horizon.getPoint(horizonIntersections[0]);
            const worldHorizonEnd = horizon.getPoint(horizonIntersections[1]);
            const geoHorizonStart = this.projection.unprojectPoint(worldHorizonStart);
            const geoHorizonEnd = this.projection.unprojectPoint(worldHorizonEnd);
            this.addSideSegmentSubdivisions(coordinates, worldHorizonStart.project(this.camera), worldHorizonEnd.project(this.camera), geoHorizonStart, geoHorizonEnd);
        }
        if (geoEndCorner) {
            // Subdivice side segment from last horizon intersection to the ending corner of this
            // canvas side.
            const worldHorizonPoint = horizon.getPoint(horizonIntersections[0]);
            const geoHorizonPoint = this.projection.unprojectPoint(worldHorizonPoint);
            this.addSideSegmentSubdivisions(coordinates, worldHorizonPoint.project(this.camera), endNDCCorner, geoHorizonPoint, geoEndCorner);
        }
    }
    findBoundsIntersections() {
        const coordinates = [];
        const [cornerCoordinates, numCorners] = this.addCanvasCornerIntersection();
        // Horizon points need to be added to complete the bounds if not all canvas corners
        // intersect with the world.
        const horizon = numCorners < 4
            ? new SphereHorizon_1.SphereHorizon(this.camera, cornerCoordinates.map(value => value !== undefined))
            : undefined;
        if (numCorners === 0 && horizon.isFullyVisible) {
            // Bounds are generated entirely from equidistant points obtained from the horizon
            // circle.
            horizon.getDivisionPoints(point => {
                coordinates.push(this.projection.unprojectPoint(point));
            });
            return coordinates;
        }
        for (let side = SphereHorizon_1.CanvasSide.Bottom; side < 4; side++) {
            const startCorner = cornerCoordinates[side];
            const endCorner = cornerCoordinates[SphereHorizon_1.nextCanvasSide(side)];
            this.addSideIntersections(coordinates, side, startCorner, endCorner, horizon);
        }
        return coordinates;
    }
    wrapAroundPoles(coordinates) {
        // If one of the poles is inside the view bounds, the polygon would have to cover the pole,
        // which is not possible in geo space. Instead, additional vertices (numbered in order from
        // 1 to 6 in the diagram below) are added to the polygon so that it wraps around the pole,
        // covering the same area(except for the pole circle that cannot be mapped to geospace).
        // The globe is cut in two hemispheres by the meridians at the camera longitude (camLon) and
        // its antimeridian (at camLon+180). Then, the polygon side crossing the camera antimeridian
        // is found, and the new pole wrapping vertices are inserted between its start and end
        // vertices.
        //
        //    (end) hem.crossing side (start)
        //        \|<-------------->|/
        // x-------x------6!--------x--------x
        // |         , - ~5!1 ~ -,           |
        // |     , '       !       ' ,       |
        // |   ,           !           ,     |
        // |  ,            !            ,    |
        // | ,             !             ,   |
        // | 4           POLE            2   | <- Bounds polygon
        // | ,             !             ,   |
        // |  ,            !            ,    |
        // |   ,           !           ,     |
        // |     ,         !         ,'      |
        // |       ' -_, _ ! _ ,_ -'         |
        // |               3                 |
        // x---------------!-----------------x
        //                 ! <- hemisphere partition
        const northPoleCenter = new three_1.Vector3(0, 0, harp_geoutils_1.EarthConstants.EQUATORIAL_RADIUS);
        const southPoleCenter = new three_1.Vector3(0, 0, -harp_geoutils_1.EarthConstants.EQUATORIAL_RADIUS);
        const northPoleInView = Utils_1.MapViewUtils.closeToFrustum(northPoleCenter, this.camera);
        const southPoleInView = Utils_1.MapViewUtils.closeToFrustum(southPoleCenter, this.camera);
        if (!northPoleInView && !southPoleInView) {
            return;
        }
        // Create first wrapping vertex (number 1 in the diagram above).
        const camLon = this.projection.unprojectPoint(this.camera.position).lng;
        const wrapLat = northPoleInView ? 90 : -90;
        const wrapLon = northPoleInView ? camLon + 180 : camLon - 180;
        const geoWrapTopRight = new harp_geoutils_1.GeoCoordinates(wrapLat, wrapLon);
        const geoWrapTopRightNorm = geoWrapTopRight.normalized();
        // Find the polygon side crossing the camera antimeridian.
        const crossLon = geoWrapTopRightNorm.lng;
        let prevLon = coordinates[coordinates.length - 1].lng;
        // Check whether the camera antimeridian crossing also crosses greenwich antimerdian.
        let isGwAntimerCross = false;
        const hSphereCrossEndIndex = coordinates.findIndex((value) => {
            const crossesAntimer = harp_geoutils_1.isAntimeridianCrossing(prevLon, value.lng);
            const sameSign = Math.sign(crossLon - value.lng) === Math.sign(crossLon - prevLon);
            if (sameSign === crossesAntimer) {
                isGwAntimerCross = crossesAntimer;
                return true;
            }
            prevLon = value.lng;
            return false;
        });
        if (hSphereCrossEndIndex < 0) {
            // No polygon side crosses the camera antimeridian, meaning that the polygon doesn't
            // actually go above the pole to the other side of the world, no wrapping needed.
            return;
        }
        // Create rest of wrapping vertices at pole's latitude (vertices 2-5 in diagram above).
        const wrapSideOffset = northPoleInView ? 90 : -90;
        const wrapCornerOffset = northPoleInView ? 0.00001 : -0.00001;
        // Added to ensure antimeridian crossing detection when coordinates are wrapped around it by
        // GeoPolygon (all polygon sides must have longitude spans smaller than 180 degrees).
        const geoWrapRight = new harp_geoutils_1.GeoCoordinates(wrapLat, camLon + wrapSideOffset).normalized();
        const geoWrapBottom = new harp_geoutils_1.GeoCoordinates(wrapLat, camLon).normalized();
        // Added to ensure antimeridian crossing detection when coordinates are wrapped around it by
        // GeoPolygon (all polygon sides must have longitude spans smaller than 180 degrees).
        const geoWrapLeft = new harp_geoutils_1.GeoCoordinates(wrapLat, camLon - wrapSideOffset).normalized();
        const geoWrapTopLeft = new harp_geoutils_1.GeoCoordinates(wrapLat, wrapLon + wrapCornerOffset).normalized();
        const hSphereCrossStartIndex = (hSphereCrossEndIndex + coordinates.length - 1) % coordinates.length;
        const crossStart = coordinates[hSphereCrossStartIndex];
        const crossEnd = coordinates[hSphereCrossEndIndex];
        // Last wrapping vertex (number 6) is linearly interpolated at the polygon side crossing the
        // camera antimeridian.
        let crossLerp = harp_geoutils_1.GeoCoordinates.lerp(crossStart, crossEnd, 0.01, isGwAntimerCross);
        if (isGwAntimerCross && northPoleInView) {
            crossLerp.longitude -= 360;
        }
        else {
            crossLerp = crossLerp.normalized();
        }
        // Add the wrapping vertices to the array in the proper order (see diagram above).
        coordinates.splice(hSphereCrossEndIndex, 0, wrapLon < -180 ? geoWrapTopRight : geoWrapTopRightNorm, // 1
        geoWrapRight, // 2
        geoWrapBottom, // 3
        geoWrapLeft, // 4
        geoWrapTopLeft, // 5
        crossLerp // 6
        );
    }
    // Returns a tuple with the array of canvas corner intersection geocoordinates in ccw order
    // (undefined values for corners not intersecting the world) and the number of intersections.
    addCanvasCornerIntersection() {
        const geoCorners = new Array();
        let numIntersections = 0;
        ccwCanvasCornersNDC.forEach(corner => {
            const intersection = Utils_1.MapViewUtils.rayCastWorldCoordinates({ camera: this.camera, projection: this.projection }, corner.x, corner.y);
            if (intersection) {
                geoCorners.push(this.projection.unprojectPoint(intersection));
                ++numIntersections;
            }
            else {
                geoCorners.push(undefined);
            }
        });
        return [geoCorners, numIntersections];
    }
}
exports.SphereViewBounds = SphereViewBounds;

export default exports
//# sourceMappingURL=SphereViewBounds.js.map