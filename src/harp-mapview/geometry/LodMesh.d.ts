import * as THREE from "three";
/**
 * A mesh that can store multiple versions of a geometry with differents level of detail.
 * The rendered level of detail can be adapted during runtime.
 * @internal
 * @hidden
 */
export declare class LodMesh extends THREE.Mesh {
    private m_geometries;
    /**
     * Creates a [[LodMesh]] with given geometries and materials
     * @param geometries - A list of geometries with different levels of detail
     * @param material - Material for the mesh
     */
    constructor(geometries?: THREE.BufferGeometry[], material?: THREE.Material | THREE.Material[] | undefined);
    /**
     * Update geometries of mesh
     */
    set geometries(geometries: THREE.BufferGeometry[] | undefined);
    /**
     * Get geometries of mesh
     */
    get geometries(): THREE.BufferGeometry[] | undefined;
    /**
     * Change the rendered level of detail of the mesh
     * @param level - The level of detail (index of the geometry in the list).
     */
    setLevelOfDetail(level: number): void;
    /**
     * Dispose all geometries of mesh
     */
    private disposeGeometries;
}
//# sourceMappingURL=LodMesh.d.ts.map