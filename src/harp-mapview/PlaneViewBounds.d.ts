import { GeoPolygon, Projection } from "@here/harp-geoutils";
import { PerspectiveCamera } from "three";
import { ViewBounds } from "./ViewBounds";
/**
 * Generates Bounds for a camera view and a planar projection.
 *
 * @internal
 */
export declare class PlaneViewBounds implements ViewBounds {
    readonly camera: PerspectiveCamera;
    readonly projection: Projection;
    private readonly m_options;
    private readonly m_groundPlaneNormal;
    private readonly m_groundPlane;
    constructor(camera: PerspectiveCamera, projection: Projection, m_options: {
        tileWrappingEnabled: boolean;
    });
    /**
     * @override
     */
    generate(): GeoPolygon | undefined;
    private createPolygon;
    private getWorldConers;
    private addNDCRayIntersection;
    private addHorizonIntersection;
    private addCanvasCornerIntersection;
    private validateAndAddToGeoPolygon;
    private isInVisibleMap;
    private addPointInFrustum;
    private addFrustumIntersection;
    private getVerticalHorizonPositionInNDC;
}
//# sourceMappingURL=PlaneViewBounds.d.ts.map