import { Env } from "@here/harp-datasource-protocol";
import { Projection } from "@here/harp-geoutils";
import { TextCanvas } from "@here/harp-text-canvas";
import * as THREE from "three";
import { PoiManager } from "../poi/PoiManager";
import { ScreenCollisions } from "../ScreenCollisions";
import { ScreenProjector } from "../ScreenProjector";
import { RenderState } from "./RenderState";
import { PoiInfo, TextElement } from "./TextElement";
import { TextElementState } from "./TextElementState";
import { ViewState } from "./ViewState";
/**
 * Computes distance of the specified text element to camera plane given with position and normal.
 *
 * The distance is measured as projection of the vector between `eyePosition` and text
 * onto the `eyeLookAt` vector, so it actually computes the distance to plane that
 * contains `eyePosition` and is described with `eyeLookAt` as normal.
 *
 * @note Used for measuring the distances to camera, results in the metric that describes
 * distance to camera near plane (assuming near = 0). Such metric is better as input for labels
 * scaling or fading factors then simple euclidean distance because it does not fluctuate during
 * simple camera panning.
 *
 * @param textElement - The textElement of which the view distance will be checked. It must have
 *                      coordinates in world space.
 * @param poiIndex - If TextElement is a line marker, the index into the line marker positions.
 * @param eyePosition - The world eye coordinates used a reference position to calculate
 *                      the distance.
 * @param eyeLookAt - The eye looking direction or simply said projection plane normal.
 * @returns The text element view distance.
 */
export declare function computeViewDistance(textElement: TextElement, poiIndex: number | undefined, eyePosition: THREE.Vector3, eyeLookAt: THREE.Vector3): number;
/**
 * Computes distance between the given point and a plane.
 *
 * May be used to measure distance of point labels to the camera projection (near) plane.
 *
 * @param pointPos - The position to measure distance to.
 * @param planePos - The position of any point on the plane.
 * @param planeNorm - The plane normal vector (have to be normalized already).
 */
export declare function pointToPlaneDistance(pointPos: THREE.Vector3, planePos: THREE.Vector3, planeNorm: THREE.Vector3): number;
/**
 * Computes the maximum view distance for text elements as a ratio of the given view's maximum far
 * plane distance.
 * @param viewState - The view for which the maximum view distance will be calculated.
 * @param farDistanceLimitRatio - The ratio to apply to the maximum far plane distance.
 * @returns Maximum view distance.
 */
export declare function getMaxViewDistance(viewState: ViewState, farDistanceLimitRatio: number): number;
/**
 * State of fading.
 */
export declare enum PrePlacementResult {
    Ok = 0,
    NotReady = 1,
    Invisible = 2,
    TooFar = 3,
    Duplicate = 4,
    Count = 5
}
/**
 * Applies early rejection tests for a given text element meant to avoid trying to place labels
 * that are not visible, not ready, duplicates etc...
 * @param textElement - The Text element to check.
 * @param poiIndex - If TextElement is a line marker, the index into the line marker positions
 * @param viewState - The view for which the text element will be placed.
 * @param m_poiManager - To prepare pois for rendering.
 * @param maxViewDistance - If specified, text elements farther than this max distance will be
 *                          rejected.
 * @returns An object with the result code and the text element view distance
 * ( or `undefined` of the checks failed) as second.
 */
export declare function checkReadyForPlacement(textElement: TextElement, poiIndex: number | undefined, viewState: ViewState, poiManager: PoiManager, maxViewDistance?: number): {
    result: PrePlacementResult;
    viewDistance: number | undefined;
};
/**
 * The margin applied to the text bounds of every point label.
 */
export declare const persistentPointLabelTextMargin: THREE.Vector2;
/**
 * Additional bounds scaling (described as percentage of full size) applied to the new labels.
 *
 * This additional scaling (margin) allows to account for slight camera position and
 * orientation changes, so new labels are placed only if there is enough space around them.
 * Such margin limits collisions with neighboring labels while doing small camera movements and
 * thus reduces labels flickering.
 */
