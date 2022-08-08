import { GeoPolygon, Projection } from "@here/harp-geoutils";
import { PerspectiveCamera } from "three";
/**
 * Generates Bounds for a camera view and a projection
 *
 * @internal
 */
export declare class BoundsGenerator {
    private readonly m_view;
    private m_viewBounds;
    constructor(m_view: {
        camera: PerspectiveCamera;
        projection: Projection;
        tileWrappingEnabled: boolean;
    });
    /**
     * Generates a {@link @here/harp-geoutils#GeoPolygon} covering the visible map.
     * The coordinates are sorted to ccw winding, so a polygon could be drawn with them.
     * @returns The GeoPolygon with the view bounds or undefined if world is not in view.
     */
    generate(): GeoPolygon | undefined;
    private createViewBounds;
}
//# sourceMappingURL=BoundsGenerator.d.ts.map