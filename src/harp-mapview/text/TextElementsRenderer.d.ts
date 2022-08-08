import { FontCatalogConfig, TextStyleDefinition } from "@here/harp-datasource-protocol";
import { TextCanvas } from "@here/harp-text-canvas";
import * as THREE from "three";
import { MapViewImageCache } from "../image/MapViewImageCache";
import { PickListener } from "../PickListener";
import { PoiManager } from "../poi/PoiManager";
import { PoiRenderer } from "../poi/PoiRenderer";
import { ScreenCollisions } from "../ScreenCollisions";
import { ScreenProjector } from "../ScreenProjector";
import { MapViewUtils } from "../Utils";
import { DataSourceTileList } from "../VisibleTileSet";
import { TextCanvasFactory } from "./TextCanvasFactory";
import { TextElement } from "./TextElement";
import { TextElementsRendererOptions } from "./TextElementsRendererOptions";
import { TextStyleCache } from "./TextStyleCache";
import { ViewState } from "./ViewState";
export declare type TextCanvases = Map<string, TextCanvas | undefined>;
export declare const DEFAULT_FONT_CATALOG_NAME = "default";
/**
 * Default distance scale. Will be applied if distanceScale is not defined in the technique.
 * Defines the scale that will be applied to labeled icons (icon and text) in the distance.
 * @internal
 */
export declare const DEFAULT_TEXT_DISTANCE_SCALE = 0.5;
/**
 *
 * Internal class to manage all text rendering.
 */
