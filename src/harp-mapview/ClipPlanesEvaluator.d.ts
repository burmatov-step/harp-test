import { ViewRanges } from "@here/harp-datasource-protocol/lib/ViewRanges";
import { Projection } from "@here/harp-geoutils";
import * as THREE from "three";
import { ElevationProvider } from "./ElevationProvider";
export interface ClipPlanesEvaluator {
    /**
     * Minimum elevation to be rendered, values beneath the sea level are negative.
     */
    minElevation: number;
    /**
     * Set maximum elevation to be rendered, values above sea level are positive.
     */
    maxElevation: number;
    /**
     * Compute near and far clipping planes distance.
     *
     * @remarks
     * Evaluation method should be called on every frame  and camera clip planes updated.
     * This is related to evaluator implementation and its input data, that may suddenly change
     * such as camera position or angle, projection type or so.
     * Some evaluators may not depend on all or even any of input objects, but to preserve
     * compatibility with any evaluator type it is strongly recommended to update on every frame.
     * @note The camera clipping planes (near/far properties) aren't automatically updated
     * via #evaluateClipPlanes() call, user should do it manually if needed.
     * @param camera - The camera in use.
     * @param projection - The geo-projection currently used for encoding geographic data.
     * @param elevationProvider - The optional elevation provider for fine tuned range calculation,
     * taking into account terrain variability and unevenness.
     *
     */
    evaluateClipPlanes(camera: THREE.Camera, projection: Projection, elevationProvider?: ElevationProvider): ViewRanges;
}
/**
 * Abstract evaluator class that adds support for elevation constraints.
 *
 * @remarks
 * Classes derived from this should implement algorithms that takes into account rendered
 * features height (elevations), such as ground plane is no more flat (or spherical), but
 * contains geometry that should be overlapped by frustum planes.
 */
export declare abstract class ElevationBasedClipPlanesEvaluator implements ClipPlanesEvaluator {
    private m_maxElevation;
    private m_minElevation;
    constructor(maxElevation: number, minElevation: number);
    abstract evaluateClipPlanes(camera: THREE.Camera, projection: Projection, elevationProvider?: ElevationProvider): ViewRanges;
    /**
     * Set maximum elevation above sea level to be rendered.
     *
     * @remarks
     * @param elevation - the elevation (altitude) value in world units (meters).
     * @note If you set this exactly to the maximum rendered feature height (altitude above
     * the sea, you may notice some flickering or even polygons disappearing related to rounding
     * errors or depth buffer precision. In such cases increase [[nearFarMargin]] or add a little
     * bit offset to your assumed maximum elevation.
     * @note Reasonable values are in between (-DeadSeeDepression, MtEverestHeight>, both values
     * are defined in [[EarthConstant]] as [[EarthConstant.MIN_ELEVATION]] and
     * [[EarthConstant.MAX_ELEVATION]] respectively.
     * @see minElevation for more information about precision and rounding errors.
     */
    set maxElevation(elevation: number);
    /**
     * Get maximum elevation to be covered by camera frustum.
     */
    get maxElevation(): number;
    /**
     * Set minimum elevation to be rendered, values beneath the sea level are negative.
     *
     * @remarks
     * @param elevation - the minimum elevation (depression) in world units (meters).
     * @note If you set this parameter to zero you may not see any features rendered if they are
     * just below the sea level more than half of [[nearFarMargin]] assumed. Similarly if set to
     * -100m and rendered features lays exactly in such depression, you may notice that problem.
     * The errors usually come from projection precision loss and depth buffer nature (significant
     * precision loss closer to far plane). Thus is such cases either increase the margin (if you
     * are sure features are just at this elevation, or setup bigger offset for [[minElevation]].
     * Reasonable values are between <-DeadSeaDepression, MtEverestHeight), where the first denotes
     * lowest depression on the Earth defined as [[EarthConstants.MIN_ELEVATION]] and the second is
     * the highest point our planet.
     * @see https://developer.nvidia.com/content/depth-precision-visualized
     */
    set minElevation(elevation: number);
    /**
     * Get minimum elevation to be covered by camera frustum.
     */
    get minElevation(): number;
}
/**
 * Top view, clip planes evaluator that computes view ranges based on ground distance and elevation.
 *
 * @deprecated Default evaluator {@link TiltViewClipPlanesEvaluator} supports top-down views.
 *
 * @remarks
 * This evaluator supports both planar and spherical projections, although it behavior is
 * slightly different in each case. General algorithm sets near plane and far plane close
 * to ground level, but taking into account maximum and minimum elevation of features on the ground.
 *
 * @note This evaluator supports only cameras which are always looking down the ground surface
 * (top-down view) along surface normal and does not preserve correct clip planes when
 * modifying camera pitch (tilt) angle. In simple words it is suitable only for top view camera
 * settings.
 */
