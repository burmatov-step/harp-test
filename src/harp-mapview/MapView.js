"use strict";
let exports = {}
exports.MapView = exports.MapViewPowerPreference = exports.MapViewEventNames = exports.TileTaskGroups = void 0;
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
import * as harp_datasource_protocol_1 from "@here/harp-datasource-protocol";
import * as harp_geoutils_1 from "@here/harp-geoutils";
import * as harp_utils_1 from "@here/harp-utils";
import * as THREE from "three";
import AnimatedExtrusionHandler_1 from "./AnimatedExtrusionHandler";
import BackgroundDataSource_1 from "./BackgroundDataSource";
import CameraMovementDetector_1 from "./CameraMovementDetector";
import CameraUtils_1 from "./CameraUtils";
import ClipPlanesEvaluator_1 from "./ClipPlanesEvaluator";
import composing_1 from "./composing";
import ConcurrentDecoderFacade_1 from "./ConcurrentDecoderFacade";
import ConcurrentTilerFacade_1 from "./ConcurrentTilerFacade";
import CopyrightInfo_1 from "./copyrights/CopyrightInfo";
import EventDispatcher_1 from "./EventDispatcher";
import FovCalculation_1 from "./FovCalculation";
import FrustumIntersection_1 from "./FrustumIntersection";
import overlayOnElevation_1 from "./geometry/overlayOnElevation";
import TileGeometryManager_1 from "./geometry/TileGeometryManager";
import MapViewImageCache_1 from "./image/MapViewImageCache";
import MapAnchors_1 from "./MapAnchors";
import MapViewEnvironment_1 from "./MapViewEnvironment";
import MapViewTaskScheduler_1 from "./MapViewTaskScheduler";
import MapViewThemeManager_1 from "./MapViewThemeManager";
import PickHandler_1 from "./PickHandler";
import PoiManager_1 from "./poi/PoiManager";
import PoiTableManager_1 from "./poi/PoiTableManager";
import PolarTileDataSource_1 from "./PolarTileDataSource";
import ScreenProjector_1 from "./ScreenProjector";
import Statistics_1 from "./Statistics";
import MapViewState_1 from "./text/MapViewState";
import TextElementsRenderer_1 from "./text/TextElementsRenderer";
import TileObjectsRenderer_1 from "./TileObjectsRenderer";
import Utils_1 from "./Utils";
import VisibleTileSet_1 from "./VisibleTileSet";
// Cache value, because access to process.env.NODE_ENV is SLOW!
const isProduction = process.env.NODE_ENV === "production";
if (isProduction) {
    // In production: silence logging below error.
    harp_utils_1.LoggerManager.instance.setLogLevelForAll(harp_utils_1.LogLevel.Error);
}
else {
    // In dev: silence logging below log (silences "debug" and "trace" levels).
    harp_utils_1.LoggerManager.instance.setLogLevelForAll(harp_utils_1.LogLevel.Log);
}
var TileTaskGroups;
(function (TileTaskGroups) {
    TileTaskGroups["FETCH_AND_DECODE"] = "fetch";
    //DECODE = "decode",
    TileTaskGroups["CREATE"] = "create";
    //UPLOAD = "upload"
})(TileTaskGroups = exports.TileTaskGroups || (exports.TileTaskGroups = {}));
var MapViewEventNames;
(function (MapViewEventNames) {
    /** Called before this `MapView` starts to render a new frame. */
    MapViewEventNames["Update"] = "update";
    /** Called when the WebGL canvas is resized. */
    MapViewEventNames["Resize"] = "resize";
    /** Called when the frame is about to be rendered. */
    MapViewEventNames["Render"] = "render";
    /** Called after a frame has been rendered. */
    MapViewEventNames["AfterRender"] = "didrender";
    /** Called after the first frame has been rendered. */
    MapViewEventNames["FirstFrame"] = "first-render";
    /**
     * Called when the rendered frame was complete, i.e. all the necessary tiles and resources
     * are loaded and rendered.
     */
    MapViewEventNames["FrameComplete"] = "frame-complete";
    /** Called when the theme has been loaded with the internal {@link ThemeLoader}. */
    MapViewEventNames["ThemeLoaded"] = "theme-loaded";
    /** Called when the animation mode has started. */
    MapViewEventNames["AnimationStarted"] = "animation-started";
    /** Called when the animation mode has stopped. */
    MapViewEventNames["AnimationFinished"] = "animation-finished";
    /** Called when a camera interaction has been detected. */
    MapViewEventNames["MovementStarted"] = "movement-started";
    /** Called when a camera interaction has been stopped. */
    MapViewEventNames["MovementFinished"] = "movement-finished";
    /** Called when a data source has been connected or failed to connect. */
    MapViewEventNames["DataSourceConnect"] = "datasource-connect";
    /** Emitted when copyright info of rendered map has been changed. */
    MapViewEventNames["CopyrightChanged"] = "copyright-changed";
    /** Called when the WebGL context is lost. */
    MapViewEventNames["ContextLost"] = "webglcontext-lost";
    /** Called when the WebGL context is restored. */
    MapViewEventNames["ContextRestored"] = "webglcontext-restored";
    /** Called when camera position has been changed. */
    MapViewEventNames["CameraPositionChanged"] = "camera-changed";
    /** Called when dispose has been called, before any cleanup is done. */
    MapViewEventNames["Dispose"] = "dispose";
})(MapViewEventNames = exports.MapViewEventNames || (exports.MapViewEventNames = {}));
const logger = harp_utils_1.LoggerManager.instance.create("MapView");
const DEFAULT_CAM_NEAR_PLANE = 0.1;
const DEFAULT_CAM_FAR_PLANE = 4000000;
const DEFAULT_MIN_ZOOM_LEVEL = 1;
/**
 * Default maximum zoom level.
 */
const DEFAULT_MAX_ZOOM_LEVEL = 20;
/**
 * Default minimum camera height.
 */
const DEFAULT_MIN_CAMERA_HEIGHT = 20;
/**
 * Style set used by {@link PolarTileDataSource} by default.
 */
const DEFAULT_POLAR_STYLE_SET_NAME = "polar";
const cache = {
    vector2: [new THREE.Vector2()],
    vector3: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()],
    rayCaster: new THREE.Raycaster(),
    groundPlane: new THREE.Plane(),
    groundSphere: new THREE.Sphere(undefined, harp_geoutils_1.EarthConstants.EQUATORIAL_RADIUS),
    matrix4: [new THREE.Matrix4(), new THREE.Matrix4()],
    transform: [
        {
            position: new THREE.Vector3(),
            xAxis: new THREE.Vector3(),
            yAxis: new THREE.Vector3(),
            zAxis: new THREE.Vector3()
        }
    ],
    color: new THREE.Color()
};
/**
 * Hint for the WebGL implementation on which power mode to prefer.
 *
 * @see https://www.khronos.org/registry/webgl/specs/latest/1.0/#5.14.12
 */
var MapViewPowerPreference;
(function (MapViewPowerPreference) {
    /** Default value. */
    MapViewPowerPreference["Default"] = "default";
    /** Lower power mode, used to conserve energy. */
    MapViewPowerPreference["LowPower"] = "low-power";
    /** Maximum performance. */
    MapViewPowerPreference["HighPerformance"] = "high-performance";
})(MapViewPowerPreference = exports.MapViewPowerPreference || (exports.MapViewPowerPreference = {}));
/**
 * Default settings used by {@link MapView} collected in one place.
 * @internal
 */
const MapViewDefaults = {
    projection: harp_geoutils_1.mercatorProjection,
    addBackgroundDatasource: true,
    maxVisibleDataSourceTiles: 100,
    extendedFrustumCulling: true,
    tileCacheSize: 200,
    resourceComputationType: VisibleTileSet_1.ResourceComputationType.EstimationInMb,
    quadTreeSearchDistanceUp: 3,
    quadTreeSearchDistanceDown: 2,
    pixelRatio: typeof window !== "undefined" && window.devicePixelRatio !== undefined
        ? window.devicePixelRatio
        : 1.0,
    target: new harp_geoutils_1.GeoCoordinates(25, 0),
    zoomLevel: 5,
    tilt: 0,
    heading: 0,
    theme: {},
    maxTilesPerFrame: 0
};
/**
 * The core class of the library to call in order to create a map visualization. It needs to be
 * linked to datasources.
 */
