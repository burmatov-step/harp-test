import * as THREE from "three";
/**
 * @internal
 */
export declare namespace Object3DUtils {
    /**
     * Describes estimated usage of memory on heap and GPU.
     */
    interface MemoryUsage {
        heapSize: number;
        gpuSize: number;
    }
    /**
     * Computes estimate for size of a THREE.Object3D object and its children. Shared materials
     * and/or attributes will be counted multiple times.
     *
     * @param object - The mesh object to evaluate
     * @param size - The {@link MemoryUsage} to update.
     * @param visitedObjects - Optional map to store large objects that could be shared.
     *
     * @returns Estimate of object size in bytes for heap and GPU.
     */
    function estimateSize(object: THREE.Object3D, parentSize?: MemoryUsage, visitedObjects?: Map<string, boolean>): MemoryUsage;
}
//# sourceMappingURL=Object3DUtils.d.ts.map