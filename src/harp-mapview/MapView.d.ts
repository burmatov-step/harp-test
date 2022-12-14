import { Env, FlatTheme, FontCatalogConfig, PostEffects, TextStyleDefinition, Theme, Value } from "@here/harp-datasource-protocol";
import { ViewRanges } from "@here/harp-datasource-protocol/lib/ViewRanges";
import { GeoBox, GeoBoxExtentLike, GeoCoordinates, GeoPolygon, OrientedBox3, Projection, TilingScheme, Vector3Like } from "@here/harp-geoutils";
import { GeoCoordLike } from "@here/harp-geoutils/lib/coordinates/GeoCoordLike";
import { TaskQueue, UriResolver } from "@here/harp-utils";
import * as THREE from "three";
import { AnimatedExtrusionHandler } from "./AnimatedExtrusionHandler";
import { CameraMovementDetector } from "./CameraMovementDetector";
import { ClipPlanesEvaluator } from "./ClipPlanesEvaluator";
import { IMapAntialiasSettings, IMapRenderingManager } from "./composing";
import { CopyrightInfo } from "./copyrights/CopyrightInfo";
import { DataSource } from "./DataSource";
import { ElevationProvider } from "./ElevationProvider";
import { ElevationRangeSource } from "./ElevationRangeSource";
import { EventDispatcher } from "./EventDispatcher";
import { FovCalculation } from "./FovCalculation";
import { TileGeometryManager } from "./geometry/TileGeometryManager";
import { MapViewImageCache } from "./image/MapViewImageCache";
import { IntersectParams } from "./IntersectParams";
import { MapAnchors } from "./MapAnchors";
import { MapViewEnvironment } from "./MapViewEnvironment";
import { MapViewFog } from "./MapViewFog";
import { PickHandler, PickResult } from "./PickHandler";
import { PoiManager } from "./poi/PoiManager";
import { PoiTableManager } from "./poi/PoiTableManager";
import { TextElement } from "./text/TextElement";
import { TextElementsRenderer } from "./text/TextElementsRenderer";
import { TextElementsRendererOptions } from "./text/TextElementsRendererOptions";
import { Tile } from "./Tile";
import { ResourceComputationType, VisibleTileSet } from "./VisibleTileSet";
export declare enum TileTaskGroups {
    FETCH_AND_DECODE = "fetch",
    CREATE = "create"
}
export declare enum MapViewEventNames {
    /** Called before this `MapView` starts to render a new frame. */
    Update = "update",
    /** Called when the WebGL canvas is resized. */
    Resize = "resize",
    /** Called when the frame is about to be rendered. */
    Render = "render",
    /** Called after a frame has been rendered. */
    AfterRender = "didrender",
    /** Called after the first frame has been rendered. */
    FirstFrame = "first-render",
    /**
     * Called when the rendered frame was complete, i.e. all the necessary tiles and resources
     * are loaded and rendered.
     */
    FrameComplete = "frame-complete",
    /** Called when the theme has been loaded with the internal {@link ThemeLoader}. */
    ThemeLoaded = "theme-loaded",
    /** Called when the animation mode has started. */
    AnimationStarted = "animation-started",
    /** Called when the animation mode has stopped. */
    AnimationFinished = "animation-finished",
    /** Called when a camera interaction has been detected. */
    MovementStarted = "movement-started",
    /** Called when a camera interaction has been stopped. */
    MovementFinished = "movement-finished",
    /** Called when a data source has been connected or failed to connect. */
    DataSourceConnect = "datasource-connect",
    /** Emitted when copyright info of rendered map has been changed. */
    CopyrightChanged = "copyright-changed",
    /** Called when the WebGL context is lost. */
    ContextLost = "webglcontext-lost",
    /** Called when the WebGL context is restored. */
    ContextRestored = "webglcontext-restored",
    /** Called when camera position has been changed. */
    CameraPositionChanged = "camera-changed",
    /** Called when dispose has been called, before any cleanup is done. */
    Dispose = "dispose"
}
/**
 * The type of `RenderEvent`.
 */
export interface RenderEvent extends THREE.Event {
    type: MapViewEventNames;
    time?: number;
}
/**
 * Hint for the WebGL implementation on which power mode to prefer.
 *
 * @see https://www.khronos.org/registry/webgl/specs/latest/1.0/#5.14.12
 */
export declare enum MapViewPowerPreference {
    /** Default value. */
    Default = "default",
    /** Lower power mode, used to conserve energy. */
    LowPower = "low-power",
    /** Maximum performance. */
    HighPerformance = "high-performance"
}
/**
 * User configuration for the {@link MapView}.
 */
