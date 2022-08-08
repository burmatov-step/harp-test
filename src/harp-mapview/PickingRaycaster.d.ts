import * as THREE from "three";
/**
 * Raycasting points is not supported as necessary in Three.js. This class extends a
 * [[THREE.Raycaster]] and adds the width / height of the canvas to allow picking of screen space
 * geometry.
 *
 * @internal
 */
export declare class PickingRaycaster extends THREE.Raycaster {
    readonly canvasSize: THREE.Vector2;
    /**
     * Constructor.
     *
     * @param canvasSize - the canvas width and height.
     */
    constructor(canvasSize: THREE.Vector2);
    intersectObject(object: THREE.Object3D, recursive?: boolean, optionalTarget?: THREE.Intersection[]): THREE.Intersection[];
    intersectObjects(objects: THREE.Object3D[], recursive?: boolean, optionalTarget?: THREE.Intersection[]): THREE.Intersection[];
}
//# sourceMappingURL=PickingRaycaster.d.ts.map