import { Vector3Like } from "@here/harp-geoutils";
import * as THREE from "three";
/**
 * @hidden
 * Handles the projection of world coordinates to screen coordinates.
 */
export declare class ScreenProjector {
    private m_camera;
    static tempV2: THREE.Vector2;
    static tempV3: THREE.Vector3;
    private m_width;
    private m_height;
    /**
     * Constructs a new `ScreenProjector`.
     *
     * @param m_camera - Camera to project against.
     */
    constructor(m_camera: THREE.Camera);
    /**
     * Height of the screen.
     */
    get width(): number;
    /**
     * Width of the screen.
     */
    get height(): number;
    /**
     * Apply current projectionViewMatrix of the camera to project the source vector into
     * screen coordinates.
     *
     * @param {(Vector3Like)} source The source vector to project.
     * @param {THREE.Vector2} target The target vector.
     * @returns {THREE.Vector2} The projected vector (the parameter 'target')
     */
    project(source: Vector3Like, target?: THREE.Vector2): THREE.Vector2 | undefined;
    /**
     * Apply current projectionViewMatrix of the camera to project the source vector into
     * screen coordinates.
     *
     * @param {(Vector3Like)} source The source vector to project.
     * @param {THREE.Vector2} target The target vector.
     * @returns {THREE.Vector2} The projected vector (the parameter 'target') or undefined if
     * outside of the near/far plane. The point may be outside the screen.
     */
    projectToScreen(source: Vector3Like, target?: THREE.Vector2): THREE.Vector2 | undefined;
    /**
     * Test if the area around the specified point is visible on the screen.
     *
     * @param {(Vector3Like)} source The centered source vector to project.
     * @param {(Number)} halfWidth Half of the width of the area in screen space [0..1].
     * @param {(Number)} halfHeight Half of the height of the area in screen space [0..1].
     * @param {THREE.Vector2} target The target vector.
     * @returns {THREE.Vector2} The projected vector (the parameter 'target') or undefined if
     * the area is completely outside the screen.
     */
    projectAreaToScreen(source: Vector3Like, halfWidth: number, halfHeight: number, target?: THREE.Vector2): THREE.Vector2 | undefined;
    /**
     * Apply current projectionViewMatrix of the camera to project the source vector into
     * screen coordinates. The z component between -1 and 1 is also returned.
     *
     * @param {(Vector3Like)} source The source vector to project.
     * @param {THREE.Vector3} target The target vector.
     * @returns {THREE.Vector3} The projected vector (the parameter 'target') or undefined if
     * outside the near / far plane.
     */
    project3(source: Vector3Like, target?: THREE.Vector3): THREE.Vector3 | undefined;
    /**
     * Apply current projectionViewMatrix of the camera to project the source vector. Stores
     * result in NDC in the target vector.
     *
     * @param {(Vector3Like)} source The source vector to project.
     * @param {THREE.Vector3} target The target vector.
     * @returns {THREE.Vector3} The projected vector (the parameter 'target').
     */
    projectVector(source: Vector3Like, target: THREE.Vector3): THREE.Vector3;
    /**
     * Fast test to check if projected point is on screen.
     *
     * @returns {boolean} `true` if point is on screen, `false` otherwise.
     */
    onScreen(source: Vector3Like): boolean;
    /**
     * Update the `ScreenProjector` with the latest values of the screen and the camera.
     *
     * @param {THREE.Camera} camera Camera to project against.
     * @param {number} width Width of screen/canvas.
     * @param {number} height Height of screen/canvas.
     */
    update(camera: THREE.Camera, width: number, height: number): void;
    private ndcToScreen;
}
//# sourceMappingURL=ScreenProjector.d.ts.map