export interface MapViewOptions extends TextElementsRendererOptions, Partial<LookAtParams> {
    /**
     * The canvas element used to render the scene.
     */
    canvas: HTMLCanvasElement;
    /**
     * Optional WebGL Rendering Context.
     * (https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext)
     */
    context?: WebGLRenderingContext;
    /**
     * `true` if the canvas contains an alpha (transparency) buffer or not. Default is `false`.
     */
    alpha?: boolean;
    /**
     * If `true`adds a Background Mesh for each tile
     *
     * @default `true`
     */
    addBackgroundDatasource?: boolean;
    /**
     * Whether the native WebGL antialiasing should be enabled. It is better to disable it if the
     * MapView's MSAA is enabled.
     *
     * @default `true` for `pixelRatio` < `2.0`, `false` otherwise.
     */
    enableNativeWebglAntialias?: boolean;
    /**
     * Antialias settings for the map rendering. It is better to disable the native antialiasing if
     * the custom antialiasing is enabled.
     */
    customAntialiasSettings?: IMapAntialiasSettings;
    /**
     * `Projection` used by the `MapView`.
     *
     * The default value is [[mercatorProjection]].
     */
    projection?: Projection;
    /**
     * The URL of the script that the decoder worker runs. The default URL is
     * `./decoder.bundle.js`.
     *
     * Relative URIs are resolved to full URL using the document's base URL
     * (see: https://www.w3.org/TR/WD-html40-970917/htmlweb.html#h-5.1.2).
     */
    decoderUrl?: string;
    /**
     * The number of Web Workers used to decode data. The default is
     * CLAMP(`navigator.hardwareConcurrency` - 1, 1, 2).
     */
    decoderCount?: number;
    /**
     * The {@link @here/harp-datasource-protocol#Theme} used by Mapview.
     *
     * This Theme can be one of the following:
     *  - `string` : the URI of the theme file used to style this map
     *  - `Theme` : the `Theme` object already loaded
     *  - `Promise<Theme>` : the future `Theme` object
     *  - `undefined` : the theme is not yet set up, but can be set later. Rendering waits until
     *     the theme is set.
     *
     * **Note:** Layers that use a theme do not render any content until that theme is available.
     *
     * Relative URIs are resolved to full URL using the document's base URL
     * (see: https://www.w3.org/TR/WD-html40-970917/htmlweb.html#h-5.1.2).
     *
     * Custom URIs (of theme itself and of resources referenced by theme) may be resolved with help
     * of [[uriResolver]].
     *
     * @see {@link ThemeLoader.load} for details how theme is loaded
     */
    theme?: string | Theme | FlatTheme | Promise<Theme>;
    /**
     * Resolve `URI` referenced in `MapView` assets using this resolver.
     *
     * Use, to support application/deployment specific `URI`s into actual `URLs` that can be loaded
     * with `fetch`.
     *
     * Example:
     * ```
     * uriResolver: new PrefixMapUriResolver({
     *     "local://poiMasterList": "/assets/poiMasterList.json",
     *        // will match only 'local//:poiMasterList' and
     *        // resolve to `/assets/poiMasterList.json`
     *     "local://icons/": "/assets/icons/"
     *        // will match only 'local//:icons/ANYPATH' (and similar) and
     *        // resolve to `/assets/icons/ANYPATH`
     * })
     * ```
     *
     * @see {@link @here/harp-utils#UriResolver}
     * @See {@link @here/harp-utils#PrefixMapUriResolver}
     */
    uriResolver?: UriResolver;
    /**
     * The minimum zoom level; default is `1`.
     */
    minZoomLevel?: number;
    /**
     * Determines the minimum camera height, in meters.
     */
    minCameraHeight?: number;
    /**
     * The maximum zoom level. The default is `14`.
     */
    maxZoomLevel?: number;
    /**
     * User-defined camera clipping planes distance evaluator.
     * If not defined, {@link TiltViewClipPlanesEvaluator} will be used by {@link MapView}.
     *
     * @default {@link TiltViewClipPlanesEvaluator}
     */
    clipPlanesEvaluator?: ClipPlanesEvaluator;
    /**
     * Set to true to extend the frustum culling. This improves the rejection of some tiles, which
     * normal frustum culling cannot detect. You can disable this property to measure performance.
     *
     * @default true
     */
    extendedFrustumCulling?: boolean;
    /**
     * The maximum number of tiles rendered from one data source at a time.
     *
     * @default See [[MapViewDefaults.maxVisibleDataSourceTiles]].
     */
    maxVisibleDataSourceTiles?: number;
    /**
     * Size of a tile cache for one data source.
     *
     * @default See [[MapViewDefaults.tileCacheSize]].
     */
    tileCacheSize?: number;
    /**
     * Specify if the cache should be counted in tiles or in megabytes.
     *
     * @see [[MapViewDefaults.resourceComputationType]].
     */
    resourceComputationType?: ResourceComputationType;
    /**
     * Limits the number of reduced zoom levels (lower detail)
     * to be searched for fallback tiles.
     *
     * When zooming in, newly elected tiles may have not
     * yet loaded. {@link MapView} searches through
     * the tile cache for tiles ready to be displayed in
     * lower zoom levels. The tiles may be
     * located shallower in the quadtree.
     *
     * To disable a cache search, set the value to `0`.
     *
     * @default [[MapViewDefaults.quadTreeSearchDistanceUp]]
     */
    quadTreeSearchDistanceUp?: number;
    /**
     * Limits the number of higher zoom levels (more detailed)
     * to be searched for fallback tiles.
     *
     * When zooming out, newly elected tiles may have not
     * yet loaded. {@link MapView} searches through
     * the tile cache for tiles ready to be displayed in
     * higher zoom levels. These tiles may be
     * located deeper in the quadtree.
     *
     * To disable a cache search, set the value to `0`.
     *
     * @default [[MapViewDefaults.quadTreeSearchDistanceDown]]
     */
    quadTreeSearchDistanceDown?: number;
    /**
     * Set to `true` to measure performance statistics.
     */
    enableStatistics?: boolean;
    /**
     * Preserve the buffers until they are cleared manually or overwritten.
     *
     * Set to `true` in order to copy {@link MapView} canvas contents
     * to an image or another canvas.
     *
     * @default `false`.
     * @see https://threejs.org/docs/#api/renderers/WebGLRenderer.preserveDrawingBuffer
     */
    preserveDrawingBuffer?: boolean;
    /**
     * @deprecated Not needed anymore, roads can be picked by default.
     */
    enableRoadPicking?: boolean;
    /**
     * Set to `true` to allow picking of technique information associated with objects.
     */
    enablePickTechnique?: boolean;
    /**
     * Maximum timeout, in milliseconds, before a [[MOVEMENT_FINISHED_EVENT]] is sent after the
     * latest frame with a camera movement. The default is 300ms.
     */
    movementThrottleTimeout?: number;
    /**
     * How to calculate the Field of View, if not specified, then
     * [[DEFAULT_FOV_CALCULATION]] is used.
     */
    fovCalculation?: FovCalculation;
    languages?: string[];
    /**
     * Sets the data sources to use specific country point of view (political view).
     *
     * This option may result in rendering different country borders then commonly accepted for
     * some regions and it mainly regards to so called __disputed borders__. Although not all
     * data sources or themes may support it.
     *
     * @note Country code should be coded in lower-case ISO 3166-1 alpha-2 standard, if this option
     * is `undefined` the majority point of view will be used.
     */
    politicalView?: string;
    /**
     * Set fixed pixel ratio for rendering. Useful when rendering on high resolution displays with
     * low performance GPUs that may be fill-rate limited.
     * @default `window.devicePixelRatio`
     */
    pixelRatio?: number;
    /**
     * Set fixed pixel ratio for rendering when the camera is moving or an animation is running.
     * Useful when rendering on high resolution displays with low performance GPUs that may be
     * fill-rate limited.
     *
     * If a value is specified, a low resolution render pass is used to render the scene into a
     * low resolution render target, before it is copied to the screen.
     *
     * A value of `undefined` disables the low res render pass. Values between 0.5 and
     * `window.devicePixelRatio` can be tried to give  good results. The value should not be larger
     * than `window.devicePixelRatio`.
     *
     * @note Since no anti-aliasing is applied during dynamic rendering with `dynamicPixelRatio`
     * defined, visual artifacts may occur, especially with thin lines..
     *
     * @note The resolution of icons and text labels is not affected.
     *
     * @default `undefined`
     */
    dynamicPixelRatio?: number;
    /**
     * Set maximum FPS (Frames Per Second). If VSync in enabled, the specified number may not be
     * reached, but instead the next smaller number than `maxFps` that is equal to the refresh rate
     * divided by an integer number.
     *
     * E.g.: If the monitors refresh rate is set to 60hz, and if `maxFps` is set to a value of `40`
     * (60hz/1.5), the actual used FPS may be 30 (60hz/2). For displays that have a refresh rate of
     * 60hz, good values for `maxFps` are 30, 20, 15, 12, 10, 6, 3 and 1. A value of `0` is ignored.
     */
    maxFps?: number;
    /**
     * Enable map repeat for planar projections.
     * If `true`, map will be repeated in longitudinal direction continuously.
     * If `false`, map will end on lon -180 & 180 deg.
     *
     * @default `true`
     */
    tileWrappingEnabled?: boolean;
    /**
     * Set tiling scheme for [[BackgroundDataSource]]
     */
    backgroundTilingScheme?: TilingScheme;
    /**
     * Should be the {@link PolarTileDataSource} used on spherical projection.
     * Default is `true`.
     */
    enablePolarDataSource?: boolean;
    /**
     * The name of the [[StyleSet]] used by {@link PolarTileDataSource}
     * to evaluate for the decoding.
     * Default is `"polar"`.
     */
    polarStyleSetName?: string;
    /**
     * Storage level offset of regular tiles from reference datasource to align
     * {@link PolarTileDataSource} tiles to.
     * Default is `-1`.
     */
    polarGeometryLevelOffset?: number;
    /**
     * Hint for the WebGL implementation on which power mode to prefer.
     */
    powerPreference?: MapViewPowerPreference;
    /**
     * Set to `true` to allow rendering scene synchronously.
     *
     * By calling `renderSync()` scene draws immediately, opposite to default case when
     * `update` method requests redraw and waits for the next animation frame.
     *
     * You need to set up your own render loop controller.
     * Event `MapViewEventNames.Update` fired when {@link MapView} requests for an redraw.
     * E.g.: When tiles loaded asynchronously and ready for rendering.
     *
     * @note Internal `maxFps` will be overridden and may not work properly as `renderSync`
     * intended to be called from external render loop.
     *
     * @default false.
     */
    synchronousRendering?: boolean;
    /**
     * Set true to enable rendering mixed levels of detail (increases rendering performance).
     * If not set will enable mixed levels of detail for spherical projection
     * and disable for other projections.
     *
     * @default undefined
     */
    enableMixedLod?: boolean;
    /**
     * If enableMixedLod is `true`, this value will be used to calculate the minimum Pixel Size of a
     * tile regarding to the screen size. When the area of a tile is smaller then this calculated
     * area on the screen, the subdivision of tiles is stopped and therefore higher level tiles will
     * be rendered instead.
     * @beta
     *
     * @default 256
     */
    lodMinTilePixelSize?: number;
    /**
     * Enable shadows in the map. Shadows will only be casted on features that use the "standard"
     * or "extruded-polygon" technique in the map theme.
     * @default false
     */
    enableShadows?: boolean;
    /**
     * Enable throttling for the TaskScheduler
     * @default false
     * @beta
     */
    throttlingEnabled?: boolean;
    /**
     * If set, the view will constrained within the given bounds in geo coordinates.
     */
    maxBounds?: GeoBox;
}
/**
 * Parameters for {@link (MapView.lookAt:WITH_PARAMS)}.
 */