export declare class TextElementsRenderer {
    private readonly m_viewState;
    private readonly m_screenProjector;
    private readonly m_poiManager;
    private m_renderer;
    private readonly m_imageCaches;
    private m_loadPromisesCount;
    private m_loadPromise;
    private readonly m_options;
    private readonly m_textCanvases;
    private m_overlayTextElements?;
    private m_debugGlyphTextureCacheMesh?;
    private m_debugGlyphTextureCacheWireMesh?;
    private readonly m_tmpVector;
    private readonly m_tmpVector3;
    private readonly m_cameraLookAt;
    private m_overloaded;
    private m_cacheInvalidated;
    private m_addNewLabels;
    private m_forceNewLabelsPass;
    private readonly m_textElementStateCache;
    private readonly m_camera;
    private m_defaultFontCatalogConfig;
    private m_poiRenderer;
    private readonly m_textStyleCache;
    private readonly m_screenCollisions;
    private readonly m_textCanvasFactory;
    /**
     * indicates if the TextElementsRenderer is still updating, includes fading, elevations etc
     */
    private m_isUpdatePending;
    /**
     * Create the `TextElementsRenderer` which selects which labels should be placed on screen as
     * a preprocessing step, which is not done every frame, and also renders the placed
     * {@link TextElement}s every frame.
     *
     * @param m_viewState - State of the view for which this renderer will draw text.
     * @param m_screenProjector - Projects 3D coordinates into screen space.
     * @param m_poiManager - To prepare pois for rendering.
     * @param m_renderer - The renderer to be used.
     * @param m_imageCaches - The Image Caches to look for Icons.
     * @param options - Configuration options for the text renderer. See
     * @param textCanvasFactory - Optional A TextCanvasFactory to override the default.
     * @param poiRenderer - Optional A PoiRenderer to override the default.
     * @param screenCollisions - Optional  ScreenCollisions to override the default.
     * [[TextElementsRendererOptions]].
     */
    constructor(m_viewState: ViewState, m_screenProjector: ScreenProjector, m_poiManager: PoiManager, m_renderer: THREE.WebGLRenderer, m_imageCaches: MapViewImageCache[], options: TextElementsRendererOptions, textCanvasFactory?: TextCanvasFactory, poiRenderer?: PoiRenderer, screenCollisions?: ScreenCollisions);
    /**
     * Disable all fading animations (for debugging and performance measurement). Defaults to
     * `false`.
     */
    set disableFading(disable: boolean);
    get disableFading(): boolean;
    get styleCache(): TextStyleCache;
    get delayLabelsUntilMovementFinished(): boolean;
    set delayLabelsUntilMovementFinished(delay: boolean);
    /**
     * If `true`, a replacement glyph ("?") is rendered for every missing glyph.
     */
    get showReplacementGlyphs(): boolean;
    /**
     * If `true`, a replacement glyph ("?") is rendered for every missing glyph.
     */
    set showReplacementGlyphs(value: boolean);
    restoreRenderers(renderer: THREE.WebGLRenderer): void;
    /**
     * Updates the FontCatalogs used by this {@link TextElementsRenderer}.
     *
     * @param fontCatalogs - The new list of {@link FontCatalogConfig}s
     */
    updateFontCatalogs(fontCatalogs?: FontCatalogConfig[]): Promise<void>;
    updateTextStyles(textStyles?: TextStyleDefinition[], defaultTextStyle?: TextStyleDefinition): Promise<void>;
    /**
     * Render the text using the specified camera into the current canvas.
     *
     * @param camera - Orthographic camera to use.
     */
    renderText(farPlane: number): void;
    /**
     * Forces update of text elements in the next call to [[placeText]].
     */
    invalidateCache(): void;
    /**
     * Notify `TextElementsRenderer` that the camera has started a movement.
     */
    movementStarted(): void;
    /**
     * Notify `TextElementsRenderer` that the camera has finished its movement.
     */
    movementFinished(): void;
    /**
     * Is `true` if number of {@link TextElement}s in visible tiles is larger than the recommended
     * number `OVERLOAD_LABEL_LIMIT`.
     */
    get overloaded(): boolean;
    /**
     * Places text elements for the current frame.
     * @param dataSourceTileList - List of tiles to be rendered for each data source.
     * @param time - Current frame time.
     */
    placeText(dataSourceTileList: DataSourceTileList[], time: number): void;
    /**
     * Adds new overlay text elements to this `MapView`.
     *
     * @param textElements - Array of {@link TextElement} to be added.
     */
    addOverlayText(textElements: TextElement[]): void;
    /**
     * Adds new overlay text elements to this `MapView`.
     *
     * @param textElements - Array of {@link TextElement} to be added.
     */
    clearOverlayText(): void;
    /**
     * @returns Whether there's overlay text to be rendered.
     */
    hasOverlayText(): boolean;
    get overlayText(): TextElement[] | undefined;
    /**
     * Fill the picking results for the pixel with the given screen coordinate. If multiple
     * {@link TextElement}s are found, the order of the results is unspecified.
     *
     * Note: {@link TextElement}s with identical `featureId` or
     * identical `userData` will only appear
     * once in the list `pickResults`.
     *
     * @param screenPosition - Screen coordinate of picking position.
     * @param pickResults - Array filled with pick results.
     */
    pickTextElements(screenPosition: THREE.Vector2, pickListener: PickListener): void;
    /**
     * `true` if any resource used by any `FontCatalog` is still loading.
     */
    get loading(): boolean;
    /**
     * `true` if TextElements are not placed finally but are still updating, including fading or
     * waiting for elevation.
     */
    get isUpdatePending(): boolean;
    /**
     * Waits till all pending resources from any `FontCatalog` are loaded.
     */
    waitLoaded(): Promise<void>;
    /**
     * Reset the current text render states of all visible tiles.
     *
     * @remarks
     * All {@link TextElement}s will fade in
     * after that as if they have just been added.
     */
    clearRenderStates(): void;
    /**
     * Return memory used by all objects managed by `TextElementsRenderer`.
     *
     * @returns `MemoryUsage` Heap and GPU memory used by this `TextElementsRenderer`.
     */
    getMemoryUsage(): MapViewUtils.MemoryUsage;
    private addDefaultTextCanvas;
    /**
     * Reset internal state at the beginning of a frame.
     */
    private reset;
    /**
     * Fills the screen with lines projected from world space, see [[Tile.blockingElements]].
     * @note These boxes have highest priority, so will block all other labels.
     * @param dataSourceTileList - List of tiles to be rendered for each data source.
     */
    private prepopulateScreenWithBlockingElements;
    /**
     * @returns True if whole group was processed for placement,
     * false otherwise (e.g. placement limit reached).
     */
    private placeTextElementGroup;
    private initializeGlyphs;
    private initializeCamera;
    updateCamera(): void;
    private initializeDefaultFontCatalog;
    private addTextCanvas;
    private updateGlyphDebugMesh;
    private initializeGlyphDebugMesh;
    /**
     * Visit all visible tiles and add/ their text elements to cache.
     *
     * @remarks
     * The update of {@link TextElement}s is a time consuming process,
     * and cannot be done every frame, but should only
     * be done when the camera moved (a lot) of whenever the set of visible tiles change.
     *
     * The actually rendered {@link TextElement}s are stored internally
     * until the next update is done
     * to speed up rendering when no camera movement was detected.
     * @param dataSourceTileList - List of tiles to be rendered for each data source.
     */
    private updateTextElements;
    private updateTextElementsFromSource;
    private prepareTextElementGroup;
    private createSortedGroupsForSorting;
    private selectTextElementsToUpdateByDistance;
    private placeTextElements;
    private placeNewTextElements;
    private placeOverlayTextElements;
    private getDistanceScalingFactor;
    private getDistanceFadingFactor;
    private addPointLabel;
    private addPoiLabel;
    private addLineMarkerLabel;
    private addPathLabel;
    private checkIfOverloaded;
    /**
     * Project point to screen and check if it is on screen or within a fixed distance to the
     * border.
     *
     * @param point center point of label.
     * @param outPoint projected screen point of label.
     */
    private labelPotentiallyVisible;
}
//# sourceMappingURL=TextElementsRenderer.d.ts.map