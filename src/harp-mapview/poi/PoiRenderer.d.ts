import { Env } from "@here/harp-datasource-protocol";
import { MemoryUsage } from "@here/harp-text-canvas";
import { Math2D } from "@here/harp-utils";
import * as THREE from "three";
import { MapViewImageCache } from "../image/MapViewImageCache";
import { ScreenCollisions } from "../ScreenCollisions";
import { PoiInfo, TextElement } from "../text/TextElement";
import { BoxBuffer } from "./BoxBuffer";
import { PoiManager } from "./PoiManager";
export interface PoiLayer {
    id: number;
    scene: THREE.Scene;
}
/**
 * @internal
 * Buffer for POIs sharing same material and render order, renderable in a single draw call
 * (WebGL limits apply, see {@link BoxBuffer}).
 */
export declare class PoiBuffer {
    readonly buffer: BoxBuffer;
    readonly layer: PoiLayer;
    private readonly m_onDispose;
    private m_refCount;
    /**
     * Creates a `PoiBuffer`
     * @param buffer -
     * @param layer - The {@link TextCanvas} layer used to render the POIs.
     */
    constructor(buffer: BoxBuffer, layer: PoiLayer, m_onDispose: () => void);
    /**
     * Increases this `PoiBuffer`'s reference count.
     * @returns this `PoiBuffer`.
     */
    increaseRefCount(): PoiBuffer;
    /**
     * Decreases this `PoiBuffer`'s reference count. All resources will be disposed when the
     * reference count reaches 0.
     * @returns this `PoiBuffer`.
     */
    decreaseRefCount(): PoiBuffer;
    private dispose;
}
/**
 * @internal
 * Contains all [[PoiBatch]]es. Selects (and initializes) the correct batch for a POI.
 */
export declare class PoiBatchRegistry {
    private readonly m_rendererCapabilities;
    private readonly m_batchMap;
    /**
     * Create the `PoiBatchRegistry`.
     *
     * @param m_rendererCapabilities - The {@link THREE.WebGLCapabilities} to be used.
     */
    constructor(m_rendererCapabilities: THREE.WebGLCapabilities);
    /**
     * Register the POI and prepare the [[PoiBatch]] for the POI at first usage.
     *
     * @param poiInfo - Describes the POI icon.
     * @param layer - The {@link PoiLayer} to render to.
     */
    registerPoi(poiInfo: PoiInfo, layer: PoiLayer): PoiBuffer | undefined;
    /**
     * Render a POI image at the specified location.
     *
     * @param poiInfo - PoiInfo containing information for rendering the POI icon.
     * @param screenBox - Box to render icon into in 2D coordinates.
     * @param viewDistance - Box's distance to camera.
     * @param opacity - Opacity of icon to allow fade in/out.
     */
    addPoi(poiInfo: PoiInfo, screenBox: Math2D.Box, viewDistance: number, opacity: number): void;
    /**
     * Reset all batches, removing all content from the [[PoiBatch]]es. Called at the
     * beginning of a frame before the POIs are placed.
     */
    reset(): void;
    /**
     * Update the geometry of all [[PoiBatch]]es. Called before rendering.
     */
    update(): void;
    /**
     * Fill the picking results for the pixel with the given screen coordinate. If multiple
     * {@link PoiInfo}s are found, the order of the results is unspecified.
     *
     * @param screenPosition - Screen coordinate of picking position.
     * @param pickCallback - Callback to be called for every picked element.
     */
    pickTextElements(screenPosition: THREE.Vector2, pickCallback: (pickData: any | undefined) => void): void;
    /**
     * Update the info with the memory footprint caused by objects owned by the `PoiBatchRegistry`.
     *
     * @param info - The info object to increment with the values from this `PoiBatchRegistry`.
     */
    updateMemoryUsage(info: MemoryUsage): void;
    private deleteBatch;
}
/**
 * @internal
 * Manage POI rendering. Uses a [[PoiBatchRegistry]] to actually create the geometry that is being
 * rendered.
 */