export interface LookAtParams {
    /**
     * Target/look at point of the MapView.
     *
     * @note If the given point is not on the ground (altitude != 0) {@link MapView} will do a
     * raycasting internally to find a target on the ground.
     *
     * As a consequence {@link MapView.target} and {@link MapView.zoomLevel}
     * will not match the values
     * that were passed into the {@link (MapView.lookAt:WITH_PARAMS)} method.
     * @default `new GeoCoordinates(25, 0)` in {@link MapView.constructor} context.
     * @default {@link MapView.target} in {@link (MapView.lookAt:WITH_PARAMS)} context.
     */
    target: GeoCoordLike;
    /**
     * Fit MapView to these boundaries.
     *
     * If specified, `zoomLevel` and `distance` parameters are ignored and `lookAt` calculates best
     * `zoomLevel` to fit given bounds.
     *
     * * if `bounds` is {@link @here/harp-geoutils#GeoBox}, then `lookAt`
     *   use {@link LookAtParams.target} or `bounds.target` and
     *   ensure whole box is visible
     *
     * * if `bounds` is {@link @here/harp-geoutils#GeoPolygon}, then `lookAt`
     *   use `bounds.getCentroid()` and ensure whole polygon is visible
     *
     * * if `bounds` is {@link @here/harp-geoutils#GeoBoxExtentLike},
     *   then `lookAt` will use {@link LookAtParams.target} or
     *   current {@link MapView.target} and ensure whole extents are visible
     *
     * * if `bounds` is [[GeoCoordLike]][], then `lookAt` will use {@link LookAtParams.target} or
     *   calculated `target` as center of world box covering given points and ensure all points are
     *   visible
     *
     * Note in sphere projection some points are not visible if you specify bounds that span more
     * than 180 degrees in any direction.
     *
     * @see {@link (MapView.lookAt:WITH_PARAMS)} for details on how `bounds`
     *      interact with `target` parameter
     */
    bounds: GeoBox | GeoBoxExtentLike | GeoCoordLike[] | GeoPolygon;
    /**
     * Camera distance to the target point in world units.
     * @default zoomLevel defaults will be used if not set.
     */
    distance: number;
    /**
     * Zoomlevel of the MapView.
     * @note Takes precedence over distance.
     * @default 5 in {@link MapView.constructor} context.
     * @default {@link MapView.zoomLevel} in {@link (MapView.lookAt:WITH_PARAMS)} context.
     */
    zoomLevel: number;
    /**
     * Tilt angle in degrees. 0 is top down view.
     * @default 0 in {@link MapView.constructor} context.
     * @default {@link MapView.tilt} in {@link (MapView.lookAt:WITH_PARAMS)} context.
     * @note Maximum supported tilt is 89??
     */
    tilt: number;
    /**
     * Heading angle in degrees and clockwise. 0 is north-up.
     * @default 0 in {@link MapView.constructor} context.
     * @default {@link MapView.heading} in {@link (MapView.lookAt:WITH_PARAMS)} context.
     */
    heading: number;
}
/**
 * The core class of the library to call in order to create a map visualization. It needs to be
 * linked to datasources.
 */
