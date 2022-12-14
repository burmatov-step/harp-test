import * as THREE from "three";
import { PickingRaycaster } from "./PickingRaycaster";
/**
 * `MapViewPoints` is a class to extend for the `"circles"` and `"squares"` techniques to
 * implement raycasting of `THREE.Points` as expected in {@link MapView},
 * that are in screen space.
 *
 * @remarks
 * It copies the behaviour of the `raycast` method in [[THREE.Points]] and dispatches it to its
 * children classes, {@link Circles} and {@link Squares}, who hold the intersection testing in the
 * `testPoint` method. This class also has the ability to dismiss the testing via the
 * `enableRayTesting` flag.
 *
 * Its main motivation is to handle the point styles of XYZ projects.
 *
 * @see https://github.com/mrdoob/three.js/blob/master/src/objects/Points.js
 *
 * @internal
 */
export declare abstract class MapViewPoints extends THREE.Points {
    /**
     * This allows to discard the ray testing.
     */
    enableRayTesting: boolean;
    /**
     * Implements the intersection testing in screen space between the drawn points and the ray.
     *
     * @remarks The drawing of the points being different between {@link Circles}
     * and {@link Squares}, this method is implemented in these child classes.
     *
     * @param point - The point to test.
     * @param screenPosition - The point position on screen.
     * @param pickCoordinates - The picking position on screen.
     * @param index - The index of the point in the [[THREE.BufferGeometry]].
     * @param distance - The distance between the point and the ray origin.
     * @param intersects - The results array.
     */
    abstract testPoint(point: THREE.Vector3, screenPosition: THREE.Vector2, pickCoordinates: THREE.Vector2, index: number, distance: number, intersects: THREE.Intersection[]): void;
    /**
     * This method is similar to the original method `raycast` in [[THREE.Points]] except that it
     * then calls the tailored `testPoint` method in the children classes to test intersections
     * depending on whether the points are circles or squares, which [[THREE.Points]] cannot do.
     *
     * @param raycaster - The raycaster.
     * @param intersects - The array to fill with the results.
     */
    raycast(raycaster: PickingRaycaster, intersects: THREE.Intersection[]): void;
}
/**
 * Point object that implements the raycasting of circles in screen space.
 * @internal
 */
export declare class Circles extends MapViewPoints {
    /** @override */
    testPoint(point: THREE.Vector3, screenPosition: THREE.Vector2, pickCoordinates: THREE.Vector2, index: number, distance: number, intersects: THREE.Intersection[]): void;
}
/**
 * Point object that implements the raycasting of squares in screen space.
 * @internal
 */
export declare class Squares extends MapViewPoints {
    /** @override */
    testPoint(point: THREE.Vector3, screenPosition: THREE.Vector2, pickCoordinates: THREE.Vector2, index: number, distance: number, intersects: THREE.Intersection[]): void;
}
//# sourceMappingURL=MapViewPoints.d.ts.map