export declare const newPointLabelTextMarginPercent = 0.1;
export declare enum PlacementResult {
    Ok = 0,
    Rejected = 1,
    Invisible = 2
}
/**
 * Places an icon on screen.
 * @param iconRenderState - The icon state.
 * @param poiInfo - Icon information necessary to compute its dimensions.
 * @param screenPosition - Screen position of the icon.
 * @param scaleFactor - Scaling factor to apply to the icon dimensions.
 * @param screenCollisions - Used to check the icon visibility and collisions.
 * @param env - Current map env.
 * @returns `PlacementResult.Ok` if icon can be placed, `PlacementResult.Rejected` if there's
 * a collision, `PlacementResult.Invisible` if it's not visible.
 */
export declare function placeIcon(iconRenderState: RenderState, poiInfo: PoiInfo, screenPosition: THREE.Vector2, scaleFactor: number, env: Env, screenCollisions: ScreenCollisions): PlacementResult;
/**
 * Place a point label text using single or multiple alternative placement anchors.
 *
 * @param labelState - State of the point label to place.
 * @param screenPosition - Position of the label in screen coordinates.
 * @param scale - Scale factor to be applied to label dimensions.
 * @param textCanvas - The text canvas where the label will be placed.
 * @param env - The {@link @here/harp-datasource-protocol#Env} used
 *              to evaluate technique attributes.
 * @param screenCollisions - Used to check collisions with other labels.
 * @param outScreenPosition - The final label screen position after applying any offsets.
 * @param multiAnchor - The parameter decides if multi-anchor placement algorithm should be
 * used, be default [[false]] meaning try to place label using current alignment settings only.
 * @returns `PlacementResult.Ok` if point __label can be placed__ at the base or any optional
 * anchor point. `PlacementResult.Rejected` if there's a collision for all placements. Finally
 * `PlacementResult.Invisible` if it's text is not visible at any placement position.
 */
export declare function placePointLabel(labelState: TextElementState, screenPosition: THREE.Vector2, scale: number, textCanvas: TextCanvas, env: Env, screenCollisions: ScreenCollisions, outScreenPosition: THREE.Vector3, multiAnchor?: boolean): PlacementResult;
/**
 * Places a path label along a given path on a specified text canvas.
 * @param labelState - The state of the path label to place.
 * @param textPath - The text path along which the label will be placed.
 * @param screenPosition - Position of the label in screen coordinates.
 * @param textCanvas - The text canvas where the label will be placed.
 * @param screenCollisions - Used to check collisions with other labels.
 * @returns `PlacementResult.Ok` if path label can be placed, `PlacementResult.Rejected` if there's
 * a collision or text doesn't fit into path, `PlacementResult.Invisible` if it's not visible.
 */
export declare function placePathLabel(labelState: TextElementState, textPath: THREE.Path, screenPosition: THREE.Vector2, textCanvas: TextCanvas, screenCollisions: ScreenCollisions): PlacementResult;
/**
 * Check if a given path label is too small to be rendered.
 * @param textElement - The text element to check.
 * @param screenProjector - Used to project coordinates from world to screen space.
 * @param outScreenPoints - Label path projected to screen space.
 * @returns `true` if label is too small, `false` otherwise.
 */
export declare function isPathLabelTooSmall(textElement: TextElement, screenProjector: ScreenProjector, outScreenPoints: THREE.Vector2[]): boolean;
/**
 * Calculates the world position of the supplied label. The label will be shifted if there is a
 * specified offsetDirection and value to shift it in.
 * @param poiLabel - The label to shift
 * @param projection - The projection, required to compute the correct direction offset for
 *                     spherical projections.
 * @param env - The environment to extract the worldOffset needed to shift the icon in world space,
 *              if configured in the style.
 * @param outWorldPosition - Preallocated vector to store the result in
 * @returns the [[outWorldPosition]] vector.
 */
export declare function getWorldPosition(poiLabel: TextElement, projection: Projection, env: Env, outWorldPosition: THREE.Vector3): THREE.Vector3;
//# sourceMappingURL=Placement.d.ts.map