export declare class TopViewClipPlanesEvaluator extends ElevationBasedClipPlanesEvaluator {
    readonly nearMin: number;
    readonly nearFarMarginRatio: number;
    readonly farMaxRatio: number;
    /**
     * Helper for reducing number of objects created at runtime.
     */
    protected m_tmpVectors: THREE.Vector3[];
    /**
     * Helper object for reducing performance impact.
     */
    protected m_tmpQuaternion: THREE.Quaternion;
    private readonly m_minimumViewRange;
    /**
     * Allows to setup near/far offsets (margins), rendered geometry elevation relative to sea
     * level as also minimum near plane and maximum far plane distance constraints.
     *
     * @remarks
     * It is strongly recommended to set some reasonable [[nearFarMargin]] (offset) between near
     * and far planes to avoid flickering.
     * @param maxElevation - defines near plane offset from the ground in the surface normal
     * direction, positive values allows to render elevated terrain features (mountains,
     * buildings). Defaults to Burj Khalifa building height.
     * @param minElevation - defines far plane offset from the ground surface, negative values moves
     * far plane below the ground level (use it to render depressions). Default zero - sea level.
     * @param nearMin - minimum allowable near plane distance from camera, must be bigger than zero.
     * @param nearFarMarginRatio - minimum distance between near and far plane, as a ratio of
     * average near/far plane distance, it have to be significantly bigger than zero (especially if
     * [[maxElevation]] and [[minElevation]] are equal), otherwise you may notice flickering when
     * rendering, or even render empty scene if frustum planes are almost equal.
     * @param farMaxRatio - maximum ratio between ground and far plane distance, allows to limit
     * viewing distance at overall. Have to be bigger than 1.0.
     * @note Keep in mind that this evaluator does not evaluate terrain (or building) elevation
     * automatically, to keep such features rendered (between frustum planes) use [[minElevation]],
     * [[maxElevation]] constraints. You may change this parameters at any time, but it requires
     * repeating [[evaluatePlanes]] step, if your camera is moving you need to evaluate planes
     * anyway.
     * @note You may treat [[minElevation]] and [[maxElevation]] parameters as the maximum and
     * minimum renderable elevation respectively along the surface normal, when camera is
     * constantly looking downwards (top-down view). If you need {@link ClipPlanesEvaluator} for
     * cameras that support tilt or yaw please use {@link TiltViewClipPlanesEvaluator}.
     * @note [[nearFarMaxRatio]] does not limit far plane when spherical projection is in use,
     * the algorithm used there estimates distance to point on tangent where line from camera
     * touches the sphere horizon and there is no reason to clamp it.
     */
    constructor(maxElevation?: number, minElevation?: number, nearMin?: number, nearFarMarginRatio?: number, farMaxRatio?: number);
    /** @override */
    evaluateClipPlanes(camera: THREE.Camera, projection: Projection, elevationProvider?: ElevationProvider): ViewRanges;
    /**
     * Get minimum view range that is possible to achieve with current evaluator settings.
     * @note This value will not change after evaluator is constructed.
     */
    protected get minimumViewRange(): ViewRanges;
    protected evaluateDistancePlanarProj(camera: THREE.PerspectiveCamera, projection: Projection, elevationProvider?: ElevationProvider): ViewRanges;
    protected evaluateDistanceSphericalProj(camera: THREE.PerspectiveCamera, projection: Projection, elevationProvider?: ElevationProvider): ViewRanges;
    protected getFovBasedFarPlane(camera: THREE.PerspectiveCamera, d: number, r: number, fovAngle: number, projection: Projection): number;
}
/**
 * Evaluates camera clipping planes taking into account ground distance and camera tilt (pitch)
 * angle (angle between look-at vector and ground surface normal).
 */
export declare class TiltViewClipPlanesEvaluator extends TopViewClipPlanesEvaluator {
    private readonly m_tmpV2;
    /** @override */
    protected evaluateDistancePlanarProj(camera: THREE.PerspectiveCamera, projection: Projection, elevationProvider?: ElevationProvider): ViewRanges;
    /** @override */
    protected evaluateDistanceSphericalProj(camera: THREE.PerspectiveCamera, projection: Projection, elevationProvider?: ElevationProvider): ViewRanges;
    private computeNearDistSphericalProj;
    private computeFarDistSphericalProj;
    private applyViewRangeConstraints;
}
/**
 * Creates default {@link ClipPlanesEvaluator}.
 * @internal
 */
export declare const createDefaultClipPlanesEvaluator: () => TiltViewClipPlanesEvaluator;
//# sourceMappingURL=ClipPlanesEvaluator.d.ts.map