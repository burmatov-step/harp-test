import { MemoryUsage } from "@here/harp-text-canvas";
import { Math2D } from "@here/harp-utils";
import * as THREE from "three";
/**
 * Declares an interface for a `struct` containing a [[BoxBuffer]]'s attribute state information.
 */
export interface State {
    positionAttributeCount: number;
    colorAttributeCount: number;
    uvAttributeCount: number;
    indexAttributeCount: number;
    pickInfoCount: number;
}
/**
 * SubClass of [[THREE.Mesh]] to identify meshes that have been created by [[BoxBuffer]] and
 * [[TextBuffer]]. Add the isEmpty flag to quickly test for empty meshes.
 */
export declare class BoxBufferMesh extends THREE.Mesh {
    constructor(geometry: THREE.BufferGeometry, material: THREE.Material | THREE.Material[]);
    /**
     * A mesh that has no positions and indices set is defined to be empty.
     *
     * @returns `True` if no indices have been added to the mesh.
     */
    get isEmpty(): boolean;
}
/**
 * Buffer for (untransformed) `Box2` objects. Can be used to create a single geometry for screen-
 * aligned boxes, like POIs.
 */
export declare class BoxBuffer {
    private readonly m_material;
    private readonly m_renderOrder;
    private readonly m_maxElementCount;
    /**
     * {@link @here/harp-datasource-protocol#BufferAttribute} holding the `BoxBuffer` position data.
     */
    private m_positionAttribute?;
    /**
     * {@link @here/harp-datasource-protocol#BufferAttribute} holding the `BoxBuffer` color data.
     */
    private m_colorAttribute?;
    /**
     * {@link @here/harp-datasource-protocol#BufferAttribute} holding the `BoxBuffer` uv data.
     */
    private m_uvAttribute?;
    /**
     * {@link @here/harp-datasource-protocol#BufferAttribute} holding the `BoxBuffer` index data.
     */
    private m_indexAttribute?;
    private readonly m_pickInfos;
    /**
     * [[BufferGeometry]] holding all the different
     * {@link @here/harp-datasource-protocol#BufferAttribute}s.
     */
    private m_geometry;
    /**
     * [[Mesh]] used for rendering.
     */
    private m_mesh;
    private m_size;
    /**
     * Creates a new `BoxBuffer`.
     *
     * @param m_material - Material to be used for [[Mesh]] of this `BoxBuffer`.
     * @param m_renderOrder - Optional renderOrder of this buffer.
     * @param startElementCount - Initial number of elements this `BoxBuffer` can hold.
     * @param m_maxElementCount - Maximum number of elements this `BoxBuffer` can hold.
     */
    constructor(m_material: THREE.Material | THREE.Material[], m_renderOrder?: number, startElementCount?: number, m_maxElementCount?: number);
    /**
     * Duplicate this `BoxBuffer` with same material and renderOrder.
     *
     * @returns A clone of this `BoxBuffer`.
     */
    clone(): BoxBuffer;
    /**
     * Dispose of the geometry.
     */
    dispose(): void;
    /**
     * Return the current number of elements the buffer can hold.
     */
    get size(): number;
    /**
     * Clear's the `BoxBuffer` attribute buffers.
     */
    reset(): void;
    /**
     * Returns `true` if this `BoxBuffer` can hold the specified amount of glyphs. If the buffer
     * can only add the glyph by increasing the buffer size, the resize() method is called, which
     * will then create a new geometry for the mesh.
     *
     * @param glyphCount - Number of glyphs to be added to the buffer.
     * @returns `true` if the element (box or glyph) can be added to the buffer, `false` otherwise.
     */
    canAddElements(glyphCount?: number): boolean;
    /**
     * Returns this `BoxBuffer`'s attribute [[State]].
     */
    saveState(): State;
    /**
     * Store this `BoxBuffer`'s attribute [[State]] to a previously stored one.
     *
     * @param state - [[State]] struct describing a previous attribute state.
     */
    restoreState(state: State): void;
    /**
     * Adds a new box to this `BoxBuffer`.
     *
     * @param screenBox - [[Math2D.Box]] holding screen coordinates for this box.
     * @param uvBox - [[Math2D.UvBox]] holding uv coordinates for this box.
     * @param color - Box's color.
     * @param opacity - Box's opacity.
     * @param distance - Box's distance to camera.
     * @param pickInfo - Box's picking information.
     */
    addBox(screenBox: Math2D.Box, uvBox: Math2D.UvBox, color: THREE.Color, opacity: number, distance: number, pickInfo?: any): boolean;
    /**
     * Updates a [[BufferGeometry]] object to reflect the changes in this `TextBuffer`'s attribute
     * data.
     */
    updateBufferGeometry(): void;
    /**
     * Check if the buffer is empty. If it is empty, the memory usage is minimized to reduce
     * footprint.
     */
    cleanUp(): void;
    /**
     * Determine if the mesh is empty.
     */
    get isEmpty(): boolean;
    /**
     * Get the [[Mesh]] object. The geometry instance of the mesh may change if the buffers are
     * resized. The mesh, once created, will not change, so it can always be added to the scene.
     */
    get mesh(): BoxBufferMesh;
    /**
     * Fill the picking results for the pixel with the given screen coordinate. If multiple
     * boxes are found, the order of the results is unspecified.
     *
     * @param screenPosition - Screen coordinate of picking position.
     * @param pickCallback - Callback to be called for every picked element.
     * @param image - Image to test if the pixel is transparent
     */
    pickBoxes(screenPosition: THREE.Vector2, pickCallback: (pickData: any | undefined) => void, image?: CanvasImageSource | ImageData): void;
    /**
     * Creates a new {@link @here/harp-datasource-protocol#Geometry} object
     * from all the attribute data stored in this `BoxBuffer`.
     *
     * @remarks
     * The [[Mesh]] object may be created if it is not initialized already.
     *
     * @param newSize - Optional number of elements to resize the buffer to.
     * @param forceResize - Optional flag to force a resize even if new size is smaller than before.
     */
    resize(newSize?: number, forceResize?: boolean): BoxBufferMesh;
    /**
     * Update the info with the memory footprint caused by objects owned by the `BoxBuffer`.
     *
     * @param info - The info object to increment with the values from this `BoxBuffer`.
     */
    updateMemoryUsage(info: MemoryUsage): void;
    /**
     * Check if a pixel is transparent or not.
     *
     * @param image - Image source.
     * @param xScreenPos - X position of the pixel.
     * @param yScreenPos - Y position of the pixel.
     * @param box - Bounding box of the image in screen coordinates.
     * @param uvBox - Uv box referred to the given bounding box.
     * @param canvas - Canvas element to draw the image if it's not a `ImageData` object.
     */
    private isPixelTransparent;
    /**
     * Remove current attributes and arrays. Minimizes memory footprint.
     */
    private clearAttributes;
    /**
     * Resize the attribute buffers. New value must be larger than the previous one.
     *
     * @param newSize - New number of elements in the buffer. Number has to be larger than the
     *      previous size.
     */
    private resizeBuffer;
}
//# sourceMappingURL=BoxBuffer.d.ts.map