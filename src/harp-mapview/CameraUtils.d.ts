import { Vector2Like } from "@here/harp-geoutils";
import * as THREE from "three";
export declare namespace CameraUtils {
    /**
     * Returns the camera's focal length.
     * @beta
     *
     * @param camera - The camera.
     * @returns The focal length in pixels or `undefined` if not set.
     */
    function getFocalLength(camera: THREE.PerspectiveCamera): number | undefined;
    /**
     * Sets a camera's focal length.
     * @remarks The camera's vertical fov will be updated to achieve the given viewport height.
     * @beta
     *
     * @param camera
     * @param focalLength - Focal length in pixels. It must be larger than 0.
     * @param viewportHeight - Viewport height in pixels, used to compute vertical fov.
     * @returns The new camera's focal length in pixels.
     */
    function setFocalLength(camera: THREE.PerspectiveCamera, focalLength: number, viewportHeight: number): number;
    /**
     * Returns the camera's vertical field of view.
     * @param camera - The camera.
     * @returns The vertical fov in radians.
     */
    function getVerticalFov(camera: THREE.PerspectiveCamera): number;
    /**
     * Sets a camera's vertical fov.
     * @remarks The camera's focal length will be updated to achieve the given viewport height.
     * @beta
     *
     * @param camera
     * @param verticalFov - Vertical field of view in radians. It'll be clamped to
     *                      [{@link MIN_FOV_RAD}, {@link MAX_FOV_RAD}].
     * @param viewportHeight - Viewport height in pixels, used to compute focal length.
     * @returns The new camera's vertical fov in radians.
     */
    function setVerticalFov(camera: THREE.PerspectiveCamera, verticalFov: number, viewportHeight: number): number;
    /**
     * Calculates object's screen size based on the focal length and it's camera distance.
     * @beta
     *
     * @param focalLength - Focal length in pixels (see {@link setVerticalFov})
     * @param distance - Object distance in world space.
     * @param worldSize - Object size in world space.
     * @return object size in screen space.
     */
    function convertWorldToScreenSize(focalLength: number, distance: number, worldSize: number): number;
    /**
     * Calculates object's world size based on the focal length and it's camera distance.
     * @beta
     *
     * @param focalLength - Focal length in pixels (see {@link setVerticalFov})
     * @param distance - Object distance in world space.
     * @param screenSize - Object size in screen space.
     * @return object size in world space.
     */
    function convertScreenToWorldSize(focalLength: number, distance: number, screenSize: number): number;
    /**
     * Returns the camera's principal point (intersection of principal ray and image plane)
     * in NDC coordinates.
     * @beta
     * @see https://en.wikipedia.org/wiki/Pinhole_camera_model
     * @remarks This point coincides with the principal vanishing point. By default it's located at
     * the image center (NDC coords [0,0]), and the resulting projection is centered or symmetric.
     * But it may be offset (@see THREE.PerspectiveCamera.setViewOffset) for some use cases such as
     * multiview setups (e.g. stereoscopic rendering), resulting in an asymmetric perspective
     * projection.
     * @param camera - The camera.
     * @param result - Optional vector where the principal point coordinates will be copied.
     * @returns A vector containing the principal point NDC coordinates.
     */
    function getPrincipalPoint(camera: THREE.PerspectiveCamera, result?: Vector2Like): Vector2Like;
    /**
     * Sets the camera's principal point (intersection of principal ray and image plane)
     * in NDC coordinates.
     * @beta
     * @see {@link getPrincipalPoint}
     * @param camera - The camera.
     * @param ndcCoords - The principal point's NDC coordinates, each coordinate can have values in
     * the open interval (-1,1).
     */
    function setPrincipalPoint(camera: THREE.PerspectiveCamera, ndcCoords: Vector2Like): void;
    /**
     * Returns the camera's horizontal field of view.
     * @param camera - The camera.
     * @returns The horizontal fov in radians.
     */
    function getHorizontalFov(camera: THREE.PerspectiveCamera): number;
    /**
     * Returns top fov angle for a given perspective camera.
     * @beta
     * @remarks In symmetric projections, the principal point coincides with the image center, and
     * the vertical and horizontal FOVs are each split at that point in two equal halves.
     * However, in asymmetric projections the principal point is not at the image center, and thus
     * each fov is split unevenly in two parts:
     *
     *    Symmetric projection        Asymmetric projection
     * -------------------------   --------------------------
     * |           ^           |   |       ^                |
     * |           |           |   |       |tFov            |
     * |           |tFov       |   | lFov  v      rFov      |
     * |           |           |   |<----->x<-------------->|
     * |    lFov   v   rFov    |   |  ppal ^ point          |
     * |<--------->x<--------->|   |       |    o           |
     * | ppal point=img center |   |       | img center     |
     * |           ^           |   |       |                |
     * |           |bFov       |   |       |bFov            |
     * |           |           |   |       |                |
     * |           v           |   |       v                |
     * -------------------------   --------------------------
     *
     * @param camera - The camera.
     * @returns The top fov angle in radians.
     */
    function getTopFov(camera: THREE.PerspectiveCamera): number;
    /**
     * Returns bottom fov angle for a given perspective camera.
     * @see {@link CameraUtils.getTopFov}
     * @beta
     * @param camera - The camera.
     * @returns The bottom fov angle in radians.
     */
    function getBottomFov(camera: THREE.PerspectiveCamera): number;
    /**
     * Returns right fov angle for a given perspective camera.
     * @see {@link CameraUtils.getTopFov}
     * @beta
     * @param camera - The camera.
     * @returns The right fov angle in radians.
     */
    function getRightFov(camera: THREE.PerspectiveCamera): number;
    /**
     * Returns left fov angle for a given perspective camera.
     * @see {@link CameraUtils.getTopFov}
     * @beta
     * @param camera - The camera.
     * @returns The left fov angle in radians.
     */
    function getLeftFov(camera: THREE.PerspectiveCamera): number;
}
//# sourceMappingURL=CameraUtils.d.ts.map