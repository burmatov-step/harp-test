import { ViewRanges } from "@here/harp-datasource-protocol/lib/ViewRanges";
import { Projection } from "@here/harp-geoutils";
import * as THREE from "three";
import { ClipPlanesEvaluator } from "./ClipPlanesEvaluator";
import { ElevationProvider } from "./ElevationProvider";
/**
 * Provides the most basic evaluation concept giving fixed values with some constraints.
 */
export declare class FixedClipPlanesEvaluator implements ClipPlanesEvaluator {
    readonly minNear: number;
    readonly minFarOffset: number;
    readonly minFar: number;
    private m_nearPlane;
    private m_farPlane;
    constructor(minNear?: number, minFarOffset?: number);
    get nearPlane(): number;
    set nearPlane(fixedNear: number);
    get farPlane(): number;
    set farPlane(fixedFar: number);
    set minElevation(elevation: number);
    get minElevation(): number;
    set maxElevation(elevation: number);
    get maxElevation(): number;
    /** @override */
    evaluateClipPlanes(camera: THREE.Camera, projection: Projection, elevationProvider?: ElevationProvider): ViewRanges;
    private invalidatePlanes;
}
//# sourceMappingURL=FixedClipPlanesEvaluator.d.ts.map