export declare class PoiRenderer {
    private readonly m_renderer;
    private readonly m_poiManager;
    private readonly m_imageCaches;
    /**
     * Compute screen box for icon. It is required that `prepareRender` has been successfully called
     * before `computeScreenBox` may be called.
     *
     * @param poiInfo - PoiInfo containing information for rendering the POI icon.
     * @param screenPosition - Position on screen (2D).
     * @param scale - Scale to apply to icon.
     * @param env - Current zoom level.
     * @param screenBox - Box that will be used to store the result.
     * @returns The computed screen box for the icon.
     */
    static computeIconScreenBox(poiInfo: PoiInfo, screenPosition: THREE.Vector2, scale: number, env: Env, screenBox?: Math2D.Box): Math2D.Box;
    private readonly m_poiBatchRegistry;
    private readonly m_tempScreenBox;
    private readonly m_layers;
    /**
     * Create the `PoiRenderer` for the specified {@link MapView}.
     *
     * @param m_renderer - The {@link THREE.WebGLRenderer} to be rendered to.
     * @param m_poiManager - The {@link PoiManager} to be used.
     * @param m_imageCaches - The {@link ImageCache}s to look for loaded images.
     */
    constructor(m_renderer: THREE.WebGLRenderer, m_poiManager: PoiManager, m_imageCaches: MapViewImageCache[]);
    get renderer(): THREE.WebGLRenderer;
    /**
     * Prepare the POI for rendering, and determine which {@link PoiBuffer} should be used. If a
     * {@link PoiBuffer} is assigned, the POI is ready to be rendered.
     *
     * @param pointLabel - TextElement with PoiInfo for rendering the POI icon.
     * @param env - TODO! The current zoomLevel level of {@link MapView}
     *
     * @returns `True` if the space is not already allocated by another object (text label or POI)
     */
    prepareRender(pointLabel: TextElement, env: Env): boolean;
    /**
     * Reset all batches, removing all content from the [[PoiBatchRegistry]]. Called at the
     * beginning of a frame before the POIs are placed.
     */
    reset(): void;
    /**
     * Add the icon. Icon will only be added if opacity > 0, otherwise only its space will be
     * allocated.
     *
     * @param poiInfo - PoiInfo containing information for rendering the POI icon.
     * @param screenPosition - Position on screen (2D):
     * @param screenCollisions - Object handling the collision checks for screen-aligned 2D boxes.
     * @param viewDistance - Box's distance to camera.
     * @param scale - Scaling factor to apply to text and icon.
     * @param allocateScreenSpace - If `true` screen space will be allocated for the icon.
     * @param opacity - Opacity of icon to allow fade in/out.
     * @returns - `true` if icon has been actually rendered, `false` otherwise.
     */
    addPoi(poiInfo: PoiInfo, screenPosition: THREE.Vector2, screenCollisions: ScreenCollisions, viewDistance: number, scale: number, allocateScreenSpace: boolean, opacity: number, env: Env): void;
    /**
     * Update the geometry of all [[PoiBatch]]es. Called before rendering.
     */
    update(): void;
    /**
     * @internal
     *
     * Adds a layer to the PoiRenderer
     * @param layerId
     */
    addLayer(layerId: number): PoiLayer;
    /**
     * Retrieves a specific `Poi` rendering layer.
     *
     * @param layerId - Desired layer identifier.
     *
     * @returns Selected {@link PoiLayer}
     */
    private getLayer;
    /**
     * @internal
     *
     * Returns all {@link PoiLayer}s of this {@link PoiRenderer}
     */
    get layers(): PoiLayer[];
    /**
     * Renders the content of this `PoiRenderer`.
     *
     * @param camera - Orthographic camera.
     * @param layer - The Layer to be rendered.
     */
    render(camera: THREE.OrthographicCamera, layer: PoiLayer): void;
    /**
     * Fill the picking results for the pixel with the given screen coordinate. If multiple
     * {@link PoiInfo}s are found, the order of the results is unspecified.
     *
     * @param screenPosition - Screen coordinate of picking position.
     * @param pickCallback - Callback to be called for every picked element.
     */
    pickTextElements(screenPosition: THREE.Vector2, pickCallback: (pickData: any | undefined) => void): void;
    /**
     * Update the info with the memory footprint caused by objects owned by the `PoiRenderer`.
     *
     * @param info - The info object to increment with the values from this `PoiRenderer`.
     */
    getMemoryUsage(info: MemoryUsage): void;
    /**
     * Register the POI at the [[PoiBatchRegistry]] which may require some setup, for example
     * loading of the actual image.
     */
    private preparePoi;
    /**
     * Setup texture and material for the batch.
     *
     * @param poiInfo - {@link PoiInfo} to initialize.
     * @param imageTexture - Shared {@link @here/harp-datasource-protocol#ImageTexture},
     *                       defines used area in atlas.
     * @param imageItem - Shared {@link ImageItem}, contains cached image for texture.
     * @param env - The current zoom level of {@link MapView}
     */
    private setupPoiInfo;
}
//# sourceMappingURL=PoiRenderer.d.ts.map