export class MapView extends EventDispatcher_1.EventDispatcher {
    /**
     * Constructs a new `MapView` with the given options or canvas element.
     *
     * @param options - The `MapView` options or the HTML canvas element used to display the map.
     */
    constructor(options) {
        var _a, _b;
        super();
        /**
         * Keep the events here to avoid a global reference to MapView (and thus prevent garbage collection).
         */
        this.UPDATE_EVENT = { type: MapViewEventNames.Update };
        this.RENDER_EVENT = { type: MapViewEventNames.Render };
        this.DID_RENDER_EVENT = { type: MapViewEventNames.AfterRender };
        this.FIRST_FRAME_EVENT = { type: MapViewEventNames.FirstFrame };
        this.FRAME_COMPLETE_EVENT = {
            type: MapViewEventNames.FrameComplete
        };
        this.THEME_LOADED_EVENT = {
            type: MapViewEventNames.ThemeLoaded
        };
        this.ANIMATION_STARTED_EVENT = {
            type: MapViewEventNames.AnimationStarted
        };
        this.ANIMATION_FINISHED_EVENT = {
            type: MapViewEventNames.AnimationFinished
        };
        this.MOVEMENT_STARTED_EVENT = {
            type: MapViewEventNames.MovementStarted
        };
        this.MOVEMENT_FINISHED_EVENT = {
            type: MapViewEventNames.MovementFinished
        };
        this.CONTEXT_LOST_EVENT = {
            type: MapViewEventNames.ContextLost
        };
        this.CONTEXT_RESTORED_EVENT = {
            type: MapViewEventNames.ContextRestored
        };
        this.COPYRIGHT_CHANGED_EVENT = {
            type: MapViewEventNames.CopyrightChanged
        };
        this.DISPOSE_EVENT = { type: MapViewEventNames.Dispose };
        this.m_renderLabels = true;
        this.m_visibleTileSetLock = false;
        this.m_tileWrappingEnabled = true;
        this.m_zoomLevel = DEFAULT_MIN_ZOOM_LEVEL;
        this.m_minZoomLevel = DEFAULT_MIN_ZOOM_LEVEL;
        this.m_maxZoomLevel = DEFAULT_MAX_ZOOM_LEVEL;
        this.m_minCameraHeight = DEFAULT_MIN_CAMERA_HEIGHT;
        /**
         * Relative to eye camera.
         *
         * This camera is internal camera used to improve precision
         * when rendering geometries.
         */
        this.m_rteCamera = new THREE.PerspectiveCamera();
        this.m_yaw = 0;
        this.m_pitch = 0;
        this.m_roll = 0;
        this.m_targetDistance = 0;
        this.m_targetGeoPos = harp_geoutils_1.GeoCoordinates.fromObject(MapViewDefaults.target);
        // Focus point world coords may be calculated after setting projection, use dummy value here.
        this.m_targetWorldPos = new THREE.Vector3();
        this.m_viewRanges = {
            near: DEFAULT_CAM_NEAR_PLANE,
            far: DEFAULT_CAM_FAR_PLANE,
            minimum: DEFAULT_CAM_NEAR_PLANE,
            maximum: DEFAULT_CAM_FAR_PLANE
        };
        /** Default scene for map objects and map anchors */
        this.m_scene = new THREE.Scene();
        /** Separate scene for overlay map anchors */
        this.m_overlayScene = new THREE.Scene();
        /** Root node of [[m_scene]] that gets cleared every frame. */
        this.m_sceneRoot = new THREE.Object3D();
        /** Root node of [[m_overlayScene]] that gets cleared every frame. */
        this.m_overlaySceneRoot = new THREE.Object3D();
        this.m_mapAnchors = new MapAnchors_1.MapAnchors();
        this.m_animationCount = 0;
        this.m_drawing = false;
        this.m_updatePending = false;
        this.m_frameNumber = 0;
        this.m_forceCameraAspect = undefined;
        // type any as it returns different types depending on the environment
        this.m_taskSchedulerTimeout = undefined;
        //
        // sources
        //
        this.m_tileDataSources = [];
        this.m_connectedDataSources = new Set();
        this.m_failedDataSources = new Set();
        this.m_enablePolarDataSource = true;
        // gestures
        this.m_raycaster = new THREE.Raycaster();
        this.m_plane = new THREE.Plane(new THREE.Vector3(0, 0, 1));
        this.m_sphere = new THREE.Sphere(undefined, harp_geoutils_1.EarthConstants.EQUATORIAL_RADIUS);
        this.m_firstFrameRendered = false;
        this.m_firstFrameComplete = false;
        this.m_userImageCache = new MapViewImageCache_1.MapViewImageCache();
        this.m_env = new harp_datasource_protocol_1.MapEnv({});
        this.m_poiManager = new PoiManager_1.PoiManager(this);
        this.m_poiTableManager = new PoiTableManager_1.PoiTableManager(this);
        this.m_lastTileIds = "";
        this.m_copyrightInfo = [];
        // `true` if dispose() has been called on `MapView`.
        this.m_disposed = false;
        /**
         * Default handler for webglcontextlost event.
         *
         * Note: The renderer `this.m_renderer` may not be initialized when this function is called.
         */
        this.onWebGLContextLost = (event) => {
            this.dispatchEvent(this.CONTEXT_LOST_EVENT);
            logger.warn("WebGL context lost", event);
        };
        /**
         * Default handler for webglcontextrestored event.
         *
         * Note: The renderer `this.m_renderer` may not be initialized when this function is called.
         */
        this.onWebGLContextRestored = (event) => {
            this.dispatchEvent(this.CONTEXT_RESTORED_EVENT);
            if (this.m_renderer !== undefined) {
                this.textElementsRenderer.restoreRenderers(this.m_renderer);
                this.getTheme().then(theme => {
                    this.m_sceneEnvironment.updateClearColor(theme.clearColor, theme.clearAlpha);
                    this.update();
                });
            }
            logger.warn("WebGL context restored", event);
        };
        // make a copy to avoid unwanted changes to the original options.
        this.m_options = Object.assign({}, options);
        this.m_uriResolver = this.m_options.uriResolver;
        if (this.m_options.minZoomLevel !== undefined) {
            this.m_minZoomLevel = this.m_options.minZoomLevel;
        }
        if (this.m_options.maxZoomLevel !== undefined) {
            this.m_maxZoomLevel = this.m_options.maxZoomLevel;
        }
        if (this.m_options.minCameraHeight !== undefined) {
            this.m_minCameraHeight = this.m_options.minCameraHeight;
        }
        if (this.m_options.maxBounds !== undefined) {
            this.m_geoMaxBounds = this.m_options.maxBounds;
        }
        if (this.m_options.decoderUrl !== undefined) {
            ConcurrentDecoderFacade_1.ConcurrentDecoderFacade.defaultScriptUrl = this.m_uriResolver
                ? this.m_uriResolver.resolveUri(this.m_options.decoderUrl)
                : this.m_options.decoderUrl;
        }
        if (this.m_options.decoderCount !== undefined) {
            ConcurrentDecoderFacade_1.ConcurrentDecoderFacade.defaultWorkerCount = this.m_options.decoderCount;
        }
        this.m_visibleTileSetOptions = Object.assign(Object.assign({}, MapViewDefaults), { clipPlanesEvaluator: options.clipPlanesEvaluator !== undefined
                ? options.clipPlanesEvaluator
                : ClipPlanesEvaluator_1.createDefaultClipPlanesEvaluator() });
        if (options.projection !== undefined) {
            this.m_visibleTileSetOptions.projection = options.projection;
        }
        if (options.extendedFrustumCulling !== undefined) {
            this.m_visibleTileSetOptions.extendedFrustumCulling = options.extendedFrustumCulling;
        }
        if (options.maxVisibleDataSourceTiles !== undefined) {
            this.m_visibleTileSetOptions.maxVisibleDataSourceTiles =
                options.maxVisibleDataSourceTiles;
        }
        if (options.tileCacheSize !== undefined) {
            this.m_visibleTileSetOptions.tileCacheSize = options.tileCacheSize;
        }
        if (options.resourceComputationType !== undefined) {
            this.m_visibleTileSetOptions.resourceComputationType = options.resourceComputationType;
        }
        if (options.quadTreeSearchDistanceUp !== undefined) {
            this.m_visibleTileSetOptions.quadTreeSearchDistanceUp =
                options.quadTreeSearchDistanceUp;
        }
        if (options.quadTreeSearchDistanceDown !== undefined) {
            this.m_visibleTileSetOptions.quadTreeSearchDistanceDown =
                options.quadTreeSearchDistanceDown;
        }
        if (options.enablePolarDataSource !== undefined) {
            this.m_enablePolarDataSource = options.enablePolarDataSource;
        }
        this.m_pixelRatio = options.pixelRatio;
        this.m_options.maxFps = (_a = this.m_options.maxFps) !== null && _a !== void 0 ? _a : 0;
        this.m_options.enableStatistics = this.m_options.enableStatistics === true;
        this.m_languages = this.m_options.languages;
        this.m_politicalView = this.m_options.politicalView;
        this.handleRequestAnimationFrame = this.renderLoop.bind(this);
        if (this.m_options.tileWrappingEnabled !== undefined) {
            this.m_tileWrappingEnabled = this.m_options.tileWrappingEnabled;
        }
        // Initialization of the stats
        this.setupStats(this.m_options.enableStatistics);
        this.canvas.addEventListener("webglcontextlost", this.onWebGLContextLost);
        this.canvas.addEventListener("webglcontextrestored", this.onWebGLContextRestored);
        // Initialization of the renderer, enable backward compatibility with three.js <= 0.117
        this.m_renderer = new ((_b = THREE.WebGL1Renderer) !== null && _b !== void 0 ? _b : THREE.WebGLRenderer)({
            canvas: this.canvas,
            context: this.m_options.context,
            antialias: this.nativeWebglAntialiasEnabled,
            alpha: this.m_options.alpha,
            preserveDrawingBuffer: this.m_options.preserveDrawingBuffer === true,
            powerPreference: this.m_options.powerPreference === undefined
                ? MapViewPowerPreference.Default
                : this.m_options.powerPreference
        });
        this.m_renderer.autoClear = false;
        this.m_renderer.debug.checkShaderErrors = !isProduction;
        // This is detailed at https://threejs.org/docs/#api/renderers/WebGLRenderer.info
        // When using several WebGLRenderer#render calls per frame, it is the only way to get
        // correct rendering data from ThreeJS.
        this.m_renderer.info.autoReset = false;
        this.m_tileObjectRenderer = new TileObjectsRenderer_1.TileObjectRenderer(this.m_env, this.m_renderer);
        this.setupRenderer(this.m_tileObjectRenderer);
        this.m_options.fovCalculation =
            this.m_options.fovCalculation === undefined
                ? FovCalculation_1.DEFAULT_FOV_CALCULATION
                : this.m_options.fovCalculation;
        this.m_options.fovCalculation.fov = THREE.MathUtils.clamp(this.m_options.fovCalculation.fov, FovCalculation_1.MIN_FOV_DEG, FovCalculation_1.MAX_FOV_DEG);
        // Initialization of mCamera and mVisibleTiles
        const { width, height } = this.getCanvasClientSize();
        const aspect = width / height;
        this.m_camera = new THREE.PerspectiveCamera(this.m_options.fovCalculation.fov, aspect, DEFAULT_CAM_NEAR_PLANE, DEFAULT_CAM_FAR_PLANE);
        this.m_camera.up.set(0, 0, 1);
        this.setFovOnCamera(this.m_options.fovCalculation, height);
        this.projection.projectPoint(this.m_targetGeoPos, this.m_targetWorldPos);
        this.m_scene.add(this.m_camera); // ensure the camera is added to the scene.
        this.m_screenProjector = new ScreenProjector_1.ScreenProjector(this.m_camera);
        // Scheduler must be initialized before VisibleTileSet.
        this.m_taskScheduler = new MapViewTaskScheduler_1.MapViewTaskScheduler(this.maxFps);
        this.m_tileGeometryManager = new TileGeometryManager_1.TileGeometryManager(this);
        if (options.enableMixedLod !== undefined) {
            this.m_enableMixedLod = options.enableMixedLod;
        }
        if (options.lodMinTilePixelSize !== undefined) {
            this.m_lodMinTilePixelSize = options.lodMinTilePixelSize;
        }
        // this.m_visibleTiles is set in createVisibleTileSet, set it here again only to let tsc
        // know the member is set in the constructor.
        this.m_visibleTiles = this.createVisibleTileSet();
        this.m_sceneEnvironment = new MapViewEnvironment_1.MapViewEnvironment(this, options);
        // setup camera with initial position
        this.setupCamera();
        this.m_pickHandler = new PickHandler_1.PickHandler(this, this.m_rteCamera, this.m_options.enablePickTechnique === true);
        this.m_movementDetector = new CameraMovementDetector_1.CameraMovementDetector(this.m_options.movementThrottleTimeout, () => this.movementStarted(), () => this.movementFinished());
        const mapPassAntialiasSettings = this.m_options.customAntialiasSettings;
        this.mapRenderingManager = new composing_1.MapRenderingManager(width, height, this.m_options.dynamicPixelRatio, mapPassAntialiasSettings);
        this.m_animatedExtrusionHandler = new AnimatedExtrusionHandler_1.AnimatedExtrusionHandler(this);
        if (this.m_enablePolarDataSource) {
            const styleSetName = options.polarStyleSetName !== undefined
                ? options.polarStyleSetName
                : DEFAULT_POLAR_STYLE_SET_NAME;
            this.m_polarDataSource = new PolarTileDataSource_1.PolarTileDataSource({
                styleSetName,
                geometryLevelOffset: options.polarGeometryLevelOffset
            });
            this.updatePolarDataSource();
        }
        this.m_taskScheduler.addEventListener(MapViewEventNames.Update, () => {
            this.update();
        });
        if (options.throttlingEnabled !== undefined) {
            this.m_taskScheduler.throttlingEnabled = options.throttlingEnabled;
        }
        this.m_themeManager = new MapViewThemeManager_1.MapViewThemeManager(this, this.m_uriResolver);
        // will initialize with an empty theme and updated when theme is loaded and set
        this.m_textElementsRenderer = this.createTextRenderer();
        this.setTheme(harp_utils_1.getOptionValue(this.m_options.theme, MapViewDefaults.theme));
        this.update();
    }
    /**
     * @returns The lights configured by the theme, this is just a convenience method, because the
     * lights can still be accessed by traversing the children of the [[scene]].
     */
    get lights() {
        return this.m_sceneEnvironment.lights;
    }
    get taskQueue() {
        return this.m_taskScheduler.taskQueue;
    }
    /**
     * @returns Whether label rendering is enabled.
     */
    get renderLabels() {
        return this.m_renderLabels;
    }
    /**
     * Enables or disables rendering of labels.
     * @param value - `true` to enable labels `false` to disable them.
     */
    set renderLabels(value) {
        this.m_renderLabels = value;
    }
    /**
     * @returns Whether adding of new labels during interaction is enabled.
     */
    get delayLabelsUntilMovementFinished() {
        return this.textElementsRenderer.delayLabelsUntilMovementFinished;
    }
    /**
     * Enables or disables adding of  new labels during interaction. Has no influence on already
     * placed labels
     * @param value - `true` to enable adding `false` to disable them.
     */
    set delayLabelsUntilMovementFinished(value) {
        this.textElementsRenderer.delayLabelsUntilMovementFinished = value;
    }
    /**
     * @hidden
     * The {@link TextElementsRenderer} select the visible {@link TextElement}s and renders them.
     */
    get textElementsRenderer() {
        return this.m_textElementsRenderer;
    }
    /**
     * @hidden
     * The {@link CameraMovementDetector} detects camera movements. Made available for performance
     * measurements.
     */
    get cameraMovementDetector() {
        return this.m_movementDetector;
    }
    /**
     * The {@link AnimatedExtrusionHandler} controls animated extrusion effect
     * of the extruded objects in the {@link Tile}
     */
    get animatedExtrusionHandler() {
        return this.m_animatedExtrusionHandler;
    }
    /**
     * The [[TileGeometryManager]] manages geometry during loading and handles hiding geometry of
     * specified [[GeometryKind]]s.
     * @deprecated
     */
    get tileGeometryManager() {
        return this.m_tileGeometryManager;
    }
    get enableMixedLod() {
        return this.m_enableMixedLod;
    }
    set enableMixedLod(enableMixedLod) {
        // Skip unnecessary update
        if (this.m_enableMixedLod === enableMixedLod) {
            return;
        }
        this.m_enableMixedLod = enableMixedLod;
        this.createVisibleTileSet();
        this.update();
    }
    get tileWrappingEnabled() {
        return this.m_tileWrappingEnabled;
    }
    set tileWrappingEnabled(enabled) {
        if (this.projection.type === harp_geoutils_1.ProjectionType.Spherical) {
            logger.warn("Setting this with spherical projection has no affect. Was this intended?");
            return;
        }
        if (enabled !== this.m_tileWrappingEnabled) {
            this.m_tileWrappingEnabled = enabled;
            this.createVisibleTileSet();
        }
        this.update();
    }
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
    dispose(freeContext = true) {
        // Enforce listeners that we are about to dispose.
        this.DISPOSE_EVENT.time = Date.now();
        this.dispatchEvent(this.DISPOSE_EVENT);
        this.m_disposed = true;
        if (this.m_movementFinishedUpdateTimerId) {
            clearTimeout(this.m_movementFinishedUpdateTimerId);
            this.m_movementFinishedUpdateTimerId = undefined;
        }
        if (this.m_animationFrameHandle !== undefined) {
            cancelAnimationFrame(this.m_animationFrameHandle);
            this.m_animationFrameHandle = undefined;
        }
        this.canvas.removeEventListener("webglcontextlost", this.onWebGLContextLost);
        this.canvas.removeEventListener("webglcontextrestored", this.onWebGLContextRestored);
        for (const dataSource of this.m_tileDataSources) {
            dataSource.dispose();
        }
        this.m_visibleTiles.clearTileCache();
        this.m_textElementsRenderer.clearRenderStates();
        this.m_renderer.dispose();
        if (freeContext) {
            // See for a discussion of using this call to force freeing the context:
            //   https://github.com/mrdoob/three.js/pull/17588
            // The patch to call forceContextLoss() upon WebGLRenderer.dispose() had been merged,
            // but has been reverted later:
            //   https://github.com/mrdoob/three.js/pull/19022
            this.m_renderer.forceContextLoss();
        }
        this.m_themeManager.dispose();
        this.m_tileGeometryManager.clear();
        this.m_movementDetector.dispose();
        // Destroy the facade if the there are no workers active anymore.
        ConcurrentDecoderFacade_1.ConcurrentDecoderFacade.destroyIfTerminated();
        ConcurrentTilerFacade_1.ConcurrentTilerFacade.destroyIfTerminated();
        this.m_taskScheduler.clearQueuedTasks();
        // Remove all event handlers.
        super.dispose();
    }
    /**
     * Is `true` if dispose() as been called on `MapView`.
     */
    get disposed() {
        return this.m_disposed;
    }
    /**
     * The way the cache usage is computed, either based on size in MB (mega bytes) or in number of
     * tiles.
     */
    get resourceComputationType() {
        return this.m_visibleTiles.resourceComputationType;
    }
    set resourceComputationType(value) {
        this.m_visibleTiles.resourceComputationType = value;
    }
    /**
     * Returns the cache size.
     */
    getCacheSize() {
        return this.m_visibleTiles.getDataSourceCacheSize();
    }
    /**
     * Sets the cache size in number of tiles.
     *
     * @param size - The cache size in tiles.
     * @param numVisibleTiles - The number of tiles visible, which is size/2 by default.
     */
    setCacheSize(size, numVisibleTiles) {
        this.m_visibleTiles.setDataSourceCacheSize(size);
        numVisibleTiles = numVisibleTiles !== undefined ? numVisibleTiles : size / 2;
        this.m_visibleTiles.setNumberOfVisibleTiles(Math.floor(numVisibleTiles));
        this.m_themeManager.updateCache();
        this.m_textElementsRenderer.invalidateCache();
        this.update();
    }
    /**
     * Specifies whether extended frustum culling is enabled or disabled.
     */
    get extendedFrustumCulling() {
        return this.m_options.extendedFrustumCulling !== undefined
            ? this.m_visibleTileSetOptions.extendedFrustumCulling
            : true;
    }
    /**
     * Enable of disable extended frustum culling.
     */
    set extendedFrustumCulling(value) {
        this.m_visibleTileSetOptions.extendedFrustumCulling = value;
    }
    /**
     * Returns the status of frustum culling after each update.
     */
    get lockVisibleTileSet() {
        return this.m_visibleTileSetLock;
    }
    /**
     * Enable of disable frustum culling after each update.
     */
    set lockVisibleTileSet(value) {
        this.m_visibleTileSetLock = value;
    }
    /**
     * Gets the optional camera used to render the scene.
     */
    get pointOfView() {
        return this.m_pointOfView;
    }
    /**
     * Sets the optional camera used to render the scene.
     */
    set pointOfView(pointOfView) {
        this.m_pointOfView = pointOfView;
        this.update();
    }
    /**
     * Loads a post effects definition file.
     *
     * @param postEffectsFile - File URL describing the post effects.
     */
    loadPostEffects(postEffectsFile) {
        fetch(postEffectsFile)
            .then(response => response.json())
            .then((postEffects) => {
            this.m_postEffects = postEffects;
            this.setPostEffects();
        });
    }
    /**
     * The abstraction of the {@link MapRenderingManager} API for post effects.
     */
    get postEffects() {
        return this.m_postEffects;
    }
    set postEffects(postEffects) {
        this.m_postEffects = postEffects;
        this.setPostEffects();
    }
    /**
     * Gets the current `Theme` used by this `MapView` to style map elements.
     * @deprecated
     */
    get theme() {
        return this.m_themeManager.theme;
    }
    /**
     * Changes the `Theme` used by this `MapView` to style map elements.
     * @deprecated use MapView.setTheme instead
     */
    set theme(theme) {
        this.setTheme(theme);
    }
    /**
     * Changes the `Theme`used by this `MapView`to style map elements.
     */
    async setTheme(theme) {
        const newTheme = await this.m_themeManager.setTheme(theme);
        this.THEME_LOADED_EVENT.time = Date.now();
        this.dispatchEvent(this.THEME_LOADED_EVENT);
        this.update();
        return newTheme;
    }
    /**
     * Returns the currently set `Theme` as a `Promise` as it might be still loading/updating.
     */
    async getTheme() {
        return await this.m_themeManager.getTheme();
    }
    /**
     * {@link @here/harp-utils#UriResolver} used to resolve application/deployment
     * specific `URI`s into actual `URLs` that can be loaded with `fetch`.
     */
    get uriResolver() {
        return this.m_uriResolver;
    }
    /**
     * Gets the value of the forced custom camera aspect.
     * Every time a frame is rendered, `MapView` resets the camera aspect.
     *
     * You can disable this behavior by setting the value to `undefined`.
     */
    get forceCameraAspect() {
        return this.m_forceCameraAspect;
    }
    /**
     * Sets the custom forced camera aspect ratio to use while rendering.
     */
    set forceCameraAspect(aspect) {
        this.m_forceCameraAspect = aspect;
    }
    /**
     * Lists the ISO 639-1 language codes for DataSources to use.
     */
    get languages() {
        return this.m_languages;
    }
    /**
     * Sets the list of ISO 639-1 language codes for DataSources to use.
     */
    set languages(languages) {
        this.m_languages = languages;
        this.m_tileDataSources.forEach((dataSource) => {
            dataSource.setLanguages(this.m_languages);
        });
        this.update();
    }
    /**
     * Get currently presented political point of view - the country code.
     *
     * @note Country code is stored in lower-case ISO 3166-1 alpha-2 standard.
     * @return Country code or undefined if default
     * (majorly accepted) point of view is used.
     */
    get politicalView() {
        return this.m_politicalView;
    }
    /**
     * Set the political view (country code) to be used when rendering disputed features (borders).
     *
     * @note Country code should be encoded in lower-case ISO 3166-1 alpha-2 standard.
     * @param pov - The code of the country which point of view should be presented,
     * if `undefined` or empty string is set then "defacto" or most widely accepted point of view
     * will be presented.
     */
    set politicalView(pov) {
        if (this.m_politicalView === pov) {
            return;
        }
        this.m_politicalView = pov;
        this.m_tileDataSources.forEach((dataSource) => {
            dataSource.setPoliticalView(pov);
        });
    }
    get copyrightInfo() {
        return this.m_copyrightInfo;
    }
    /**
     * @hidden
     * Disable all fading animations (for debugging and performance measurement). Defaults to
     * `false`.
     */
    set disableFading(disable) {
        this.m_textElementsRenderer.disableFading = disable;
    }
    get disableFading() {
        return this.m_textElementsRenderer.disableFading;
    }
    /**
     * @hidden
     * Return current frame number.
     */
    get frameNumber() {
        return this.m_frameNumber;
    }
    /**
     * @hidden
     * Reset the frame number to 0.
     */
    resetFrameNumber() {
        this.m_frameNumber = 0;
        this.m_previousFrameTimeStamp = undefined;
    }
    // overrides with THREE.js base classes are not recognized by tslint.
    addEventListener(type, listener) {
        super.addEventListener(type, listener);
    }
    // overrides with THREE.js base classes are not recognized by tslint.
    removeEventListener(type, listener) {
        super.removeEventListener(type, listener);
    }
    /**
     * The HTML canvas element used by this `MapView`.
     */
    get canvas() {
        return this.m_options.canvas;
    }
    /**
     * The HTML canvas element used by this `MapView`.
     */
    get collisionDebugCanvas() {
        return this.m_collisionDebugCanvas;
    }
    /**
     * The THREE.js scene used by this `MapView`.
     */
    get scene() {
        return this.m_scene;
    }
    /**
     * The THREE.js overlay scene
     */
    get overlayScene() {
        return this.m_overlayScene;
    }
    /**
     * The MapViewEnvironment used by this `MapView`.
     * @internal
     */
    get sceneEnvironment() {
        return this.m_sceneEnvironment;
    }
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
    get camera() {
        return this.m_camera;
    }
    /**
     * The THREE.js `WebGLRenderer` used by this scene.
     */
    get renderer() {
        return this.m_renderer;
    }
    /**
     * The color used to clear the view.
     */
    get clearColor() {
        const rendererClearColor = this.m_renderer.getClearColor(cache.color);
        return rendererClearColor !== undefined ? rendererClearColor.getHex() : 0;
    }
    /**
     * The color used to clear the view.
     */
    set clearColor(color) {
        this.m_renderer.setClearColor(color);
    }
    /**
     * The alpha used to clear the view.
     */
    get clearAlpha() {
        const rendererClearAlpha = this.m_renderer.getClearAlpha();
        return rendererClearAlpha !== undefined ? rendererClearAlpha : 0;
    }
    /**
     * The alpha used to clear the view.
     */
    set clearAlpha(alpha) {
        this.m_renderer.setClearAlpha(alpha);
    }
    /**
     * The projection used to project geo coordinates to world coordinates.
     */
    get projection() {
        return this.m_visibleTileSetOptions.projection;
    }
    /**
     * Changes the projection at run time.
     *
     * @param projection - The {@link @here/harp-geoutils#Projection} instance to use.
     */
    set projection(projection) {
        // Remember tilt and heading before setting the projection.
        const tilt = this.tilt;
        const heading = this.heading;
        this.m_visibleTileSetOptions.projection = projection;
        this.updatePolarDataSource();
        this.clearTileCache();
        this.textElementsRenderer.clearRenderStates();
        this.m_visibleTiles = this.createVisibleTileSet();
        // Set geo max bounds to compute world bounds with new projection.
        this.geoMaxBounds = this.geoMaxBounds;
        this.lookAtImpl({ tilt, heading });
    }
    /**
     * Get camera clipping planes evaluator used.
     */
    get clipPlanesEvaluator() {
        return this.m_visibleTileSetOptions.clipPlanesEvaluator;
    }
    /**
     * Changes the clip planes evaluator at run time.
     */
    set clipPlanesEvaluator(clipPlanesEvaluator) {
        this.m_visibleTileSetOptions.clipPlanesEvaluator = clipPlanesEvaluator;
    }
    /**
     * The distance (in pixels) between the screen and the camera.
     * @deprecated Use {@link CameraUtils.getFocalLength}
     */
    get focalLength() {
        var _a;
        const focalLength = (_a = CameraUtils_1.CameraUtils.getFocalLength(this.m_camera)) !== null && _a !== void 0 ? _a : 0;
        return focalLength;
    }
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
    get target() {
        return this.m_targetGeoPos;
    }
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
    get worldTarget() {
        return this.m_targetWorldPos;
    }
    /** @internal
     * Get distance from camera to the point of focus in world units.
     *
     * @note If camera does not point to any ground anymore the last focus point distance is
     * then returned.
     *
     * @returns Last known focus point distance.
     */
    get targetDistance() {
        return this.m_targetDistance;
    }
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
    get viewRanges() {
        return this.m_viewRanges;
    }
    /**
     * The position in geo coordinates of the center of the scene.
     * @internal
     */
    get geoCenter() {
        return this.projection.unprojectPoint(this.m_camera.position).normalized();
    }
    /**
     * The position in geo coordinates of the center of the scene.
     *
     * @remarks
     * Longitude values outside of -180 and +180 are acceptable.
     */
    set geoCenter(geoCenter) {
        if (geoCenter.altitude !== undefined) {
            this.projection.projectPoint(geoCenter, this.m_camera.position);
        }
        else {
            // Preserve the current altitude
            const altitude = this.geoCenter.altitude;
            this.projection.projectPoint(new harp_geoutils_1.GeoCoordinates(geoCenter.latitude, geoCenter.longitude, altitude), this.m_camera.position);
        }
        this.update();
    }
    /**
     * The node in this MapView's scene containing the user {@link MapAnchor}s.
     *
     * @remarks
     * All (first level) children of this node will be positioned in world space according to the
     * [[MapAnchor.geoPosition]].
     * Deeper level children can be used to position custom objects relative to the anchor node.
     */
    get mapAnchors() {
        return this.m_mapAnchors;
    }
    /**
     * The position in world coordinates of the center of the scene.
     */
    get worldCenter() {
        return this.m_camera.position;
    }
    /**
     * Get the [[PickHandler]] for this `mapView`.
     */
    get pickHandler() {
        return this.m_pickHandler;
    }
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
    get imageCache() {
        return this.m_themeManager.imageCache;
    }
    /**
     * Get the {@link ImageCache} for user images that belongs to this `MapView`.
     *
     * Images added to this cache can be removed if no longer required.
     */
    get userImageCache() {
        return this.m_userImageCache;
    }
    /**
     * @hidden
     * @internal
     * Get the {@link PoiManager} that belongs to this `MapView`.
     */
    get poiManager() {
        return this.m_poiManager;
    }
    /**
     * @hidden
     * Get the array of {@link PoiTableManager} that belongs to this `MapView`.
     */
    get poiTableManager() {
        return this.m_poiTableManager;
    }
    /**
     * The minimum camera height in meters.
     */
    get minCameraHeight() {
        return this.m_minCameraHeight;
    }
    /**
     * The minimum zoom level.
     */
    get minZoomLevel() {
        return this.m_minZoomLevel;
    }
    /**
     * The minimum zoom level.
     */
    set minZoomLevel(zoomLevel) {
        this.m_minZoomLevel = zoomLevel;
        this.update();
    }
    /**
     * The maximum zoom level. Default is 14.
     */
    get maxZoomLevel() {
        return this.m_maxZoomLevel;
    }
    /**
     * The maximum zoom level.
     */
    set maxZoomLevel(zoomLevel) {
        this.m_maxZoomLevel = zoomLevel;
        this.update();
    }
    /**
     * The view's maximum bounds in geo coordinates if any.
     */
    get geoMaxBounds() {
        return this.m_geoMaxBounds;
    }
    /**
     * Sets or clears the view's maximum bounds in geo coordinates.
     *
     * @remarks
     * If set, the view will be
     * constrained to the given geo bounds.
     */
    set geoMaxBounds(bounds) {
        this.m_geoMaxBounds = bounds;
        this.m_worldMaxBounds = this.m_geoMaxBounds
            ? this.projection.projectBox(this.m_geoMaxBounds, this.projection.type === harp_geoutils_1.ProjectionType.Planar
                ? new THREE.Box3()
                : new harp_geoutils_1.OrientedBox3())
            : undefined;
    }
    /**
     * @hidden
     * @internal
     * The view's maximum bounds in world coordinates if any.
     */
    get worldMaxBounds() {
        return this.m_worldMaxBounds;
    }
    /**
     * Returns the zoom level for the given camera setup.
     */
    get zoomLevel() {
        return this.m_zoomLevel;
    }
    set zoomLevel(zoomLevel) {
        this.lookAtImpl({ zoomLevel });
    }
    /**
     * Returns tilt angle in degrees.
     */
    get tilt() {
        return THREE.MathUtils.radToDeg(this.m_pitch);
    }
    /**
     * Set the tilt angle of the map.
     * @param tilt -: New tilt angle in degrees.
     */
    set tilt(tilt) {
        this.lookAtImpl({ tilt });
    }
    /**
     * Returns heading angle in degrees.
     */
    get heading() {
        return -THREE.MathUtils.radToDeg(this.m_yaw);
    }
    /**
     * Set the heading angle of the map.
     * @param heading -: New heading angle in degrees.
     */
    set heading(heading) {
        this.lookAtImpl({ heading });
    }
    /**
     * Environment used to evaluate dynamic scene expressions.
     */
    get env() {
        return this.m_env;
    }
    /**
     * Returns the storage level for the given camera setup.
     * @remarks
     * Actual storage level of the rendered data also depends
     * on {@link DataSource.storageLevelOffset}.
     */
    get storageLevel() {
        return THREE.MathUtils.clamp(Math.floor(this.m_zoomLevel), this.m_minZoomLevel, this.m_maxZoomLevel);
    }
    /**
     * Returns height of the viewport in pixels.
     */
    get viewportHeight() {
        return this.canvas.height;
    }
    /**
     * Returns `true` if the native WebGL antialiasing is enabled.
     *
     * @default `true` for `pixelRatio` < `2.0`, `false` otherwise.
     */
    get nativeWebglAntialiasEnabled() {
        return this.m_options.enableNativeWebglAntialias === undefined
            ? this.pixelRatio < 2.0
            : this.m_options.enableNativeWebglAntialias;
    }
    /**
     * Returns {@link DataSource}s displayed by this `MapView`.
     */
    get dataSources() {
        return this.m_tileDataSources;
    }
    /**
     * Set's the way in which the fov is calculated on the map view.
     *
     * @remarks
     * Note, for this to take visual effect, the map should be rendered
     * after calling this function.
     * @param fovCalculation - How the FOV is calculated.
     */
    setFovCalculation(fovCalculation) {
        this.m_options.fovCalculation = fovCalculation;
        this.updateCameras();
    }
    /**
     * Returns the unique {@link DataSource} matching the given name.
     */
    getDataSourceByName(dataSourceName) {
        return this.m_tileDataSources.find(ds => ds.name === dataSourceName);
    }
    /**
     * Returns the array of {@link DataSource}s referring to the same [[StyleSet]].
     */
    getDataSourcesByStyleSetName(styleSetName) {
        return this.m_tileDataSources.filter(ds => ds.styleSetName === styleSetName);
    }
    /**
     * Returns true if the specified {@link DataSource} is enabled.
     */
    isDataSourceEnabled(dataSource) {
        return (dataSource.enabled &&
            dataSource.ready() &&
            this.m_connectedDataSources.has(dataSource.name) &&
            dataSource.isVisible(this.zoomLevel));
    }
    /**
     * Adds a new {@link DataSource} to this `MapView`.
     *
     * @remarks
     * `MapView` needs at least one {@link DataSource} to display something.
     * @param dataSource - The data source.
     */
    async addDataSource(dataSource) {
        var _a, _b;
        const twinDataSource = this.getDataSourceByName(dataSource.name);
        if (twinDataSource !== undefined) {
            throw new Error(`A DataSource with the name "${dataSource.name}" already exists in this MapView.`);
        }
        dataSource.attach(this);
        dataSource.setEnableElevationOverlay(this.m_elevationProvider !== undefined);
        const conflictingDataSource = this.m_tileDataSources.find(ds => ds.addGroundPlane === true && !(ds instanceof BackgroundDataSource_1.BackgroundDataSource));
        if (dataSource.addGroundPlane === true && conflictingDataSource !== undefined) {
            // eslint-disable-next-line no-console
            console.warn(`The DataSources ${dataSource.name} and ${conflictingDataSource.name} both have a ground plane added, this will cause problems with the fallback logic, see HARP-14728 & HARP-15488.`);
        }
        this.m_tileDataSources.push(dataSource);
        (_a = this.m_sceneEnvironment) === null || _a === void 0 ? void 0 : _a.updateBackgroundDataSource();
        try {
            await dataSource.connect();
            const alreadyRemoved = !this.m_tileDataSources.includes(dataSource);
            if (alreadyRemoved) {
                return;
            }
            dataSource.addEventListener(MapViewEventNames.Update, () => {
                this.update();
            });
            const theme = await this.getTheme();
            dataSource.setLanguages(this.m_languages);
            if (theme !== undefined && theme.styles !== undefined) {
                await dataSource.setTheme(theme);
            }
            this.m_connectedDataSources.add(dataSource.name);
            this.dispatchEvent({
                type: MapViewEventNames.DataSourceConnect,
                dataSourceName: dataSource.name
            });
            this.update();
        }
        catch (error) {
            // error is a string if a promise was rejected.
            logger.error(`Failed to connect to datasource ${dataSource.name}: ${(_b = error.message) !== null && _b !== void 0 ? _b : error}`);
            this.m_failedDataSources.add(dataSource.name);
            this.dispatchEvent({
                type: MapViewEventNames.DataSourceConnect,
                dataSourceName: dataSource.name,
                error
            });
        }
    }
    /**
     * Removes {@link DataSource} from this `MapView`.
     *
     * @param dataSource - The data source to be removed
     */
    removeDataSource(dataSource) {
        const dsIndex = this.m_tileDataSources.indexOf(dataSource);
        if (dsIndex === -1) {
            return;
        }
        dataSource.detach(this);
        this.m_visibleTiles.removeDataSource(dataSource);
        this.m_tileDataSources.splice(dsIndex, 1);
        this.m_connectedDataSources.delete(dataSource.name);
        this.m_failedDataSources.delete(dataSource.name);
        this.m_sceneEnvironment.updateBackgroundDataSource();
        this.update();
    }
    /**
     * Access the `VisibleTileSet` to get access to all current datasources and their visible tiles.
     */
    get visibleTileSet() {
        return this.m_visibleTiles;
    }
    /**
     * Adds new overlay text elements to this `MapView`.
     *
     * @param textElements - Array of {@link TextElement} to be added.
     */
    addOverlayText(textElements) {
        this.m_textElementsRenderer.addOverlayText(textElements);
        this.update();
    }
    /**
     * Adds new overlay text elements to this `MapView`.
     *
     * @param textElements - Array of {@link TextElement} to be added.
     */
    clearOverlayText() {
        this.m_textElementsRenderer.clearOverlayText();
    }
    lookAt(targetOrParams, distance, tiltDeg, headingDeg) {
        if (harp_geoutils_1.isGeoCoordinatesLike(targetOrParams)) {
            const zoomLevel = distance !== undefined
                ? Utils_1.MapViewUtils.calculateZoomLevelFromDistance(this, distance)
                : undefined;
            const params = {
                target: targetOrParams,
                zoomLevel,
                tilt: tiltDeg,
                heading: headingDeg
            };
            this.lookAtImpl(params);
        }
        else if (typeof targetOrParams === "object") {
            this.lookAtImpl(targetOrParams);
        }
    }
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
    setCameraGeolocationAndZoom(geoPos, zoomLevel, yawDeg = 0, pitchDeg = 0) {
        this.geoCenter = geoPos;
        let limitedPitch = Math.min(Utils_1.MapViewUtils.MAX_TILT_DEG, pitchDeg);
        if (this.projection.type === harp_geoutils_1.ProjectionType.Spherical) {
            const maxPitchRadWithCurvature = Math.asin(harp_geoutils_1.EarthConstants.EQUATORIAL_RADIUS /
                (Utils_1.MapViewUtils.calculateDistanceToGroundFromZoomLevel(this, zoomLevel) +
                    harp_geoutils_1.EarthConstants.EQUATORIAL_RADIUS));
            const maxPitchDegWithCurvature = THREE.MathUtils.radToDeg(maxPitchRadWithCurvature);
            limitedPitch = Math.min(limitedPitch, maxPitchDegWithCurvature);
        }
        Utils_1.MapViewUtils.zoomOnTargetPosition(this, 0, 0, zoomLevel);
        Utils_1.MapViewUtils.setRotation(this, yawDeg, limitedPitch);
        this.update();
    }
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
    setDynamicProperty(name, value) {
        if (name.startsWith("$")) {
            throw new Error(`failed to update the value of the dynamic property '${name}'`);
        }
        this.m_env.entries[name] = value;
        this.update();
    }
    /**
     * Removes the given dynamic property from this {@link MapView}.
     *
     * @remarks
     * Property names starting with a `$`-sign are reserved and any attempt to change their value
     * will result in an error.
     *
     * @param name - The name of the property to remove.
     */
    removeDynamicProperty(name) {
        if (name.startsWith("$")) {
            throw new Error(`failed to remove the dynamic property '${name}'`);
        }
        delete this.m_env.entries[name];
        this.update();
    }
    /**
     * Returns `true` if this `MapView` is constantly redrawing the scene.
     */
    get animating() {
        return this.m_animationCount > 0;
    }
    /**
     * Begin animating the scene.
     */
    beginAnimation() {
        if (this.m_animationCount++ === 0) {
            this.update();
            this.ANIMATION_STARTED_EVENT.time = Date.now();
            this.dispatchEvent(this.ANIMATION_STARTED_EVENT);
        }
    }
    /**
     * Stop animating the scene.
     */
    endAnimation() {
        if (this.m_animationCount > 0) {
            --this.m_animationCount;
        }
        if (this.m_animationCount === 0) {
            this.ANIMATION_FINISHED_EVENT.time = Date.now();
            this.dispatchEvent(this.ANIMATION_FINISHED_EVENT);
        }
    }
    /**
     * Returns `true` if the camera moved in the last frame.
     */
    get cameraIsMoving() {
        return this.m_movementDetector.cameraIsMoving;
    }
    /**
     * Returns `true` if the current frame will immediately be followed by another frame.
     * @deprecated This should only be used for the internal handling of the render loop,
     * if you use your own RenderLoop use {@link MapView::renderSync} in combination with
     * {@link MapViewEventNames.FrameComplete}
     **/
    get isDynamicFrame() {
        return (!this.m_visibleTiles.allVisibleTilesLoaded ||
            this.m_themeManager.isUpdating() ||
            this.cameraIsMoving ||
            this.animating ||
            this.m_updatePending ||
            this.m_animatedExtrusionHandler.isAnimating ||
            this.m_textElementsRenderer.isUpdatePending ||
            this.m_textElementsRenderer.loading);
    }
    /**
     * Returns the ratio between a pixel and a world unit for the current camera (in the center of
     * the camera projection).
     */
    get pixelToWorld() {
        if (this.m_pixelToWorld === undefined) {
            // At this point fov calculation should be always defined.
            harp_utils_1.assert(this.m_options.fovCalculation !== undefined);
            // NOTE: Look at distance is the distance to camera focus (and pivot) point.
            // In screen space this point is located in the center of canvas.
            // Given that zoom level is not modified (clamped by camera pitch), the following
            // formulas are all equivalent:
            // lookAtDistance = (EQUATORIAL_CIRCUMFERENCE * focalLength) / (256 * zoomLevel^2);
            // lookAtDistance = abs(cameraPos.z) / cos(cameraPitch);
            // Here we may use precalculated target distance (once pre frame):
            const lookAtDistance = this.m_targetDistance;
            const focalLength = CameraUtils_1.CameraUtils.getFocalLength(this.m_camera);
            harp_utils_1.assert(focalLength !== undefined);
            // Find world space object size that corresponds to one pixel on screen.
            this.m_pixelToWorld = CameraUtils_1.CameraUtils.convertScreenToWorldSize(focalLength, lookAtDistance, 1);
        }
        return this.m_pixelToWorld;
    }
    /**
     * Returns the ratio between a world and a pixel unit for the current camera (in the center of
     * the camera projection).
     */
    get worldToPixel() {
        return 1.0 / this.pixelToWorld;
    }
    get pixelRatio() {
        if (this.m_pixelRatio !== undefined) {
            return this.m_pixelRatio;
        }
        return typeof window !== "undefined" && window.devicePixelRatio !== undefined
            ? window.devicePixelRatio
            : 1.0;
    }
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
    set pixelRatio(pixelRatio) {
        this.m_pixelRatio = pixelRatio;
        if (this.renderer.getPixelRatio() !== this.pixelRatio) {
            this.renderer.setPixelRatio(this.pixelRatio);
        }
    }
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
    set maxFps(value) {
        this.m_options.maxFps = value;
        this.m_taskScheduler.maxFps = value;
    }
    get maxFps() {
        //this cannot be undefined, as it is defaulting to 0 in the constructor
        return this.m_options.maxFps;
    }
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
    set dynamicPixelRatio(ratio) {
        this.mapRenderingManager.lowResPixelRatio = ratio;
    }
    get dynamicPixelRatio() {
        return this.mapRenderingManager.lowResPixelRatio;
    }
    /**
     * Returns the screen position of the given geo or world position.
     *
     * @param pos - The position as a {@link @here/harp-geoutils#GeoCoordLike} or
     * {@link https://threejs.org/docs/#api/en/math/Vector3 | THREE.Vector3} world position.
     * @returns The screen position in CSS/client coordinates (no pixel ratio applied) or
     * `undefined`.
     */
    getScreenPosition(pos) {
        if (harp_geoutils_1.isVector3Like(pos)) {
            cache.vector3[0].copy(pos);
        }
        else {
            this.projection.projectPoint(harp_geoutils_1.GeoCoordinates.fromObject(pos), cache.vector3[0]);
        }
        const p = this.m_screenProjector.project(cache.vector3[0]);
        if (p !== undefined) {
            const { width, height } = this.getCanvasClientSize();
            p.x = p.x + width / 2;
            p.y = height - (p.y + height / 2);
        }
        return p;
    }
    /**
     * Returns the world space position from the given screen position.
     *
     * @remarks
     * If `fallback !== true` the return value can be `null`, in case the camera has a high tilt
     * and the given `(x, y)` value is not intersecting the ground plane.
     * If `fallback === true` the return value will always exist but it might not be on the earth
     * surface.
     *
     * @param x - The X position in css/client coordinates (without applied display ratio).
     * @param y - The Y position in css/client coordinates (without applied display ratio).
     * @param fallback - Whether to compute a fallback position if the earth surface is not hit.
     */
    getWorldPositionAt(x, y, fallback) {
        this.m_raycaster.setFromCamera(this.getNormalizedScreenCoordinates(x, y), this.m_camera);
        const worldPos = this.projection.type === harp_geoutils_1.ProjectionType.Spherical
            ? this.m_raycaster.ray.intersectSphere(this.m_sphere, cache.vector3[0])
            : this.m_raycaster.ray.intersectPlane(this.m_plane, cache.vector3[0]);
        if (worldPos === null && fallback === true) {
            // Fall back to the far plane
            const cosAlpha = this.m_camera
                .getWorldDirection(cache.vector3[0])
                .dot(this.m_raycaster.ray.direction);
            return cache.vector3[0]
                .copy(this.m_raycaster.ray.direction)
                .multiplyScalar(this.m_camera.far / cosAlpha)
                .add(this.m_camera.position);
        }
        return worldPos;
    }
    getGeoCoordinatesAt(x, y, fallback) {
        const worldPosition = this.getWorldPositionAt(x, y, fallback);
        if (!worldPosition) {
            return null;
        }
        const geoPos = this.projection.unprojectPoint(worldPosition);
        if (!this.tileWrappingEnabled && this.projection.type === harp_geoutils_1.ProjectionType.Planar) {
            // When the map is not wrapped we clamp the longitude
            geoPos.longitude = THREE.MathUtils.clamp(geoPos.longitude, -180, 180);
        }
        return geoPos;
    }
    /**
     * Returns the normalized screen coordinates from the given pixel position.
     *
     * @param x - The X position in css/client coordinates (without applied display ratio).
     * @param y - The Y position in css/client coordinates (without applied display ratio).
     */
    getNormalizedScreenCoordinates(x, y) {
        // use clientWidth and clientHeight as it does not apply the pixelRatio and
        // therefore supports also HiDPI devices
        const { width, height } = this.getCanvasClientSize();
        return new THREE.Vector3((x / width) * 2 - 1, -((y / height) * 2) + 1, 0);
    }
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
    intersectMapObjects(x, y, parameters) {
        return this.m_pickHandler.intersectMapObjects(x, y, parameters);
    }
    /**
     * Resize the HTML canvas element and the THREE.js `WebGLRenderer`.
     *
     * @param width - The new width.
     * @param height - The new height.
     */
    resize(width, height) {
        this.m_renderer.setSize(width, height, false);
        if (this.m_renderer.getPixelRatio() !== this.pixelRatio) {
            this.m_renderer.setPixelRatio(this.pixelRatio);
        }
        if (this.mapRenderingManager !== undefined) {
            this.mapRenderingManager.setSize(width, height);
        }
        if (this.collisionDebugCanvas !== undefined) {
            this.collisionDebugCanvas.width = width;
            this.collisionDebugCanvas.height = height;
        }
        this.updateCameras();
        this.update();
        this.dispatchEvent({
            type: MapViewEventNames.Resize,
            size: {
                width,
                height
            }
        });
    }
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
    renderSync(frameStartTime) {
        if (frameStartTime === undefined) {
            frameStartTime = harp_utils_1.PerformanceTimer.now();
        }
        this.render(frameStartTime);
    }
    /**
     * Requests a redraw of the scene.
     */
    update() {
        if (this.disposed) {
            logger.warn("update(): MapView has been disposed of.");
            return;
        }
        this.dispatchEvent(this.UPDATE_EVENT);
        // Skip if update is already in progress
        if (this.m_updatePending) {
            return;
        }
        // Set update flag
        this.m_updatePending = true;
        this.startRenderLoop();
    }
    /**
     * Returns `true` if an update has already been requested, such that after a currently rendering
     * frame, the next frame will be rendered immediately.
     */
    get updatePending() {
        return this.m_updatePending;
    }
    /**
     * Requests a redraw of the scene.
     * @deprecated Use the [[update]] method instead.
     */
    requestUpdateIfNeeded() {
        this.update();
    }
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
    clearTileCache(dataSourceName, filter) {
        if (this.m_visibleTiles === undefined) {
            // This method is called in the shadowsEnabled function, which is initialized in the
            // setupRenderer function,
            return;
        }
        if (dataSourceName !== undefined) {
            const dataSource = this.getDataSourceByName(dataSourceName);
            if (dataSource) {
                this.m_visibleTiles.clearTileCache(dataSource, filter);
                dataSource.clearCache();
            }
        }
        else {
            this.m_visibleTiles.clearTileCache(undefined, filter);
            this.m_tileDataSources.forEach(dataSource => dataSource.clearCache());
        }
        if (this.m_elevationProvider !== undefined) {
            this.m_elevationProvider.clearCache();
        }
    }
    /**
     * Apply visitor to all visible tiles.
     *
     * @param fun - Visitor function
     */
    forEachVisibleTile(fun) {
        this.m_visibleTiles.forEachVisibleTile(fun);
    }
    /**
     * Apply a visitor function to all tiles in the cache.
     *
     * @param visitor - Visitor function
     */
    forEachCachedTile(visitor) {
        this.m_visibleTiles.forEachCachedTile(visitor);
    }
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
    markTilesDirty(dataSource, filter) {
        this.m_visibleTiles.markTilesDirty(dataSource, filter);
        this.update();
    }
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
    async setElevationSource(elevationSource, elevationRangeSource, elevationProvider) {
        // Remove previous elevation source if present
        if (this.m_elevationSource && this.m_elevationSource !== elevationSource) {
            this.removeDataSource(this.m_elevationSource);
        }
        // Add as datasource if it was not added before
        const isPresent = this.m_tileDataSources.includes(elevationSource);
        if (!isPresent) {
            await this.addDataSource(elevationSource);
        }
        this.m_elevationSource = elevationSource;
        this.m_elevationRangeSource = elevationRangeSource;
        if (!this.m_elevationRangeSource.ready()) {
            await this.m_elevationRangeSource.connect();
        }
        this.m_elevationProvider = elevationProvider;
        this.dataSources.forEach(dataSource => {
            dataSource.setEnableElevationOverlay(true);
        });
        this.m_tileGeometryManager.setTileUpdateCallback((tile) => {
            overlayOnElevation_1.overlayOnElevation(tile);
        });
        this.clearTileCache();
    }
    /**
     * Clears any elevation sources and provider previously set.
     * @param elevationSource - The datasource to be cleared.
     */
    clearElevationSource(elevationSource) {
        this.removeDataSource(elevationSource);
        this.m_elevationSource = undefined;
        this.m_elevationRangeSource = undefined;
        this.m_elevationProvider = undefined;
        this.dataSources.forEach(dataSource => {
            dataSource.setEnableElevationOverlay(false);
        });
        this.m_tileGeometryManager.setTileUpdateCallback(undefined);
        this.clearTileCache();
    }
    /**
     * Public access to {@link MapViewFog} allowing to toggle it by setting its `enabled` property.
     */
    get fog() {
        return this.m_sceneEnvironment.fog;
    }
    setPostEffects() {
        // First clear all the effects, then enable them from what is specified.
        this.mapRenderingManager.bloom.enabled = false;
        this.mapRenderingManager.outline.enabled = false;
        this.mapRenderingManager.vignette.enabled = false;
        this.mapRenderingManager.sepia.enabled = false;
        if (this.m_postEffects !== undefined) {
            if (this.m_postEffects.bloom !== undefined) {
                this.mapRenderingManager.bloom = this.m_postEffects.bloom;
            }
            if (this.m_postEffects.outline !== undefined) {
                this.mapRenderingManager.outline.enabled = this.m_postEffects.outline.enabled;
                this.mapRenderingManager.updateOutline(this.m_postEffects.outline);
            }
            if (this.m_postEffects.vignette !== undefined) {
                this.mapRenderingManager.vignette = this.m_postEffects.vignette;
            }
            if (this.m_postEffects.sepia !== undefined) {
                this.mapRenderingManager.sepia = this.m_postEffects.sepia;
            }
        }
    }
    /**
     * Returns the elevation provider.
     */
    get elevationProvider() {
        return this.m_elevationProvider;
    }
    /**
     * @beta
     */
    get throttlingEnabled() {
        return this.m_taskScheduler.throttlingEnabled === true;
    }
    /**
     * @beta
     */
    set throttlingEnabled(enabled) {
        this.m_taskScheduler.throttlingEnabled = enabled;
    }
    get shadowsEnabled() {
        return this.m_options.enableShadows === true;
    }
    set shadowsEnabled(enabled) {
        // shadowMap is undefined if we are testing (three.js always set it to be defined).
        if (this.m_renderer.shadowMap === undefined ||
            enabled === this.m_renderer.shadowMap.enabled) {
            return;
        }
        this.m_options.enableShadows = enabled;
        // There is a bug in three.js where this doesn't currently work once enabled.
        this.m_renderer.shadowMap.enabled = enabled;
        // TODO: Make this configurable. Note, there is currently issues when using the
        // VSMShadowMap type, this should be investigated if this type is requested.
        this.m_renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.clearTileCache();
    }
    extractAttitude() {
        const camera = this.m_camera;
        const projection = this.projection;
        const cameraPos = cache.vector3[1];
        const transform = cache.transform[0];
        const tangentSpaceMatrix = cache.matrix4[1];
        // 1. Build the matrix of the tangent space of the camera.
        cameraPos.setFromMatrixPosition(camera.matrixWorld); // Ensure using world position.
        projection.localTangentSpace(this.m_targetGeoPos, transform);
        tangentSpaceMatrix.makeBasis(transform.xAxis, transform.yAxis, transform.zAxis);
        // 2. Change the basis of matrixWorld to the tangent space to get the new base axes.
        cache.matrix4[0].copy(tangentSpaceMatrix).invert().multiply(camera.matrixWorld);
        transform.xAxis.setFromMatrixColumn(cache.matrix4[0], 0);
        transform.yAxis.setFromMatrixColumn(cache.matrix4[0], 1);
        transform.zAxis.setFromMatrixColumn(cache.matrix4[0], 2);
        // 3. Deduce orientation from the base axes.
        let yaw = 0;
        let pitch = 0;
        let roll = 0;
        // Decompose rotation matrix into Z0 X Z1 Euler angles.
        const epsilon = 1e-10;
        const d = transform.zAxis.dot(cameraPos.set(0, 0, 1));
        if (d < 1.0 - epsilon) {
            if (d > -1.0 + epsilon) {
                yaw = Math.atan2(transform.zAxis.x, -transform.zAxis.y);
                pitch = Math.acos(transform.zAxis.z);
                roll = Math.atan2(transform.xAxis.x, transform.yAxis.z);
            }
            else {
                // Looking bottom-up with space.z.z == -1.0
                yaw = -Math.atan2(-transform.yAxis.x, transform.xAxis.x);
                pitch = 180;
                roll = 0;
            }
        }
        else {
            // Looking top-down with space.z.z == 1.0
            yaw = Math.atan2(-transform.yAxis.x, transform.xAxis.x);
            pitch = 0.0;
            roll = 0.0;
        }
        return {
            yaw,
            pitch,
            roll
        };
    }
    lookAtImpl(params) {
        const tilt = Math.min(harp_utils_1.getOptionValue(params.tilt, this.tilt), Utils_1.MapViewUtils.MAX_TILT_DEG);
        const heading = harp_utils_1.getOptionValue(params.heading, this.heading);
        const distance = params.zoomLevel !== undefined
            ? Utils_1.MapViewUtils.calculateDistanceFromZoomLevel(this, THREE.MathUtils.clamp(params.zoomLevel, this.m_minZoomLevel, this.m_maxZoomLevel))
            : params.distance !== undefined
                ? params.distance
                : this.m_targetDistance;
        let target;
        if (params.bounds !== undefined) {
            let geoPoints;
            if (params.bounds instanceof harp_geoutils_1.GeoBox) {
                target = params.target
                    ? harp_geoutils_1.GeoCoordinates.fromObject(params.target)
                    : params.bounds.center;
                geoPoints = Utils_1.MapViewUtils.geoBoxToGeoPoints(params.bounds);
            }
            else if (params.bounds instanceof harp_geoutils_1.GeoPolygon) {
                target = params.bounds.getCentroid();
                geoPoints = params.bounds.coordinates;
            }
            else if (harp_geoutils_1.isGeoBoxExtentLike(params.bounds)) {
                target = params.target ? harp_geoutils_1.GeoCoordinates.fromObject(params.target) : this.target;
                const box = harp_geoutils_1.GeoBox.fromCenterAndExtents(target, params.bounds);
                geoPoints = Utils_1.MapViewUtils.geoBoxToGeoPoints(box);
            }
            else if (Array.isArray(params.bounds)) {
                geoPoints = params.bounds;
                if (params.target !== undefined) {
                    target = harp_geoutils_1.GeoCoordinates.fromObject(params.target);
                }
            }
            else {
                throw Error("#lookAt: Invalid 'bounds' value");
            }
            if (
            // if the points are created from the corners of the geoBox don't cluster them
            !(params.bounds instanceof harp_geoutils_1.GeoBox || params.bounds instanceof harp_geoutils_1.GeoPolygon) &&
                this.m_tileWrappingEnabled &&
                this.projection.type === harp_geoutils_1.ProjectionType.Planar) {
                // In flat projection, with wrap around enabled, we should detect clusters of
                // points around  anti-meridian and possible move some points to sibling worlds.
                //
                // Here, we fit points into minimal geo box taking world wrapping into account.
                geoPoints = Utils_1.MapViewUtils.wrapGeoPointsToScreen(geoPoints, target);
            }
            const worldPoints = geoPoints.map(point => this.projection.projectPoint(harp_geoutils_1.GeoCoordinates.fromObject(point), new THREE.Vector3()));
            const worldTarget = new THREE.Vector3();
            if (target === undefined) {
                const box = new THREE.Box3().setFromPoints(worldPoints);
                box.getCenter(worldTarget);
                this.projection.scalePointToSurface(worldTarget);
                target = this.projection.unprojectPoint(worldTarget);
            }
            else {
                this.projection.projectPoint(target, worldTarget);
            }
            if (params.zoomLevel !== undefined || params.distance !== undefined) {
                return this.lookAtImpl({
                    tilt,
                    heading,
                    distance,
                    target
                });
            }
            return this.lookAtImpl(Utils_1.MapViewUtils.getFitBoundsLookAtParams(target, worldTarget, worldPoints, {
                tilt,
                heading,
                minDistance: Utils_1.MapViewUtils.calculateDistanceFromZoomLevel(this, this.maxZoomLevel),
                projection: this.projection,
                camera: this.camera
            }));
        }
        target =
            params.target !== undefined ? harp_geoutils_1.GeoCoordinates.fromObject(params.target) : this.target;
        // MapViewUtils#setRotation uses pitch, not tilt, which is different in sphere projection.
        // But in sphere, in the tangent space of the target of the camera, pitch = tilt. So, put
        // the camera on the target, so the tilt can be passed to getRotation as a pitch.
        Utils_1.MapViewUtils.getCameraRotationAtTarget(this.projection, target, -heading, tilt, this.camera.quaternion);
        Utils_1.MapViewUtils.getCameraPositionFromTargetCoordinates(target, distance, -heading, tilt, this.projection, this.camera.position);
        this.camera.updateMatrixWorld(true);
        // Make sure to update all properties that are accessible via API (e.g. zoomlevel) b/c
        // otherwise they would be updated as recently as in the next animation frame.
        this.updateLookAtSettings();
        this.update();
    }
    /**
     * Plug-in PolarTileDataSource for spherical projection and plug-out otherwise
     */
    updatePolarDataSource() {
        const dataSource = this.m_polarDataSource;
        if (this.m_enablePolarDataSource === true && dataSource !== undefined) {
            const twinDataSource = this.getDataSourceByName(dataSource.name);
            if (this.projection.type === harp_geoutils_1.ProjectionType.Spherical) {
                if (twinDataSource === undefined) {
                    this.addDataSource(dataSource);
                }
            }
            else {
                if (twinDataSource !== undefined) {
                    this.removeDataSource(dataSource);
                }
            }
        }
    }
    /**
     * Updates the camera and the projections and resets the screen collisions,
     * note, setupCamera must be called before this is called.
     *
     * @remarks
     * @param viewRanges - optional parameter that supplies new view ranges, most importantly
     * near/far clipping planes distance. If parameter is not provided view ranges will be
     * calculated from [[ClipPlaneEvaluator]] used in {@link VisibleTileSet}.
     */
    updateCameras(viewRanges) {
        var _a;
        // Update look at settings first, so that other components (e.g. ClipPlanesEvaluator) get
        // the up to date tilt, targetDistance, ...
        this.m_camera.updateMatrixWorld(false);
        this.updateLookAtSettings();
        const { width, height } = this.m_renderer.getSize(cache.vector2[0]);
        this.m_camera.aspect =
            this.m_forceCameraAspect !== undefined ? this.m_forceCameraAspect : width / height;
        this.setFovOnCamera(this.m_options.fovCalculation, height);
        // When calculating clip planes account for the highest building on the earth,
        // multiplying its height by projection scaling factor. This approach assumes
        // constantHeight property of extruded polygon technique is set as default false,
        // otherwise the near plane margins will be bigger then required, but still correct.
        const projectionScale = this.projection.getScaleFactor(this.camera.position);
        const maxGeometryHeightScaled = projectionScale *
            this.m_tileDataSources.reduce((r, ds) => Math.max(r, ds.maxGeometryHeight), 0);
        const minGeometryHeightScaled = projectionScale *
            this.m_tileDataSources.reduce((r, ds) => Math.min(r, ds.minGeometryHeight), 0);
        // Copy all properties from new view ranges to our readonly object.
        // This allows to keep all view ranges references valid and keeps up-to-date
        // information within them. Works the same as copping all properties one-by-one.
        Object.assign(this.m_viewRanges, viewRanges === undefined
            ? this.m_visibleTiles.updateClipPlanes(maxGeometryHeightScaled, minGeometryHeightScaled)
            : viewRanges);
        this.m_camera.near = this.m_viewRanges.near;
        this.m_camera.far = this.m_viewRanges.far;
        this.m_camera.updateProjectionMatrix();
        // Update the "relative to eye" camera. Copy the public camera parameters
        // and place the "relative to eye" at the world's origin.
        this.m_rteCamera.copy(this.m_camera);
        this.m_rteCamera.position.setScalar(0);
        this.m_rteCamera.updateMatrixWorld(true);
        (_a = this.m_textElementsRenderer) === null || _a === void 0 ? void 0 : _a.updateCamera();
        this.m_screenProjector.update(this.camera, width, height);
        this.m_pixelToWorld = undefined;
        this.m_sceneEnvironment.update();
    }
    /**
     * Derive the look at settings (i.e. target, zoom, ...) from the current camera.
     */
    updateLookAtSettings() {
        let { target, distance, final } = Utils_1.MapViewUtils.getTargetAndDistance(this.projection, this.camera, this.elevationProvider);
        if (!final) {
            this.update();
        }
        if (this.geoMaxBounds) {
            ({ target, distance } = Utils_1.MapViewUtils.constrainTargetAndDistanceToViewBounds(target, distance, this));
        }
        this.m_targetWorldPos.copy(target);
        this.m_targetGeoPos = this.projection.unprojectPoint(this.m_targetWorldPos);
        this.m_targetDistance = distance;
        this.m_zoomLevel = Utils_1.MapViewUtils.calculateZoomLevelFromDistance(this, this.m_targetDistance);
        const { yaw, pitch, roll } = this.extractAttitude();
        this.m_yaw = yaw;
        this.m_pitch = pitch;
        this.m_roll = roll;
    }
    /**
     * Update `Env` instance used for style `Expr` evaluations.
     */
    updateEnv() {
        this.m_env.entries.$zoom = this.m_zoomLevel;
        // This one introduces unnecessary calculation of pixelToWorld, even if it's barely
        // used in our styles.
        this.m_env.entries.$pixelToMeters = this.pixelToWorld;
        this.m_env.entries.$frameNumber = this.m_frameNumber;
    }
    /**
     * Transfer the NDC point to view space.
     * @param vector - Vector to transform.
     * @param result - Result to place calculation.
     */
    ndcToView(vector, result) {
        result
            .set(vector.x, vector.y, vector.z)
            .applyMatrix4(this.camera.projectionMatrixInverse)
            // Make sure to apply rotation, hence use the rte camera
            .applyMatrix4(this.m_rteCamera.matrixWorld);
        return result;
    }
    /**
     * Render loop callback that should only be called by [[requestAnimationFrame]].
     * Will trigger [[requestAnimationFrame]] again if updates are pending or  animation is running.
     * @param frameStartTime - The start time of the current frame
     */
    renderLoop(frameStartTime) {
        // Render loop shouldn't run when synchronous rendering is enabled or if `MapView` has been
        // disposed of.
        if (this.m_options.synchronousRendering === true || this.disposed) {
            return;
        }
        if (this.maxFps === 0) {
            // Render with max fps
            this.render(frameStartTime);
        }
        else {
            // Limit fps by skipping frames
            // Magic ingredient to compensate time flux.
            const fudgeTimeInMs = 3;
            const frameInterval = 1000 / this.maxFps;
            const previousFrameTime = this.m_previousFrameTimeStamp === undefined ? 0 : this.m_previousFrameTimeStamp;
            const targetTime = previousFrameTime + frameInterval - fudgeTimeInMs;
            if (frameStartTime >= targetTime) {
                this.render(frameStartTime);
            }
        }
        // Continue rendering if update is pending or animation is running
        if (this.isDynamicFrame) {
            this.m_animationFrameHandle = requestAnimationFrame(this.handleRequestAnimationFrame);
        }
        else {
            // Stop rendering if no update is pending
            this.m_animationFrameHandle = undefined;
        }
    }
    /**
     * Start render loop if not already running.
     */
    startRenderLoop() {
        if (this.m_animationFrameHandle !== undefined || this.m_options.synchronousRendering) {
            return;
        }
        this.m_animationFrameHandle = requestAnimationFrame(this.handleRequestAnimationFrame);
    }
    /**
     * Returns the list of the enabled data sources.
     */
    getEnabledTileDataSources() {
        // ### build this list once decoders && datasources are ready
        const enabledDataSources = [];
        for (const dataSource of this.m_tileDataSources) {
            if (this.isDataSourceEnabled(dataSource)) {
                enabledDataSources.push(dataSource);
            }
        }
        return enabledDataSources;
    }
    /**
     * Renders the current frame.
     */
    render(frameStartTime) {
        if (this.m_drawing) {
            return;
        }
        if (this.disposed) {
            logger.warn("render(): MapView has been disposed of.");
            return;
        }
        this.RENDER_EVENT.time = frameStartTime;
        this.dispatchEvent(this.RENDER_EVENT);
        this.m_tileObjectRenderer.prepareRender();
        ++this.m_frameNumber;
        let currentFrameEvent;
        const stats = Statistics_1.PerformanceStatistics.instance;
        const gatherStatistics = stats.enabled;
        if (gatherStatistics) {
            currentFrameEvent = stats.currentFrame;
            if (this.m_previousFrameTimeStamp !== undefined) {
                // In contrast to fullFrameTime we also measure the application code
                // for the FPS. This means FPS != 1000 / fullFrameTime.
                const timeSincePreviousFrame = frameStartTime - this.m_previousFrameTimeStamp;
                currentFrameEvent.setValue("render.fps", 1000 / timeSincePreviousFrame);
            }
            // We store the last frame statistics at the beginning of the next frame b/c additional
            // work (i.e. geometry creation) is done outside of the animation frame but still needs
            // to be added to the `fullFrameTime` (see [[TileGeometryLoader]]).
            stats.storeAndClearFrameInfo();
            currentFrameEvent = currentFrameEvent;
            currentFrameEvent.setValue("renderCount.frameNumber", this.m_frameNumber);
        }
        this.m_previousFrameTimeStamp = frameStartTime;
        let setupTime;
        let cullTime;
        let textPlacementTime;
        let drawTime;
        let textDrawTime;
        let endTime;
        this.m_renderer.info.reset();
        this.m_updatePending = false;
        this.m_thisFrameTilesChanged = undefined;
        this.m_drawing = true;
        if (this.m_renderer.getPixelRatio() !== this.pixelRatio) {
            this.m_renderer.setPixelRatio(this.pixelRatio);
        }
        this.updateCameras();
        this.updateEnv();
        this.m_renderer.clear();
        // clear the scenes
        this.m_sceneRoot.children.length = 0;
        this.m_overlaySceneRoot.children.length = 0;
        if (gatherStatistics) {
            setupTime = harp_utils_1.PerformanceTimer.now();
        }
        // TBD: Update renderList only any of its params (camera, etc...) has changed.
        if (!this.lockVisibleTileSet) {
            const viewRangesStatus = this.m_visibleTiles.updateRenderList(this.storageLevel, Math.floor(this.zoomLevel), this.getEnabledTileDataSources(), this.m_frameNumber, this.m_elevationRangeSource);
            // View ranges has changed due to features (with elevation) that affects clip planes
            // positioning, update cameras with new clip planes positions.
            if (viewRangesStatus.viewRangesChanged) {
                this.updateCameras(viewRangesStatus.viewRanges);
            }
        }
        if (gatherStatistics) {
            cullTime = harp_utils_1.PerformanceTimer.now();
        }
        const renderList = this.m_visibleTiles.dataSourceTileList;
        // no need to check everything if we're not going to create text renderer.
        renderList.forEach(({ zoomLevel, renderedTiles }) => {
            renderedTiles.forEach(tile => {
                this.m_tileObjectRenderer.render(tile, zoomLevel, this.zoomLevel, this.m_camera.position, this.m_sceneRoot);
                //We know that rendered tiles are visible (in the view frustum), so we update the
                //frame number, note we don't do this for the visibleTiles because some may still be
                //loading (and therefore aren't visible in the sense of being seen on the screen).
                //Note also, this number isn't currently used anywhere so should be considered to be
                //removed in the future (though could be good for debugging purposes).
                tile.frameNumLastVisible = this.m_frameNumber;
            });
        });
        this.m_mapAnchors.update(this.projection, this.camera.position, this.m_sceneRoot, this.m_overlaySceneRoot);
        this.m_animatedExtrusionHandler.update(this.zoomLevel);
        if (currentFrameEvent !== undefined) {
            // Make sure the counters all have a value.
            currentFrameEvent.addValue("renderCount.numTilesRendered", 0);
            currentFrameEvent.addValue("renderCount.numTilesVisible", 0);
            currentFrameEvent.addValue("renderCount.numTilesLoading", 0);
            // Increment the counters for all data sources.
            renderList.forEach(({ zoomLevel, renderedTiles, visibleTiles, numTilesLoading }) => {
                currentFrameEvent.addValue("renderCount.numTilesRendered", renderedTiles.size);
                currentFrameEvent.addValue("renderCount.numTilesVisible", visibleTiles.length);
                currentFrameEvent.addValue("renderCount.numTilesLoading", numTilesLoading);
            });
        }
        if (this.m_movementDetector.checkCameraMoved(this, frameStartTime)) {
            //FIXME: Shouldn't we use target here?
            const { latitude, longitude, altitude } = this.geoCenter;
            this.dispatchEvent({
                type: MapViewEventNames.CameraPositionChanged,
                latitude,
                longitude,
                altitude,
                // FIXME: Can we remove yaw, pitch and roll
                yaw: this.m_yaw,
                pitch: this.m_pitch,
                roll: this.m_roll,
                tilt: this.tilt,
                heading: this.heading,
                zoom: this.zoomLevel
            });
        }
        // The camera used to render the scene.
        const camera = this.m_pointOfView !== undefined ? this.m_pointOfView : this.m_rteCamera;
        if (this.renderLabels && !this.m_pointOfView) {
            this.m_textElementsRenderer.placeText(renderList, frameStartTime);
        }
        if (gatherStatistics) {
            textPlacementTime = harp_utils_1.PerformanceTimer.now();
        }
        this.mapRenderingManager.render(this.m_renderer, this.m_scene, camera, !this.isDynamicFrame);
        if (gatherStatistics) {
            drawTime = harp_utils_1.PerformanceTimer.now();
        }
        if (this.renderLabels && !this.m_pointOfView) {
            this.m_textElementsRenderer.renderText(this.m_viewRanges.maximum);
        }
        if (this.m_overlaySceneRoot.children.length > 0) {
            this.m_renderer.render(this.m_overlayScene, camera);
        }
        if (gatherStatistics) {
            textDrawTime = harp_utils_1.PerformanceTimer.now();
        }
        if (!this.m_firstFrameRendered) {
            this.m_firstFrameRendered = true;
            if (gatherStatistics) {
                stats.appResults.set("firstFrame", frameStartTime);
            }
            this.FIRST_FRAME_EVENT.time = frameStartTime;
            this.dispatchEvent(this.FIRST_FRAME_EVENT);
        }
        this.m_visibleTiles.disposePendingTiles();
        this.m_drawing = false;
        this.checkCopyrightUpdates();
        // do this post paint therefore use a Timeout, if it has not been executed cancel and
        // create a new one
        if (this.m_taskSchedulerTimeout !== undefined) {
            clearTimeout(this.m_taskSchedulerTimeout);
        }
        this.m_taskSchedulerTimeout = setTimeout(() => {
            this.m_taskSchedulerTimeout = undefined;
            this.m_taskScheduler.processPending(frameStartTime);
        }, 0);
        if (currentFrameEvent !== undefined) {
            endTime = harp_utils_1.PerformanceTimer.now();
            const frameRenderTime = endTime - frameStartTime;
            currentFrameEvent.setValue("render.setupTime", setupTime - frameStartTime);
            currentFrameEvent.setValue("render.cullTime", cullTime - setupTime);
            currentFrameEvent.setValue("render.textPlacementTime", textPlacementTime - cullTime);
            currentFrameEvent.setValue("render.drawTime", drawTime - textPlacementTime);
            currentFrameEvent.setValue("render.textDrawTime", textDrawTime - drawTime);
            currentFrameEvent.setValue("render.cleanupTime", endTime - textDrawTime);
            currentFrameEvent.setValue("render.frameRenderTime", frameRenderTime);
            // Initialize the fullFrameTime with the frameRenderTime If we also create geometry in
            // this frame, this number will be increased in the TileGeometryLoader.
            currentFrameEvent.setValue("render.fullFrameTime", frameRenderTime);
            currentFrameEvent.setValue("render.geometryCreationTime", 0);
            // Add THREE.js statistics
            stats.addWebGLInfo(this.m_renderer.info);
            // Add memory statistics
            // FIXME:
            // This will only measure the memory of the rendering and not of the geometry creation.
            // Assuming the garbage collector is not kicking in immediately we will at least see
            // the geometry creation memory consumption accounted in the next frame.
            stats.addMemoryInfo();
        }
        this.DID_RENDER_EVENT.time = frameStartTime;
        this.dispatchEvent(this.DID_RENDER_EVENT);
        // After completely rendering this frame, it is checked if this frame was the first complete
        // frame, with no more tiles, geometry and labels waiting to be added, and no animation
        // running. The initial placement of text in this render call may have changed the loading
        // state of the TextElementsRenderer, so this has to be checked again.
        // HARP-10919: Fading is currently ignored by the frame complete event.
        if (!this.isDynamicFrame) {
            if (this.m_firstFrameComplete === false) {
                this.m_firstFrameComplete = true;
                if (gatherStatistics) {
                    stats.appResults.set("firstFrameComplete", frameStartTime);
                }
            }
            this.FRAME_COMPLETE_EVENT.time = frameStartTime;
            this.dispatchEvent(this.FRAME_COMPLETE_EVENT);
        }
    }
    setupCamera() {
        harp_utils_1.assert(this.m_visibleTiles !== undefined);
        this.m_options.target = harp_geoutils_1.GeoCoordinates.fromObject(harp_utils_1.getOptionValue(this.m_options.target, MapViewDefaults.target));
        // ensure that look at target has height of 0
        this.m_options.target.altitude = 0;
        this.m_options.tilt = harp_utils_1.getOptionValue(this.m_options.tilt, MapViewDefaults.tilt);
        this.m_options.heading = harp_utils_1.getOptionValue(this.m_options.heading, MapViewDefaults.heading);
        this.m_options.zoomLevel = harp_utils_1.getOptionValue(this.m_options.zoomLevel, MapViewDefaults.zoomLevel);
        this.lookAtImpl(this.m_options);
        // ### move & customize
        const { width, height } = this.getCanvasClientSize();
        this.resize(width, height);
    }
    createVisibleTileSet() {
        harp_utils_1.assert(this.m_tileGeometryManager !== undefined);
        if (this.m_visibleTiles) {
            // Dispose of all resources before the old instance is replaced.
            this.m_visibleTiles.clearTileCache();
            this.m_visibleTiles.disposePendingTiles();
        }
        const enableMixedLod = this.m_enableMixedLod === undefined
            ? this.projection.type === harp_geoutils_1.ProjectionType.Spherical
            : this.m_enableMixedLod;
        this.m_visibleTiles = new VisibleTileSet_1.VisibleTileSet(new FrustumIntersection_1.FrustumIntersection(this.m_camera, this, this.m_visibleTileSetOptions.extendedFrustumCulling, this.m_tileWrappingEnabled, enableMixedLod, this.m_lodMinTilePixelSize), this.m_tileGeometryManager, this.m_visibleTileSetOptions, this.taskQueue);
        return this.m_visibleTiles;
    }
    movementStarted() {
        this.m_textElementsRenderer.movementStarted();
        this.MOVEMENT_STARTED_EVENT.time = Date.now();
        this.dispatchEvent(this.MOVEMENT_STARTED_EVENT);
    }
    movementFinished() {
        this.m_textElementsRenderer.movementFinished();
        this.MOVEMENT_FINISHED_EVENT.time = Date.now();
        this.dispatchEvent(this.MOVEMENT_FINISHED_EVENT);
        // render at the next possible time.
        if (!this.animating) {
            if (this.m_movementFinishedUpdateTimerId !== undefined) {
                clearTimeout(this.m_movementFinishedUpdateTimerId);
            }
            this.m_movementFinishedUpdateTimerId = setTimeout(() => {
                this.m_movementFinishedUpdateTimerId = undefined;
                this.update();
            }, 0);
        }
    }
    /**
     * Check if the set of visible tiles changed since the last frame.
     *
     * May be called multiple times per frame.
     *
     * Equality is computed by creating a string containing the IDs of the tiles.
     */
    checkIfTilesChanged() {
        if (this.m_thisFrameTilesChanged !== undefined) {
            return this.m_thisFrameTilesChanged;
        }
        const renderList = this.m_visibleTiles.dataSourceTileList;
        const tileIdList = [];
        tileIdList.length = 0;
        renderList.forEach(({ dataSource, renderedTiles }) => {
            renderedTiles.forEach(tile => {
                tileIdList.push(dataSource.name + "-" + tile.tileKey.mortonCode());
            });
        });
        tileIdList.sort();
        const newTileIds = tileIdList.join("#");
        if (newTileIds !== this.m_lastTileIds) {
            this.m_lastTileIds = newTileIds;
            this.m_thisFrameTilesChanged = true;
        }
        else {
            this.m_thisFrameTilesChanged = false;
        }
        return this.m_thisFrameTilesChanged;
    }
    checkCopyrightUpdates() {
        if (!this.checkIfTilesChanged()) {
            return;
        }
        const newCopyrightInfo = this.getRenderedTilesCopyrightInfo();
        if (newCopyrightInfo === this.m_copyrightInfo) {
            return;
        }
        if (newCopyrightInfo.length === this.m_copyrightInfo.length) {
            let allEqual = true;
            for (let i = 0; i < newCopyrightInfo.length; i++) {
                const a = newCopyrightInfo[i];
                const b = this.m_copyrightInfo[i];
                if (a.label !== b.label) {
                    allEqual = false;
                    break;
                }
            }
            if (allEqual) {
                return;
            }
        }
        this.m_copyrightInfo = newCopyrightInfo;
        this.dispatchEvent(this.COPYRIGHT_CHANGED_EVENT);
    }
    getRenderedTilesCopyrightInfo() {
        let result = [];
        for (const tileList of this.m_visibleTiles.dataSourceTileList) {
            for (const tile of tileList.renderedTiles.values()) {
                const tileCopyrightInfo = tile.copyrightInfo;
                if (tileCopyrightInfo === undefined || tileCopyrightInfo.length === 0) {
                    continue;
                }
                result = CopyrightInfo_1.CopyrightInfo.mergeArrays(result, tileCopyrightInfo);
            }
        }
        return result;
    }
    setupStats(enable) {
        new Statistics_1.PerformanceStatistics(enable, 1000);
    }
    setupRenderer(tileObjectRenderer) {
        var _a;
        this.m_scene.add(this.m_sceneRoot);
        this.m_overlayScene.add(this.m_overlaySceneRoot);
        this.shadowsEnabled = (_a = this.m_options.enableShadows) !== null && _a !== void 0 ? _a : false;
        tileObjectRenderer.setupRenderer();
    }
    createTextRenderer() {
        return new TextElementsRenderer_1.TextElementsRenderer(new MapViewState_1.MapViewState(this, this.checkIfTilesChanged.bind(this)), this.m_screenProjector, this.m_poiManager, this.m_renderer, [this.imageCache, this.userImageCache], this.m_options);
    }
    /**
     * @internal
     * @param fontCatalogs
     * @param textStyles
     * @param defaultTextStyle
     */
    async resetTextRenderer(fontCatalogs, textStyles, defaultTextStyle) {
        await this.m_textElementsRenderer.updateFontCatalogs(fontCatalogs);
        await this.m_textElementsRenderer.updateTextStyles(textStyles, defaultTextStyle);
        this.update();
    }
    /**
     * Sets the field of view calculation, and applies it immediately to the camera.
     *
     * @param fovCalculation - How to calculate the FOV
     * @param height - Viewport height.
     */
    setFovOnCamera(fovCalculation, height) {
        const fovRad = THREE.MathUtils.degToRad(fovCalculation.fov);
        if (fovCalculation.type === "fixed") {
            CameraUtils_1.CameraUtils.setVerticalFov(this.m_camera, fovRad, height);
            return;
        }
        let focalLength = CameraUtils_1.CameraUtils.getFocalLength(this.m_camera);
        if (focalLength === undefined) {
            CameraUtils_1.CameraUtils.setVerticalFov(this.m_camera, fovRad, height);
            focalLength = CameraUtils_1.CameraUtils.getFocalLength(this.m_camera);
        }
        CameraUtils_1.CameraUtils.setFocalLength(this.m_camera, focalLength, height);
    }
    /**
     * Get canvas client size in css/client pixels.
     *
     * Supports canvases not attached to DOM, which have 0 as `clientWidth` and `clientHeight` by
     * calculating it from actual canvas size and current pixel ratio.
     */
    getCanvasClientSize() {
        const { clientWidth, clientHeight } = this.canvas;
        if (clientWidth === 0 ||
            clientHeight === 0 ||
            typeof clientWidth !== "number" ||
            typeof clientHeight !== "number") {
            const pixelRatio = this.m_renderer.getPixelRatio();
            return {
                width: Math.round(this.canvas.width / pixelRatio),
                height: Math.round(this.canvas.height / pixelRatio)
            };
        }
        else {
            return { width: clientWidth, height: clientHeight };
        }
    }
}
exports.MapView = MapView;

export default exports
//# sourceMappingURL=MapView.js.map