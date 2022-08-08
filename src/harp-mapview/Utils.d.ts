import { GeoBox, GeoCoordinates, GeoCoordinatesLike, Projection, TileKeyUtils, Vector2Like, Vector3Like } from "@here/harp-geoutils";
import { GeoCoordLike } from "@here/harp-geoutils/lib/coordinates/GeoCoordLike";
import { DOMUtils } from "@here/harp-utils";
import * as THREE from "three";
import { CameraUtils } from "./CameraUtils";
import { ElevationProvider } from "./ElevationProvider";
import { Object3DUtils } from "./geometry/Object3DUtils";
import { MapView } from "./MapView";
/**
 * MapView utilities: View transformations, camera setup, view bounds computation...
 */
export declare namespace MapViewUtils {
    const MAX_TILT_DEG = 89;
    const MAX_TILT_RAD: number;
    /**
     * The anti clockwise rotation of an object along the axes of its tangent space, with itself
     * as origin.
     */
    interface Attitude {
        /**
         * Rotation of the object along its vertical axis.
         */
        yaw: number;
        /**
         * Rotation of the object along its horizontal axis.
         */
        pitch: number;
        /**
         * Rotation of the object along its forward axis.
         */
        roll: number;
    }
    /**
     * @deprecated
     */
    interface MemoryUsage extends Object3DUtils.MemoryUsage {
    }
    /**
     * Zooms and moves the map in such a way that the given target position remains at the same
     * position after the zoom.
     *
     * @param mapView - Instance of MapView.
     * @param targetNDCx - Target x position in NDC space.
     * @param targetNDCy - Target y position in NDC space.
     * @param zoomLevel - The desired zoom level.
     * @param maxTiltAngle - The maximum tilt angle to comply by, in globe projection, in radian.
     * @returns `false` if requested zoom cannot be achieved due to the map view's maximum bounds
     * {@link MapView.geoMaxBounds},`true` otherwise.
     */
    function zoomOnTargetPosition(mapView: MapView, targetNDCx: number, targetNDCy: number, zoomLevel: number, maxTiltAngle?: number): boolean;
    /**
     * Parameters for {@link orbitAroundScreenPoint}.
     */
    interface OrbitParams {
        /**
         * Delta azimuth in radians (default 0).
         */
        deltaAzimuth?: number;
        /**
         * Delta tilt in radians (default 0);
         */
        deltaTilt?: number;
        /**
         * Maximum tilt between the camera and its target in radians.
         */
        maxTiltAngle: number;
        /**
         * Orbiting center in NDC coordinates, defaults to camera's principal point.
         * @see {@link CameraUtils.getPrincipalPoint}.
         */
        center?: Vector2Like;
    }
    /**
     * Orbits the camera around a given point on the screen.
     *
     * @param mapView - The {@link MapView} instance to manipulate.
     * @param offsetX - Orbit point in NDC space.
     * @param offsetY - Orbit point in NDC space.
     * @param deltaAzimuth - Delta azimuth in radians.
     * @param deltaTilt - Delta tilt in radians.
     * @param maxTiltAngle - The maximum tilt between the camera and its target in radian.
     * @deprecated Use overload with {@link OrbitParams} object parameter.
     */
    function orbitAroundScreenPoint(mapView: MapView, offsetX: number, offsetY: number, deltaAzimuth: number, deltaTilt: number, maxTiltAngle: number): void;
    /**
     * Orbits the camera around a given point on the screen.
     *
     * @param mapView - The {@link MapView} instance to manipulate.
     * @param orbitParams - {@link OrbitParams}.
     */
    function orbitAroundScreenPoint(mapView: MapView, orbitParams: OrbitParams): void;
    /**
     * Calculate target (focus) point geo-coordinates for given camera.
     * @see getTargetPositionFromCamera
     *
     * @param camera - The camera looking on target point.
     * @param projection - The geo-projection used.
     * @param elevation - Optional elevation above (or below) sea level measured in world units.
     *
     * @deprecated This function is for internal use only and will be removed in the future. Use
     * MapView.worldTarget instead.
     */
    function getGeoTargetFromCamera(camera: THREE.Camera, projection: Projection, elevation?: number): GeoCoordinates | null;
    /**
     * Calculate target (focus) point world coordinates for given camera position and orientation.
     * @param camera - The camera looking on target point.
     * @param projection - The geo-projection used.
     * @param elevation - Optional elevation above (or below) sea level in world units.
     *
     * @deprecated This function is for internal use only and will be removed in the future.
     */
    function getWorldTargetFromCamera(camera: THREE.Camera, projection: Projection, elevation?: number): THREE.Vector3 | null;
    /**
     * Constrains given camera target and distance to {@link MapView.maxBounds}.
     *
     * @remarks
     * The resulting
     * target and distance will keep the view within the maximum bounds for a camera with tilt and
     * yaw set to 0.
     * @param target - The camera target.
     * @param distance - The camera distance.
     * @param mapView - The map view whose maximum bounds will be used as constraints.
     * @returns constrained target and distance, or the unchanged input arguments if the view
     * does not have maximum bounds set.
     */
    function constrainTargetAndDistanceToViewBounds(target: THREE.Vector3, distance: number, mapView: MapView): {
        target: THREE.Vector3;
        distance: number;
    };
    /**
     * @internal
     * Computes the target for a given camera and the distance between them.
     * @param projection - The world space projection.
     * @param camera - The camera whose target will be computed.
     * @param elevationProvider - If provided, elevation at the camera position will be used.
     * @returns The target, the distance to it and a boolean flag set to false in case an elevation
     * provider was passed but the elevation was not available yet.
     */
    function getTargetAndDistance(projection: Projection, camera: THREE.Camera, elevationProvider?: ElevationProvider): {
        target: THREE.Vector3;
        distance: number;
        final: boolean;
    };
    /**
     * Returns the {@link @here/harp-geoutils#GeoCoordinates} of the camera,
     * given its target coordinates on the map and its
     * zoom, yaw and pitch.
     *
     * @param targetCoordinates - Coordinates of the center of the view.
     * @param distance - Distance to the target in meters.
     * @param yawDeg - Camera yaw in degrees.
     * @param pitchDeg - Camera pitch in degrees.
     * @param projection - Active MapView, needed to get the camera fov and map projection.
     * @param result - Optional output vector.
     * @returns Camera position in world space.
     */
    function getCameraPositionFromTargetCoordinates(targetCoordinates: GeoCoordinates, distance: number, yawDeg: number, pitchDeg: number, projection: Projection, result?: THREE.Vector3): THREE.Vector3;
    /**
     * @hidden
     * @internal
     *
     * Add offset to geo points for minimal view box in flat projection with tile wrapping.
     *
     * @remarks
     * In flat projection, with wrap around enabled, we should detect clusters of points around that
     * wrap antimeridian.
     *
     * Here, we fit points into minimal geo box taking world wrapping into account.
     */
    function wrapGeoPointsToScreen(points: GeoCoordLike[], startPosition?: GeoCoordinates): GeoCoordinates[];
    /**
     * @hidden
     * @internal
     *
     * Given `cameraPos`, force all points that lie on non-visible sphere half to be "near" max
     * possible viewable circle from given camera position.
     *
     * @remarks
     * Assumes that shpere projection with world center is in `(0, 0, 0)`.
     */
    function wrapWorldPointsToView(points: THREE.Vector3[], cameraPos: THREE.Vector3): void;
    /**
     * @hidden
     * @internal
     *
     * Return `GeoPoints` bounding {@link @here/harp-geoutils#GeoBox}
     * applicable for {@link getFitBoundsDistance}.
     *
     * @returns {@link @here/harp-geoutils#GeoCoordinates} set that covers `box`
     */
    function geoBoxToGeoPoints(box: GeoBox): GeoCoordinates[];
    /**
     * @hidden
     * @internal
     *
     * Get minimal distance required for `camera` looking at `worldTarget` to cover `points`.
     *
     * All dimensions belong to world space.
     *
     * @param points - points which must be in view.
     * @param worldTarget - readonly, world target of {@link MapView}
     * @param camera - readonly, camera with proper `position` and rotation set
     * @returns new distance to camera to be used with {@link (MapView.lookAt:WITH_PARAMS)}
     */
    function getFitBoundsDistance(points: THREE.Vector3[], worldTarget: THREE.Vector3, camera: THREE.PerspectiveCamera): number;
    /**
     * @hidden
     * @internal
     *
     * Paremeters for [[getFitBoundsLookAtParams]] function.
     */
    interface FitPointParams {
        tilt: number;
        heading: number;
        projection: Projection;
        minDistance: number;
        camera: THREE.PerspectiveCamera;
    }
    /**
     * @hidden
     * @internal
     *
     * Get {@link LookAtParams} that fit all `worldPoints`
     * giving that {@link MapView} will target at
     * `geoTarget`.
     *
     * @param geoTarget - desired target (see {@link MapView.target}) as geo point
     * @param worldTarget - same as `geoTarget` but in world space
     * @param worldPoints - points we want to see
     * @param params - other params derived from {@link MapView}.
     */
    function getFitBoundsLookAtParams(geoTarget: GeoCoordinates, worldTarget: THREE.Vector3, worldPoints: THREE.Vector3[], params: FitPointParams): {
        target: GeoCoordinates;
        distance: number;
        heading: number;
        tilt: number;
    };
    /**
     * @deprecated use getCameraPositionFromTargetCoordinates instead
     */
    function getCameraCoordinatesFromTargetCoordinates(targetCoordinates: GeoCoordinates, distance: number, yawDeg: number, pitchDeg: number, mapView: MapView): GeoCoordinates;
    /**
     * Casts a ray in NDC space from the current map view and returns the intersection point of that
     * ray wih the map in world space.
     *
     * @param mapView - Instance of MapView.
     * @param pointOnScreenXinNDC - X coordinate in NDC space.
     * @param pointOnScreenYinNDC - Y coordinate in NDC space.
     * @param elevation - Optional param used to offset the ground plane. Used when wanting to pan
     * based on a plane at some altitude. Necessary for example when panning with terrain.
     *
     * @returns Intersection coordinates, or `null` if raycast failed.
     */
    function rayCastWorldCoordinates(mapView: MapView | {
        camera: THREE.Camera;
        projection: Projection;
    }, pointOnScreenXinNDC: number, pointOnScreenYinNDC: number, elevation?: number): THREE.Vector3 | null;
    /**
     * Pans the camera according to the projection.
     *
     * @param mapView - Instance of MapView.
     * @param xOffset - In world space. Value > 0 will pan the map to the right, value < 0 will pan
     *                  the map to the left in default camera orientation.
     * @param yOffset - In world space. Value > 0 will pan the map upwards, value < 0 will pan the
     *                  map downwards in default camera orientation.
     */
    function panCameraAboveFlatMap(mapView: MapView, offsetX: number, offsetY: number): void;
    /**
     * The function doing a pan in the spherical space
     * when {@link MapView}'s active [[ProjectionType]]
     * is spherical. In other words, the function that rotates the camera around the globe.
     *
     * @param mapView - MapView instance.
     * @param fromWorld - Start vector representing the scene position of a geolocation.
     * @param toWorld - End vector representing the scene position of a geolocation.
     */
    function panCameraAroundGlobe(mapView: MapView, fromWorld: THREE.Vector3, toWorld: THREE.Vector3): void;
    /**
     * Rotates the camera by the given delta yaw and delta pitch. The pitch will be clamped to the
     * maximum possible tilt to the new target, and under the horizon in sphere projection.
     *
     * @param mapView - The {@link MapView} instance in use.
     * @param deltaYawDeg - Delta yaw in degrees.
     * @param deltaPitchDeg - Delta pitch in degrees.
     * @param maxTiltAngleRad - Max tilt angle in radians.
     */
    function rotate(mapView: {
        projection: Projection;
        camera: THREE.PerspectiveCamera;
    }, deltaYawDeg: number, deltaPitchDeg?: number, maxTiltAngleRad?: number): void;
    /**
     * Computes the rotation of the camera according to yaw and pitch in degrees. The computations
     * hinge on the current `projection` and `target`, because yaw and pitch are defined in
     * tangent space of the target point.
     *
     * **Note:** `yaw == 0 && pitch == 0` will north up the map and you will look downwards onto the
     * map.
     *
     * @param projection - Current projection.
     * @param target - The camera target.
     * @param yawDeg - Yaw in degrees, counter-clockwise (as opposed to azimuth), starting north.
     * @param pitchDeg - Pitch in degrees.
     */
    function getCameraRotationAtTarget(projection: Projection, target: GeoCoordinates, yawDeg: number, pitchDeg: number, result?: THREE.Quaternion): THREE.Quaternion;
    /**
     * Sets the rotation of the camera according to yaw and pitch in degrees. The computations hinge
     * on the current projection and `geoCenter`, because yaw and pitch are defined in tangent
     * space. In particular, `MapView#geoCenter` needs to be set before calling `setRotation`.
     *
     * **Note:** `yaw == 0 && pitch == 0` will north up the map and you will look downwards onto the
     * map.
     *
     * @param mapView - Instance of MapView.
     * @param yawDeg - Yaw in degrees, counter-clockwise (as opposed to azimuth), starting north.
     * @param pitchDeg - Pitch in degrees.
     */
    function setRotation(mapView: MapView, yawDeg: number, pitchDeg: number): void;
    /**
     * Extracts current camera tilt angle in radians.
     *
     * @param camera - The [[Camera]] in use.
     * @param projection - The {@link @here/harp-geoutils#Projection} used to
     *                     convert between geo and world coordinates.
     *
     * @deprecated Use MapView.tilt
     */
    function extractCameraTilt(camera: THREE.Camera, projection: Projection): number;
    /**
     * Extracts yaw, pitch, and roll rotation in radians.
     * - Yaw : Rotation around the vertical axis, counter-clockwise (as opposed to azimuth),
     * starting north.
     * - Pitch :Rotation around the horizontal axis.
     * - Roll : Rotation around the view axis.
     *
     * @see https://en.wikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles
     *
     * @param options - Subset of necessary {@link MapView} properties.
     * @param object - The [[THREE.Object3D]] instance to extract the rotations from.
     */
    function extractAttitude(mapView: {
        projection: Projection;
    }, object: THREE.Object3D): Attitude;
    /**
     * Gets the spherical coordinates in radian of the object to the coordinates of `point`.
     *
     * Note: this method can be used to get the direction that an object points to, when `location`
     * is the target of that object, by adding PI to it. Otherwise it only returns the spherical
     * coordinates of `object` in the tangent space of `location`.
     *
     * @param mapView - The {@link MapView} instance to consider.
     * @param object - The object to get the coordinates from.
     * @param location - The reference point.
     */
    function extractSphericalCoordinatesFromLocation(mapView: {
        projection: Projection;
    }, object: THREE.Object3D, location: GeoCoordinatesLike | Vector3Like): {
        azimuth: number;
        tilt: number;
    };
    /**
     * Gets the tilt angle (in radians) of the object relative to the coordinates of `location`.
     *
     * Note: this method can be used to get the direction that an object points to, when `location`
     * is the target of that object, by adding PI to it. Otherwise it only returns the tilt angle
     * (in radians) of `object` in the tangent space of `location`.
     *
     * @param projection - The {@link @here/harp-geoutils#Projection} used when
     *                     converting from geo to world coordinates.
     * @param object - The object to get the coordinates from.
     * @param location - The reference point.
     * @param tiltAxis - Optional axis used to define the rotation about which the object's tilt
     * occurs, the direction vector to the location from the camera is projected on the plane with
     * the given angle.
     */
    function extractTiltAngleFromLocation(projection: Projection, object: THREE.Object3D, location: GeoCoordinates | Vector3Like, tiltAxis?: THREE.Vector3): number;
    /**
     * Get perspective camera frustum planes distances.
     * @deprecated
     * @return all plane distances in helper object.
     */
    function getCameraFrustumPlanes(camera: THREE.PerspectiveCamera): {
        left: number;
        right: number;
        top: number;
        bottom: number;
        near: number;
        far: number;
    };
    /**
     * Casts a ray in NDC space from the current view of the camera and returns the intersection
     * point of that ray against the map in geo coordinates. The return value can be `null` when
     * the raycast is above the horizon.
     *
     * @param mapView - Instance of MapView.
     * @param pointOnScreenXNDC -  Abscissa in NDC space.
     * @param pointOnScreenYNDC -  Ordinate in NDC space.
     * @returns Intersection geo coordinates, or `null` if raycast is above the horizon.
     */
    function rayCastGeoCoordinates(mapView: MapView, pointOnScreenXinNDC: number, pointOnScreenYinNDC: number): GeoCoordinates | null;
    /**
     * Calculates and returns the distance from the ground, which is needed to put the camera to
     * this height, to see the size of the area that would be covered by one tile for the given zoom
     * level.
     *
     * @param mapView - Instance of MapView.
     * @param options - Subset of necessary {@link MapView} properties.
     */
    function calculateDistanceToGroundFromZoomLevel(mapView: {
        projection: Projection;
        focalLength: number;
        camera: THREE.PerspectiveCamera;
    }, zoomLevel: number): number;
    /**
     * Calculates and returns the distance to the target point.
     *
     * @param options - Necessary subset of MapView properties to compute the distance.
     * @param zoomLevel - The zoom level to get the equivalent height to.
     */
    function calculateDistanceFromZoomLevel(options: {
        focalLength: number;
    }, zoomLevel: number): number;
    /**
     * Calculates the zoom level, which corresponds to the current distance from
     * camera to lookAt point.
     * Therefore the zoom level is a `float` and not an `int`. The height of the camera can be in
     * between zoom levels. By setting the zoom level, you change the height position of the camera
     * in away that the field of view of the camera should be able to cover one tile for the given
     * zoom level.
     *
     * As an example for this, when you have a tile of zoom level 14 in front of the camera and you
     * set the zoom level of the camera to 14, then you are able to see the whole tile in front of
     * you.
     *
     * @param options - Subset of necessary {@link MapView} properties.
     * @param distance - The distance in meters, which are scene units in {@link MapView}.
     */
    function calculateZoomLevelFromDistance(options: {
        focalLength: number;
        minZoomLevel: number;
        maxZoomLevel: number;
    }, distance: number): number;
    /**
     * @deprecated
     * Translates a linear clip-space distance value to the actual value stored in the depth buffer.
     * This is useful as the depth values are not stored in the depth buffer linearly, and this can
     * lead into confusing behavior when not taken into account.
     *
     * @param clipDistance - Distance from the camera in clip space (range: [0, 1]).
     * @param camera - Camera applying the perspective projection.
     */
    function calculateDepthFromClipDistance(clipDistance: number, camera: THREE.Camera): number;
    /**
     * @deprecated
     * Translates a linear distance value [0..1], where 1 is the distance to the far plane, into
     * [0..cameraFar].
     *
     * @param distance - Distance from the camera (range: [0, 1]).
     * @param camera - Camera applying the perspective projection.
     */
    function cameraToWorldDistance(distance: number, camera: THREE.Camera): number;
    /**
     * @deprecated
     */
    function calculateVerticalFovByHorizontalFov(hFov: number, aspect: number): number;
    /**
     * @deprecated Use {@link CameraUtils.getHorizontalFov}.
     */
    function calculateHorizontalFovByVerticalFov(vFov: number, aspect: number): number;
    /**
     * @deprecated Use {@link CameraUtils.setVerticalFov}.
     */
    function calculateFocalLengthByVerticalFov(vFov: number, height: number): number;
    /**
     * @deprecated Use {@link CameraUtils.setFocalLength}.
     */
    function calculateFovByFocalLength(focalLength: number, height: number): number;
    /**
     * @deprecated Use {@link CameraUtils.convertWorldToScreenSize}.
     */
    const calculateScreenSizeByFocalLength: typeof CameraUtils.convertWorldToScreenSize;
    /**
     * @deprecated Use {@link CameraUtils.convertScreenToWorldSize}.
     */
    const calculateWorldSizeByFocalLength: typeof CameraUtils.convertScreenToWorldSize;
    /**
     * @deprecated
     */
    const estimateObject3dSize: typeof Object3DUtils.estimateSize;
    /**
     * Check if tiles or other content is currently being loaded.
     *
     * This method can be removed once HARP-7932 is implemented.
     *
     * @returns `true` if MapView has visible tiles or other content that is being loaded.
     */
    function mapViewIsLoading(mapView: MapView): boolean;
    function closeToFrustum(point: THREE.Vector3, camera: THREE.Camera, eps?: number): boolean;
    /**
     * @deprecated Use {@link @here/harp-utils#DOMUtils.getBrowserLanguages}
     */
    const getBrowserLanguages: typeof DOMUtils.getBrowserLanguages;
}
export declare namespace TileOffsetUtils {
    /**
     * @deprecated Use {@link @here/harp-geoutils#TileKeyUtils.getKeyForTileKeyAndOffset}.
     */
    const getKeyForTileKeyAndOffset: typeof TileKeyUtils.getKeyForTileKeyAndOffset;
    /**
     * @deprecated Use {@link @here/harp-geoutils#TileKeyUtils.getKeyForTileKeyAndOffset}.
     */
    const extractOffsetAndMortonKeyFromKey: typeof TileKeyUtils.extractOffsetAndMortonKeyFromKey;
    /**
     * @deprecated Use {@link @here/harp-geoutils#TileKeyUtils.getParentKeyFromKey}.
     */
    const getParentKeyFromKey: typeof TileKeyUtils.getParentKeyFromKey;
}
//# sourceMappingURL=Utils.d.ts.map