import { GeoCoordinates, GeoPolygon, Projection } from "@here/harp-geoutils";
import { PerspectiveCamera } from "three";
import { ViewBounds } from "./ViewBounds";
export declare function computeEdgeDivisions(geoStart: GeoCoordinates, geoEnd: GeoCoordinates): number;
/**
 * Generates Bounds for a camera view and a spherical projection
 *
 * @internal
 */
export declare class SphereViewBounds implements ViewBounds {
    readonly camera: PerspectiveCamera;
    readonly projection: Projection;
    constructor(camera: PerspectiveCamera, projection: Projection);
    /**
     * @override
     */
    generate(): GeoPolygon | undefined;
    private addSideSegmentSubdivisions;
    private addSideIntersections;
    private findBoundsIntersections;
    private wrapAroundPoles;
    private addCanvasCornerIntersection;
}
//# sourceMappingURL=SphereViewBounds.d.ts.map