export declare class MapView extends EventDispatcher {
    /**
     * Keep the events here to avoid a global reference to MapView (and thus prevent garbage collection).
     */
    private readonly UPDATE_EVENT;
    private readonly RENDER_EVENT;
    private readonly DID_RENDER_EVENT;
    private readonly FIRST_FRAME_EVENT;
    private readonly FRAME_COMPLETE_EVENT;
    private readonly THEME_LOADED_EVENT;
    private readonly ANIMATION_STARTED_EVENT;
    private readonly ANIMATION_FINISHED_EVENT;
    private readonly MOVEMENT_STARTED_EVENT;
    private readonly MOVEMENT_FINISHED_EVENT;
    private readonly CONTEXT_LOST_EVENT;
    private readonly CONTEXT_RESTORED_EVENT;
    private readonly COPYRIGHT_CHANGED_EVENT;
    private readonly DISPOSE_EVENT;
    /**
     * The instance of {@link MapRenderingManager} managing the rendering of the map. It is a public
     * property to allow access and modification of some parameters of the rendering process at
     * runtime.
     */
    readonly mapRenderingManager: IMapRenderingManager;
    private m_renderLabels;
    private m_movementFinishedUpdateTimerId?;
    private m_postEffects?;
    private readonly m_screenProjector;
    private m_visibleTiles;
    private readonly m_tileObjectRenderer;
    private m_elevationSource?;
    private m_elevationRangeSource?;
    private m_elevationProvider?;
    private m_visibleTileSetLock;
    private readonly m_tileGeometryManager;
    private m_tileWrappingEnabled;
    private m_zoomLevel;
    private m_minZoomLevel;
    private m_maxZoomLevel;
    private readonly m_minCameraHeight;
    private m_geoMaxBounds?;
    private m_worldMaxBounds?;
    private readonly m_camera;
    /**
     * Relative to eye camera.
     *
     * This camera is internal camera used to improve precision
     * when rendering geometries.
     */
    private readonly m_rteCamera;
    private m_yaw;
    private m_pitch;
    private m_roll;
    private m_targetDistance;
    private m_targetGeoPos;
    private readonly m_targetWorldPos;
    private readonly m_viewRanges;
    private m_pointOfView?;
    private m_pixelToWorld?;
    private m_pixelRatio?;
    /** Default scene for map objects and map anchors */
    private readonly m_scene;
    /** Separate scene for overlay map anchors */
    private readonly m_overlayScene;
    /** Root node of [[m_scene]] that gets cleared every frame. */
    private readonly m_sceneRoot;
    /** Root node of [[m_overlayScene]] that gets cleared every frame. */
    private readonly m_overlaySceneRoot;
    private readonly m_mapAnchors;
    private m_animationCount;
    private m_animationFrameHandle;
    private m_drawing;
    private m_updatePending;
    private readonly m_renderer;
    private m_frameNumber;
    private m_textElementsRenderer;
    private m_forceCameraAspect;
    private m_taskSchedulerTimeout;
    private readonly m_tileDataSources;
    private readonly m_connectedDataSources;
    private readonly m_failedDataSources;
    private readonly m_polarDataSource?;
    private readonly m_enablePolarDataSource;
    private readonly m_raycaster;
    private readonly m_plane;
    private readonly m_sphere;
    private readonly m_options;
    private readonly m_visibleTileSetOptions;
    private readonly m_uriResolver?;
    private m_previousFrameTimeStamp?;
    private m_firstFrameRendered;
    private m_firstFrameComplete;
    private readonly handleRequestAnimationFrame;
    private readonly m_pickHandler;
    private readonly m_userImageCache;
    private readonly m_env;
    private readonly m_poiManager;
    private readonly m_poiTableManager;
    private readonly m_collisionDebugCanvas;
    private readonly m_movementDetector;
    private m_thisFrameTilesChanged;
    private m_lastTileIds;
    private m_languages;
    private m_politicalView;
    private m_copyrightInfo;
    private readonly m_animatedExtrusionHandler;
    private m_enableMixedLod;
    private readonly m_lodMinTilePixelSize;
    private m_taskScheduler;
    private readonly m_themeManager;
    private readonly m_sceneEnvironment;
    private m_disposed;
    /**
     * Constructs a new `MapView` with the given options or canvas element.
     *
     * @param options - The `MapView` options or the HTML canvas element used to display the map.
     */
    constructor(options: MapViewOptions);
    /**
     * @returns The lights configured by the theme, this is just a convenience method, because the
     * lights can still be accessed by traversing the children of the [[scene]].
     */
    get lights(): THREE.Light[];
    get taskQueue(): TaskQueue;
    /**
     * @returns Whether label rendering is enabled.
     */
    get renderLabels(): boolean;
    /**
     * Enables or disables rendering of labels.
     * @param value - `true` to enable labels `false` to disable them.
     */
    set renderLabels(value: boolean);
    /**
     * @returns Whether adding of new labels during interaction is enabled.
     */
    get delayLabelsUntilMovementFinished(): boolean;
    /**
     * Enables or disables adding of  new labels during interaction. Has no influence on already
     * placed labels
     * @param value - `true` to enable adding `false` to disable them.
     */
    set delayLabelsUntilMovementFinished(value: boolean);
    /**
     * @hidden
     * The {@link TextElementsRenderer} select the visible {@link TextElement}s and renders them.
     */
    get textElementsRenderer(): TextElementsRenderer;
    /**
     * @hidden
     * The {@link CameraMovementDetector} detects camera movements. Made available for performance
     * measurements.
     */
    get cameraMovementDetector(): CameraMovementDetector;
    /**
     * The {@link AnimatedExtrusionHandler} controls animated extrusion effect
     * of the extruded objects in the {@link Tile}
     */
    get animatedExtrusionHandler(): AnimatedExtrusionHandler;
    /**
     * The [[TileGeometryManager]] manages geometry during loading and handles hiding geometry of
     * specified [[GeometryKind]]s.
     * @deprecated
     */
    get tileGeometryManager(): TileGeometryManager | undefined;
    get enableMixedLod(): boolean | undefined;
    set enableMixedLod(enableMixedLod: boolean | undefined);
    get tileWrappingEnabled(): boolean;
    set tileWrappingEnabled(enabled: boolean);
    /**
     * Disposes this `MapView`.
     * @override
     *
     * @param freeContext - `true` to force ThreeJS to loose the context. Supply `false` to keep
     * the context for further use.
     *
     * @remarks
     * This function cleans the resources that are managed manually including those that exist in
     * shared caches.
     *
     * Note: This function does not try to clean objects that can be disposed off easily by
     * TypeScript's garbage collecting mechanism. Consequently, if you need to perform a full
     * cleanup, you must ensure that all references to this `MapView` are removed.
     */
    dispose(freeContext?: boolean): void;
    /**
     * Is `true` if dispose() as been called on `MapView`.
     */
    get disposed(): boolean;
    /**
     * The way the cache usage is computed, either based on size in MB (mega bytes) or in number of
     * tiles.
     */
    get resourceComputationType(): ResourceComputationType;
    set resourceComputationType(value: ResourceComputationType);
    /**
     * Returns the cache size.
     */
    getCacheSize(): number;
    /**
     * Sets the cache size in number of tiles.
     *
     * @param size - The cache size in tiles.
     * @param numVisibleTiles - The number of tiles visible, which is size/2 by default.
     */
    setCacheSize(size: number, numVisibleTiles?: number): void;
    /**
     * Specifies whether extended frustum culling is enabled or disabled.
     */
    get extendedFrustumCulling(): boolean;
    /**
     * Enable of disable extended frustum culling.
     */
    set extendedFrustumCulling(value: boolean);
    /**
     * Returns the status of frustum culling after each update.
     */
    get lockVisibleTileSet(): boolean;
    /**
     * Enable of disable frustum culling after each update.
     */
    set lockVisibleTileSet(value: boolean);
    /**
     * Gets the optional camera used to render the scene.
     */
    get pointOfView(): THREE.PerspectiveCamera | undefined;
    /**
     * Sets the optional camera used to render the scene.
     */
    set pointOfView(pointOfView: THREE.PerspectiveCamera | undefined);
    /**
     * Loads a post effects definition file.
     *
     * @param postEffectsFile - File URL describing the post effects.
     */
    loadPostEffects(postEffectsFile: string): void;
    /**
     * The abstraction of the {@link MapRenderingManager} API for post effects.
     */
    get postEffects(): PostEffects | undefined;
    set postEffects(postEffects: PostEffects | undefined);
    /**
     * Gets the current `Theme` used by this `MapView` to style map elements.
     * @deprecated
     */
    get theme(): Theme;
    /**
     * Changes the `Theme` used by this `MapView` to style map elements.
     * @deprecated use MapView.setTheme instead
     */
    set theme(theme: Theme);
    /**
     * Changes the `Theme`used by this `MapView`to style map elements.
     */
    setTheme(theme: Theme | FlatTheme | string): Promise<Theme>;
    /**
     * Returns the currently set `Theme` as a `Promise` as it might be still loading/updating.
     */
    getTheme(): Promise<Theme>;
    /**
     * {@link @here/harp-utils#UriResolver} used to resolve application/deployment
     * specific `URI`s into actual `URLs` that can be loaded with `fetch`.
     */
    get uriResolver(): UriResolver | undefined;
    /**
     * Gets the value of the forced custom camera aspect.
     * Every time a frame is rendered, `MapView` resets the camera aspect.
     *
     * You can disable this behavior by setting the value to `undefined`.
     */
    get forceCameraAspect(): number | undefined;
    /**
     * Sets the custom forced camera aspect ratio to use while rendering.
     */
    set forceCameraAspect(aspect: number | undefined);
    /**
     * Lists the ISO 639-1 language codes for DataSources to use.
     */
    get languages(): string[] | undefined;
    /**
     * Sets the list of ISO 639-1 language codes for DataSources to use.
     */
    set languages(languages: string[] | undefined);
    /**
     * Get currently presented political point of view - the country code.
     *
     * @note Country code is stored in lower-case ISO 3166-1 alpha-2 standard.
     * @return Country code or undefined if default
     * (majorly accepted) point of view is used.
     */
    get politicalView(): string | undefined;
    /**
     * Set the political view (country code) to be used when rendering disputed features (borders).
     *
     * @note Country code should be encoded in lower-case ISO 3166-1 alpha-2 standard.
     * @param pov - The code of the country which point of view should be presented,
     * if `undefined` or empty string is set then "defacto" or most widely accepted point of view
     * will be presented.
     */
    set politicalView(pov: string | undefined);
    get copyrightInfo(): CopyrightInfo[];
    /**
     * @hidden
     * Disable all fading animations (for debugging and performance measurement). Defaults to
     * `false`.
     */
    set disableFading(disable: boolean);
    get disableFading(): boolean;
    /**
     * @hidden
     * Return current frame number.
     */
    get frameNumber(): number;
    /**
     * @hidden
     * Reset the frame number to 0.
     */
    resetFrameNumber(): void;
    /**
     * Adds an event listener. There are various events that are sent before or after a new frame
     * is rendered.
     *
     * @see [[MapViewEventNames]].
     *
     * @example
     * ```TypeScript
     * let frameCount = 0;
     * mapView.addEventListener(MapViewEventNames.Render, () => {
     *     ++frameCount;
     * });
     * ```
     *
     * @param type - One of the [[MapViewEventNames]] strings.
     * @param listener - The callback invoked when the `MapView` needs to render a new frame.
     */
    addEventListener(type: MapViewEventNames, listener: (event: RenderEvent) => void): void;
    /**
     * Removes an event listener. There are various events that are sent before or after a new frame
     * is rendered.
     *
     * @see [[MapViewEventNames]].
     *
     * @example
     * ```TypeScript
     * mapView.removeEventListener(MapViewEventNames.Render, listener);
     * ```
     *
     * @param type - One of the [[MapViewEventNames]] strings.
     * @param listener - The callback invoked when the `MapView` needs to render a new frame.
     */
    removeEventListener(type: MapViewEventNames, listener?: (event: RenderEvent) => void): void;
    /**
     * The HTML canvas element used by this `MapView`.
     */
    get canvas(): HTMLCanvasElement;
    /**
     * The HTML canvas element used by this `MapView`.
     */
    get collisionDebugCanvas(): HTMLCanvasElement | undefined;
    /**
     * The THREE.js scene used by this `MapView`.
     */
    get scene(): THREE.Scene;
    /**
     * The THREE.js overlay scene
     */
    get overlayScene(): THREE.Scene;
    /**
     * The MapViewEnvironment used by this `MapView`.
     * @internal
     */
    get sceneEnvironment(): MapViewEnvironment;
    /**
     * The THREE.js camera used by this `MapView` to render the main scene.
     *
     * @remarks
     * When modifying the camera all derived properties like:
     * - {@link MapView.target}
     * - {@link MapView.zoomLevel}
     * - {@link MapView.tilt}
     * - {@link MapView.heading}
     * could change.
     * These properties are cached internally and will only be updated in the next animation frame.
     * FIXME: Unfortunately THREE.js is not dispatching any events when camera properties change
     * so we should have an API for enforcing update of cached values.
     */
    get camera(): THREE.PerspectiveCamera;
    /**
     * The THREE.js `WebGLRenderer` used by this scene.
     */
    get renderer(): THREE.WebGLRenderer;
    /**
     * The color used to clear the view.
     */
    get clearColor(): number;
    /**
     * The color used to clear the view.
     */
    set clearColor(color: number);
    /**
     * The alpha used to clear the view.
     */
    get clearAlpha(): number;
    /**
     * The alpha used to clear the view.
     */
    set clearAlpha(alpha: number);
    /**
     * The projection used to project geo coordinates to world coordinates.
     */
    get projection(): Projection;
    /**
     * Changes the projection at run time.
     *
     * @param projection - The {@link @here/harp-geoutils#Projection} instance to use.
     */
    set projection(projection: Projection);
    /**
     * Get camera clipping planes evaluator used.
     */
    get clipPlanesEvaluator(): ClipPlanesEvaluator;
    /**
     * Changes the clip planes evaluator at run time.
     */
    set clipPlanesEvaluator(clipPlanesEvaluator: ClipPlanesEvaluator);
    /**
     * The distance (in pixels) between the screen and the camera.
     * @deprecated Use {@link CameraUtils.getFocalLength}
     */
    get focalLength(): number;
    /**
     * Get geo coordinates of camera focus (target) point.
     *
     * @remarks
     * This point is not necessarily on the ground, i.e.:
     *  - if the tilt is high and projection is {@link @here/harp-geoutils#sphereProjection}`
     *  - if the camera was modified directly and is not pointing to the ground.
     * In any case the projection of the target point will be in the center of the screen.
     *
     * @returns geo coordinates of the camera focus point.
     */
    get target(): GeoCoordinates;
    /** @internal
     * Get world coordinates of camera focus point.
     *
     * @remarks
     * @note The focus point coordinates are updated with each camera update so you don't need
     * to re-calculate it, although if the camera started looking to the void, the last focus
     * point is stored.
     *
     * @returns world coordinates of the camera focus point.
     */
    get worldTarget(): THREE.Vector3;
    /** @internal
     * Get distance from camera to the point of focus in world units.
     *
     * @note If camera does not point to any ground anymore the last focus point distance is
     * then returned.
     *
     * @returns Last known focus point distance.
     */
    get targetDistance(): number;
    /**
     * Get object describing frustum planes distances and min/max visibility range for actual
     * camera setup.
     *
     * @remarks
     * Near and far plane distance are self explanatory while minimum and maximum visibility range
     * describes the extreme near/far planes distances that may be achieved with current camera
     * settings, meaning at current zoom level (ground distance) and any possible orientation.
     * @note Visibility is directly related to camera [[ClipPlaneEvaluator]] used and determines
     * the maximum possible distance of camera far clipping plane regardless of tilt, but may change
     * whenever zoom level changes. Distance is measured in world units which may be approximately
     * equal to meters, but this depends on the distortion related to projection type used.
     * @internal
     */
    get viewRanges(): ViewRanges;
    /**
     * The position in geo coordinates of the center of the scene.
     * @internal
     */
    get geoCenter(): GeoCoordinates;
    /**
     * The position in geo coordinates of the center of the scene.
     *
     * @remarks
     * Longitude values outside of -180 and +180 are acceptable.
     */
    set geoCenter(geoCenter: GeoCoordinates);
    /**
     * The node in this MapView's scene containing the user {@link MapAnchor}s.
     *
     * @remarks
     * All (first level) children of this node will be positioned in world space according to the
     * [[MapAnchor.geoPosition]].
     * Deeper level children can be used to position custom objects relative to the anchor node.
     */
    get mapAnchors(): MapAnchors;
    /**
     * The position in world coordinates of the center of the scene.
     */
    get worldCenter(): THREE.Vector3;
    /**
     * Get the [[PickHandler]] for this `mapView`.
     */
    get pickHandler(): PickHandler;
    /**
     * @internal
     * Get the {@link ImageCache} that belongs to this `MapView`.
     *
     * Images stored in this cache are primarily used for POIs (icons) and they are used with the
     * current theme. Although images can be explicitly added and removed from the cache, it is
     * advised not to remove images from this cache. If an image that is part of client code
     * should be removed at any point other than changing the theme, the {@link useImageCache}
     * should be used instead.
     */
    get imageCache(): MapViewImageCache;
    /**
     * Get the {@link ImageCache} for user images that belongs to this `MapView`.
     *
     * Images added to this cache can be removed if no longer required.
     */
    get userImageCache(): MapViewImageCache;
    /**
     * @hidden
     * @internal
     * Get the {@link PoiManager} that belongs to this `MapView`.
     */
    get poiManager(): PoiManager;
    /**
     * @hidden
     * Get the array of {@link PoiTableManager} that belongs to this `MapView`.
     */
    get poiTableManager(): PoiTableManager;
    /**
     * The minimum camera height in meters.
     */
    get minCameraHeight(): number;
    /**
     * The minimum zoom level.
     */
    get minZoomLevel(): number;
    /**
     * The minimum zoom level.
     */
    set minZoomLevel(zoomLevel: number);
    /**
     * The maximum zoom level. Default is 14.
     */
    get maxZoomLevel(): number;
    /**
     * The maximum zoom level.
     */
    set maxZoomLevel(zoomLevel: number);
    /**
     * The view's maximum bounds in geo coordinates if any.
     */
    get geoMaxBounds(): GeoBox | undefined;
    /**
     * Sets or clears the view's maximum bounds in geo coordinates.
     *
     * @remarks
     * If set, the view will be
     * constrained to the given geo bounds.
     */
    set geoMaxBounds(bounds: GeoBox | undefined);
    /**
     * @hidden
     * @internal
     * The view's maximum bounds in world coordinates if any.
     */
    get worldMaxBounds(): THREE.Box3 | OrientedBox3 | undefined;
    /**
     * Returns the zoom level for the given camera setup.
     */
    get zoomLevel(): number;
    set zoomLevel(zoomLevel: number);
    /**
     * Returns tilt angle in degrees.
     */
    get tilt(): number;
    /**
     * Set the tilt angle of the map.
     * @param tilt -: New tilt angle in degrees.
     */
    set tilt(tilt: number);
    /**
     * Returns heading angle in degrees.
     */
    get heading(): number;
    /**
     * Set the heading angle of the map.
     * @param heading -: New heading angle in degrees.
     */
    set heading(heading: number);
    /**
     * Environment used to evaluate dynamic scene expressions.
     */
    get env(): Env;
    /**
     * Returns the storage level for the given camera setup.
     * @remarks
     * Actual storage level of the rendered data also depends
     * on {@link DataSource.storageLevelOffset}.
     */
    get storageLevel(): number;
    /**
     * Returns height of the viewport in pixels.
     */
    get viewportHeight(): number;
    /**
     * Returns `true` if the native WebGL antialiasing is enabled.
     *
     * @default `true` for `pixelRatio` < `2.0`, `false` otherwise.
     */
    get nativeWebglAntialiasEnabled(): boolean;
    /**
     * Returns {@link DataSource}s displayed by this `MapView`.
     */
    get dataSources(): DataSource[];
    /**
     * Set's the way in which the fov is calculated on the map view.
     *
     * @remarks
     * Note, for this to take visual effect, the map should be rendered
     * after calling this function.
     * @param fovCalculation - How the FOV is calculated.
     */
    setFovCalculation(fovCalculation: FovCalculation): void;
    /**
     * Returns the unique {@link DataSource} matching the given name.
     */
    getDataSourceByName(dataSourceName: string): DataSource | undefined;
    /**
     * Returns the array of {@link DataSource}s referring to the same [[StyleSet]].
     */
    getDataSourcesByStyleSetName(styleSetName: string): DataSource[];
    /**
     * Returns true if the specified {@link DataSource} is enabled.
     */
    isDataSourceEnabled(dataSource: DataSource): boolean;
    /**
     * Adds a new {@link DataSource} to this `MapView`.
     *
     * @remarks
     * `MapView` needs at least one {@link DataSource} to display something.
     * @param dataSource - The data source.
     */
    addDataSource(dataSource: DataSource): Promise<void>;
    /**
     * Removes {@link DataSource} from this `MapView`.
     *
     * @param dataSource - The data source to be removed
     */
    removeDataSource(dataSource: DataSource): void;
    /**
     * Access the `VisibleTileSet` to get access to all current datasources and their visible tiles.
     */
    get visibleTileSet(): VisibleTileSet;
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
     * Adjusts the camera to look at a given geo coordinate with tilt and heading angles.
     *
     * @remarks
     * #### Note on `target` and `bounds`
     *
     * If `bounds` are specified, `zoomLevel` and `distance` parameters are ignored and `lookAt`
     * calculates best zoomLevel (and possibly target) to fit given bounds.
     *
     * Following table shows how relation between `bounds` and target.
     *
     * | `bounds`             | `target`    | actual `target`
     * | ------               | ------      | --------
     * | {@link @here/harp-geoutils#GeoBox}           | _defined_   | `params.target` is used
     * | {@link @here/harp-geoutils#GeoBox}           | `undefined` | `bounds.center` is used as new `target`
     * | {@link @here/harp-geoutils#GeoBoxExtentLike} | `undefined` | current `MapView.target` is used
     * | {@link @here/harp-geoutils#GeoBoxExtentLike} | _defined_   | `params.target` is used
     * | [[GeoCoordLike]][]   | `undefined` | new `target` is calculated as center of world box covering given points
     * | [[GeoCoordLike]][]   | _defined_   | `params.target` is used and zoomLevel is adjusted to view all given geo points
     *
     * In each case, `lookAt` finds minimum `zoomLevel` that covers given extents or geo points.
     *
     * With flat projection, if `bounds` represents points on both sides of anti-meridian, and
     * {@link MapViewOptions.tileWrappingEnabled} is used, `lookAt` will use this knowledge and find
     * minimal view that may cover "next" or "previous" world.
     *
     * With sphere projection if `bounds` represents points on both sides of globe, best effort
     * method is used to find best `target``.
     *
     * #### Examples
     *
     * ```typescript
     * mapView.lookAt({heading: 90})
     *     // look east retaining current `target`, `zoomLevel` and `tilt`
     *
     * mapView.lookAt({lat: 40.707, lng: -74.01})
     *    // look at Manhattan, New York retaining other view params
     *
     * mapView.lookAt(bounds: { latitudeSpan: 10, longitudeSpan: 10})
     *    // look at current `target`, but extending zoomLevel so we see 10 degrees of lat/long span
     * ```
     *
     * @see More examples in [[LookAtExample]].
     *
     * @param params - {@link LookAtParams}
     *
     * {@labels WITH_PARAMS}
     */
    lookAt(params: Partial<LookAtParams>): void;
    /**
     * The method that sets the camera to the desired angle (`tiltDeg`) and `distance` (in meters)
     * to the `target` location, from a certain heading (`headingAngle`).
     *
     * @remarks
     * @param target - The location to look at.
     * @param distance - The distance of the camera to the target in meters.
     * @param tiltDeg - The camera tilt angle in degrees (0 is vertical), curbed below 89deg
     *                @default 0
     * @param headingDeg - The camera heading angle in degrees and clockwise (as opposed to yaw)
     *                   @default 0
     * starting north.
     * @deprecated Use lookAt version with {@link LookAtParams} object parameter.
     */
    lookAt(target: GeoCoordLike, distance: number, tiltDeg?: number, headingDeg?: number): void;
    /**
     * Moves the camera to the specified {@link @here/harp-geoutils#GeoCoordinates},
     * sets the desired `zoomLevel` and
     * adjusts the yaw and pitch.
     *
     * @remarks
     * The pitch of the camera is
     * always curbed so that the camera cannot
     * look above the horizon. This paradigm is necessary
     * in {@link @here/harp-map-controls#MapControls}, where the center of
     * the screen is used for the orbiting interaction (3 fingers / right mouse button).
     *
     * @param geoPos - Geolocation to move the camera to.
     * @param zoomLevel - Desired zoom level.
     * @param yawDeg - Camera yaw in degrees, counter-clockwise (as opposed to heading), starting
     * north.
     * @param pitchDeg - Camera pitch in degrees.
     * @deprecated Use {@link (MapView.lookAt:WITH_PARAMS)} instead.
     */
    setCameraGeolocationAndZoom(geoPos: GeoCoordinates, zoomLevel: number, yawDeg?: number, pitchDeg?: number): void;
    /**
     * Updates the value of a dynamic property.
     *
     * @remarks
     * Property names starting with a `$`-sign are reserved and any attempt to change their value
     * will result in an error.
     *
     * Themes can access dynamic properties using the `Expr` operator `["dynamic-properties"]`,
     * for example:
     *
     *   `["get", "property name", ["dynamic-properties"]]`
     *
     * @param name - The name of the property.
     * @param value - The value of the property.
     */
    setDynamicProperty(name: string, value: Value): void;
    /**
     * Removes the given dynamic property from this {@link MapView}.
     *
     * @remarks
     * Property names starting with a `$`-sign are reserved and any attempt to change their value
     * will result in an error.
     *
     * @param name - The name of the property to remove.
     */
    removeDynamicProperty(name: string): void;
    /**
     * Returns `true` if this `MapView` is constantly redrawing the scene.
     */
    get animating(): boolean;
    /**
     * Begin animating the scene.
     */
    beginAnimation(): void;
    /**
     * Stop animating the scene.
     */
    endAnimation(): void;
    /**
     * Returns `true` if the camera moved in the last frame.
     */
    get cameraIsMoving(): boolean;
    /**
     * Returns `true` if the current frame will immediately be followed by another frame.
     * @deprecated This should only be used for the internal handling of the render loop,
     * if you use your own RenderLoop use {@link MapView::renderSync} in combination with
     * {@link MapViewEventNames.FrameComplete}
     **/
    get isDynamicFrame(): boolean;
    /**
     * Returns the ratio between a pixel and a world unit for the current camera (in the center of
     * the camera projection).
     */
    get pixelToWorld(): number;
    /**
     * Returns the ratio between a world and a pixel unit for the current camera (in the center of
     * the camera projection).
     */
    get worldToPixel(): number;
    get pixelRatio(): number;
    /**
     * PixelRatio in the WebGlRenderer. May contain values > 1.0 for high resolution screens
     * (HiDPI).
     *
     * @remarks
     * A value of `undefined` will make the getter return `window.devicePixelRatio`, setting a value
     * of `1.0` will disable the use of HiDPI on all devices.
     *
     * @note Since the current pixelRatio may have been used in some calculations (e.g. the icons)
     * they may appear in the wrong size now. To ensure proper display of data, a call to
     * `clearTileCache()` is required if the pixelRatio is changed after tiles have been loaded.
     *
     * @memberof MapView
     */
    set pixelRatio(pixelRatio: number);
    /**
     * Maximum FPS (Frames Per Second).
     *
     * @remarks
     * If VSync in enabled, the specified number may not be
     * reached, but instead the next smaller number than `maxFps` that is equal to the refresh rate
     * divided by an integer number.
     *
     * E.g.: If the monitors refresh rate is set to 60hz, and if `maxFps` is set to a value of `40`
     * (60hz/1.5), the actual used FPS may be 30 (60hz/2). For displays that have a refresh rate of
     * 60hz, good values for `maxFps` are 30, 20, 15, 12, 10, 6, 3 and 1. A value of `0` is ignored.
     */
    set maxFps(value: number);
    get maxFps(): number;
    /**
     * PixelRatio ratio for rendering when the camera is moving or an animation is running.
     *
     * @remarks
     * Useful when rendering on high resolution displays with low performance GPUs
     * that may be fill-rate-limited.
     *
     * If a value is specified, a low resolution render pass is used to render the scene into a
     * low resolution render target, before it is copied to the screen.
     *
     * A value of `undefined` disables the low res render pass. Values between 0.5 and
     * `window.devicePixelRatio` can be tried to give  good results. The value should not be larger
     * than `window.devicePixelRatio`.
     *
     * @note Since no anti-aliasing is applied during dynamic rendering with `dynamicPixelRatio`
     * defined, visual artifacts may occur, especially with thin lines..
     *
     * @note The resolution of icons and text labels is not affected.
     *
     * @default `undefined`
     */
    set dynamicPixelRatio(ratio: number | undefined);
    get dynamicPixelRatio(): number | undefined;
    /**
     * Returns the screen position of the given geo or world position.
     *
     * @param pos - The position as a {@link @here/harp-geoutils#GeoCoordLike} or
     * {@link https://threejs.org/docs/#api/en/math/Vector3 | THREE.Vector3} world position.
     * @returns The screen position in CSS/client coordinates (no pixel ratio applied) or
     * `undefined`.
     */
    getScreenPosition(pos: GeoCoordLike | THREE.Vector3): THREE.Vector2 | undefined;
    getWorldPositionAt(x: number, y: number, fallback: true): THREE.Vector3;
    getWorldPositionAt(x: number, y: number, fallback?: boolean): THREE.Vector3 | null;
    /**
     * Same as {@link MapView.getGeoCoordinatesAt} but always returning a geo coordinate.
     */
    getGeoCoordinatesAt(x: number, y: number, fallback: true): GeoCoordinates;
    /**
     * Returns the {@link @here/harp-geoutils#GeoCoordinates} from the
     * given screen position.
     *
     * @remarks
     * If `fallback !== true` the return value can be `null`, in case the camera has a high tilt
     * and the given `(x, y)` value is not intersecting the ground plane.
     * If `fallback === true` the return value will always exist but it might not be on the earth
     * surface.
     * If {@link MapView.tileWrappingEnabled} is `true` the returned geo coordinates will have a
     * longitude clamped to [-180,180] degrees.
     * The returned geo coordinates are not normalized so that a map object placed at that position
     * will be below the (x,y) screen coordinates, regardless which world repetition was on screen.
     *
     * @param x - The X position in css/client coordinates (without applied display ratio).
     * @param y - The Y position in css/client coordinates (without applied display ratio).
     * @param fallback - Whether to compute a fallback position if the earth surface is not hit.
     * @returns Un-normalized geo coordinates
     */
    getGeoCoordinatesAt(x: number, y: number, fallback?: boolean): GeoCoordinates | null;
    /**
     * Returns the normalized screen coordinates from the given pixel position.
     *
     * @param x - The X position in css/client coordinates (without applied display ratio).
     * @param y - The Y position in css/client coordinates (without applied display ratio).
     */
    getNormalizedScreenCoordinates(x: number, y: number): THREE.Vector3;
    /**
     * Do a raycast on all objects in the scene. Useful for picking.
     *
     * @remarks
     * Limited to objects that THREE.js can raycast, the solid lines
     * that get their geometry in the shader cannot be tested
     * for intersection.
     *
     * Note, if a {@link DataSource} adds an [[Object3D]]
     * to a {@link Tile}, it will be only pickable once
     * {@link MapView.render} has been called, this is because
     * {@link MapView.render} method creates the
     * internal three.js root [[Object3D]] which is used in the [[PickHandler]] internally.
     * This method will not test for intersection custom objects added to the scene by for
     * example calling directly the [[scene.add]] method from THREE.
     *
     * @param x - The X position in css/client coordinates (without applied display ratio).
     * @param y - The Y position in css/client coordinates (without applied display ratio).
     * @param parameters - The intersection test behaviour may be adjusted by providing an instance
     * of {@link IntersectParams}.
     * @returns The list of intersection results.
     */
    intersectMapObjects(x: number, y: number, parameters?: IntersectParams): PickResult[];
    /**
     * Resize the HTML canvas element and the THREE.js `WebGLRenderer`.
     *
     * @param width - The new width.
     * @param height - The new height.
     */
    resize(width: number, height: number): void;
    /**
     * Redraws scene immediately
     *
     * @remarks
     * @note Before using this method, set `synchronousRendering` to `true`
     * in the {@link MapViewOptions}
     *
     * @param frameStartTime - Optional timestamp for start of frame.
     * Default: [[PerformanceTimer.now()]]
     */
    renderSync(frameStartTime?: number): void;
    /**
     * Requests a redraw of the scene.
     */
    update(): void;
    /**
     * Returns `true` if an update has already been requested, such that after a currently rendering
     * frame, the next frame will be rendered immediately.
     */
    get updatePending(): boolean;
    /**
     * Requests a redraw of the scene.
     * @deprecated Use the [[update]] method instead.
     */
    requestUpdateIfNeeded(): void;
    /**
     * Clear the tile cache.
     *
     * @remarks
     * Remove the {@link Tile} objects created by cacheable
     * {@link DataSource}s. If a {@link DataSource} name is
     * provided, this method restricts the eviction the {@link DataSource} with the given name.
     *
     * @param dataSourceName - The name of the {@link DataSource}.
     * @param filter Optional tile filter
     */
    clearTileCache(dataSourceName?: string, filter?: (tile: Tile) => boolean): void;
    /**
     * Apply visitor to all visible tiles.
     *
     * @param fun - Visitor function
     */
    forEachVisibleTile(fun: (tile: Tile) => void): void;
    /**
     * Apply a visitor function to all tiles in the cache.
     *
     * @param visitor - Visitor function
     */
    forEachCachedTile(visitor: (tile: Tile) => void): void;
    /**
     * Visit each tile in visible, rendered, and cached sets.
     *
     * @remarks
     *  * Visible and temporarily rendered tiles will be marked for update and retained.
     *  * Cached but not rendered/visible will be evicted.
     *
     * @param dataSource - If passed, only the tiles from this {@link DataSource} instance
     * are processed. If `undefined`, tiles from all {@link DataSource}s are processed.
     * @param filter Optional tile filter
     */
    markTilesDirty(dataSource?: DataSource, filter?: (tile: Tile) => boolean): void;
    /**
     * Sets the DataSource which contains the elevations, the elevation range source, and the
     * elevation provider.
     *
     * @remarks
     * Only a single elevation source is possible per {@link MapView}.
     * If the terrain-datasource is merged with this repository, we could internally construct
     * the {@link ElevationRangeSource} and the {@link ElevationProvider}
     * and access would be granted to
     * the application when it asks for it, to simplify the API.
     *
     * @param elevationSource - The datasource containing the terrain tiles.
     * @param elevationRangeSource - Allows access to the elevation min / max per tile.
     * @param elevationProvider - Allows access to the elevation at a given location or a ray
     *      from the camera.
     */
    setElevationSource(elevationSource: DataSource, elevationRangeSource: ElevationRangeSource, elevationProvider: ElevationProvider): Promise<void>;
    /**
     * Clears any elevation sources and provider previously set.
     * @param elevationSource - The datasource to be cleared.
     */
    clearElevationSource(elevationSource: DataSource): void;
    /**
     * Public access to {@link MapViewFog} allowing to toggle it by setting its `enabled` property.
     */
    get fog(): MapViewFog;
    private setPostEffects;
    /**
     * Returns the elevation provider.
     */
    get elevationProvider(): ElevationProvider | undefined;
    /**
     * @beta
     */
    get throttlingEnabled(): boolean;
    /**
     * @beta
     */
    set throttlingEnabled(enabled: boolean);
    get shadowsEnabled(): boolean;
    set shadowsEnabled(enabled: boolean);
    private extractAttitude;
    private lookAtImpl;
    /**
     * Plug-in PolarTileDataSource for spherical projection and plug-out otherwise
     */
    private updatePolarDataSource;
    /**
     * Updates the camera and the projections and resets the screen collisions,
     * note, setupCamera must be called before this is called.
     *
     * @remarks
     * @param viewRanges - optional parameter that supplies new view ranges, most importantly
     * near/far clipping planes distance. If parameter is not provided view ranges will be
     * calculated from [[ClipPlaneEvaluator]] used in {@link VisibleTileSet}.
     */
    private updateCameras;
    /**
     * Derive the look at settings (i.e. target, zoom, ...) from the current camera.
     */
    private updateLookAtSettings;
    /**
     * Update `Env` instance used for style `Expr` evaluations.
     */
    private updateEnv;
    /**
     * Transfer the NDC point to view space.
     * @param vector - Vector to transform.
     * @param result - Result to place calculation.
     */
    ndcToView(vector: Vector3Like, result: THREE.Vector3): THREE.Vector3;
    /**
     * Render loop callback that should only be called by [[requestAnimationFrame]].
     * Will trigger [[requestAnimationFrame]] again if updates are pending or  animation is running.
     * @param frameStartTime - The start time of the current frame
     */
    private renderLoop;
    /**
     * Start render loop if not already running.
     */
    private startRenderLoop;
    /**
     * Returns the list of the enabled data sources.
     */
    private getEnabledTileDataSources;
    /**
     * Renders the current frame.
     */
    private render;
    private setupCamera;
    private createVisibleTileSet;
    private movementStarted;
    private movementFinished;
    /**
     * Check if the set of visible tiles changed since the last frame.
     *
     * May be called multiple times per frame.
     *
     * Equality is computed by creating a string containing the IDs of the tiles.
     */
    private checkIfTilesChanged;
    private checkCopyrightUpdates;
    private getRenderedTilesCopyrightInfo;
    private setupStats;
    private setupRenderer;
    private createTextRenderer;
    /**
     * @internal
     * @param fontCatalogs
     * @param textStyles
     * @param defaultTextStyle
     */
    resetTextRenderer(fontCatalogs?: FontCatalogConfig[], textStyles?: TextStyleDefinition[], defaultTextStyle?: TextStyleDefinition): Promise<void>;
    /**
     * Default handler for webglcontextlost event.
     *
     * Note: The renderer `this.m_renderer` may not be initialized when this function is called.
     */
    private readonly onWebGLContextLost;
    /**
     * Default handler for webglcontextrestored event.
     *
     * Note: The renderer `this.m_renderer` may not be initialized when this function is called.
     */
    private readonly onWebGLContextRestored;
    /**
     * Sets the field of view calculation, and applies it immediately to the camera.
     *
     * @param fovCalculation - How to calculate the FOV
     * @param height - Viewport height.
     */
    private setFovOnCamera;
    /**
     * Get canvas client size in css/client pixels.
     *
     * Supports canvases not attached to DOM, which have 0 as `clientWidth` and `clientHeight` by
     * calculating it from actual canvas size and current pixel ratio.
     */
    private getCanvasClientSize;
}
//# sourceMappingURL=MapView.d.ts.map