"use strict";
let exports = {}
exports.TextElementsRenderer = exports.DEFAULT_TEXT_DISTANCE_SCALE = exports.DEFAULT_FONT_CATALOG_NAME = void 0;
import * as harp_text_canvas_1 from "@here/harp-text-canvas"
import * as harp_utils_1 from "@here/harp-utils"
import * as THREE from "three"
import DebugContext_1 from "../DebugContext"
import overlayOnElevation_1 from "../geometry/overlayOnElevation"
import PickHandler_1 from "../PickHandler"
import PoiRenderer_1 from "../poi/PoiRenderer"
import ScreenCollisions_1 from "../ScreenCollisions"
import FontCatalogLoader_1 from "./FontCatalogLoader"
import Placement_1 from "./Placement"
import PlacementStats_1 from "./PlacementStats"
import SimplePath_1 from "./SimplePath"
import TextCanvasFactory_1 from "./TextCanvasFactory"
import TextElement_1 from "./TextElement"
import TextElementsRendererOptions_1 from "./TextElementsRendererOptions"
import TextElementStateCache_1 from "./TextElementStateCache"
import TextElementType_1 from "./TextElementType"
import TextStyleCache_1 from "./TextStyleCache"
import UpdateStats_1 from "./UpdateStats"
var Pass;
(function (Pass) {
    Pass[Pass["PersistentLabels"] = 0] = "PersistentLabels";
    Pass[Pass["NewLabels"] = 1] = "NewLabels";
})(Pass || (Pass = {}));
exports.DEFAULT_FONT_CATALOG_NAME = "default";
/**
 * Default distance scale. Will be applied if distanceScale is not defined in the technique.
 * Defines the scale that will be applied to labeled icons (icon and text) in the distance.
 * @internal
 */
exports.DEFAULT_TEXT_DISTANCE_SCALE = 0.5;
/**
 * Maximum number of recommended labels. If more labels are encountered, the "overloaded" mode is
 * set, which modifies the behavior of label placement and rendering, trying to keep delivering an
 * interactive performance. The overloaded mode should not be activated if the {@link MapView} is
 * rendering a static image (camera not moving and no animation running).
 */
const OVERLOAD_LABEL_LIMIT = 20000;
/**
 * If "overloaded" is `true`:
 *
 * Default number of labels/POIs updated in a frame. They are rendered only if they fit. If the
 * camera is not moving, it is ignored. See [[TextElementsRenderer.isUpdatePending]].
 */
const OVERLOAD_UPDATED_LABEL_LIMIT = 100;
/**
 * If "overloaded" is `true`:
 *
 * Maximum time in milliseconds available for placement. If value is <= 0, or if the camera is not
 * moving, it is ignored. See [[TextElementsRenderer.isUpdatePending]].
 */
const OVERLOAD_UPDATE_TIME_LIMIT = 5;
/**
 * If "overloaded" is `true`:
 *
 * Maximum time in milliseconds available for rendering. If value is <= 0, or if the camera is not
 * moving, it is ignored. See [[TextElementsRenderer.isUpdatePending]].
 */
const OVERLOAD_PLACE_TIME_LIMIT = 10;
const logger = harp_utils_1.LoggerManager.instance.create("TextElementsRenderer", { level: harp_utils_1.LogLevel.Log });
// Development flag: Enable debug print.
const PRINT_LABEL_DEBUG_INFO = false;
const updateStats = PRINT_LABEL_DEBUG_INFO ? new UpdateStats_1.UpdateStats(logger) : undefined;
const placementStats = PRINT_LABEL_DEBUG_INFO ? new PlacementStats_1.PlacementStats(logger) : undefined;
const tempPosition = new THREE.Vector3();
const tempScreenPosition = new THREE.Vector2();
const tempScreenPoints = [];
const tempPoiScreenPosition = new THREE.Vector2();
const tmpTextBufferCreationParams = {};
const tmpAdditionParams = {};
const tmpBufferAdditionParams = {};
const cache = {
    vector2: [new THREE.Vector2()]
};
class TileTextElements {
    constructor(tile, group) {
        this.tile = tile;
        this.group = group;
    }
}
class TextElementLists {
    constructor(lists) {
        this.lists = lists;
    }
    get priority() {
        harp_utils_1.assert(this.lists.length > 0);
        // All text element lists here have the same priority.
        return this.lists[0].group.priority;
    }
    /**
     * Sum up the number of elements in all lists.
     */
    count() {
        let n = 0;
        for (const list of this.lists) {
            n += list.group.elements.length;
        }
        return n;
    }
}
function checkIfTextElementsChanged(dataSourceTileList) {
    let textElementsChanged = false;
    dataSourceTileList.forEach(({ renderedTiles }) => {
        renderedTiles.forEach(tile => {
            if (tile.textElementsChanged) {
                tile.textElementsChanged = false;
                textElementsChanged = true;
            }
        });
    });
    return textElementsChanged;
}
function hasTextElements(dataSourceTileList) {
    for (let i = 0; i < dataSourceTileList.length; i++) {
        for (const [_key, value] of dataSourceTileList[i].renderedTiles) {
            if (value.hasTextElements()) {
                return true;
            }
        }
    }
    return false;
}
function addTextToCanvas(textElement, canvas, screenPosition, path, pathOverflow) {
    tmpAdditionParams.path = path;
    tmpAdditionParams.pathOverflow = pathOverflow;
    tmpAdditionParams.layer = textElement.renderOrder;
    tmpAdditionParams.letterCaseArray = textElement.glyphCaseArray;
    tmpAdditionParams.pickingData = textElement.userData ? textElement : undefined;
    canvas.addText(textElement.glyphs, screenPosition, tmpAdditionParams);
}
function addTextBufferToCanvas(textElementState, canvas, screenPosition, fadeFactor, scaleFactor) {
    const textElement = textElementState.element;
    const textRenderState = textElementState.textRenderState;
    const opacity = textRenderState.opacity * fadeFactor * textElement.renderStyle.opacity;
    if (opacity === 0) {
        return false;
    }
    // Compute the TextBufferObject when we know we're gonna render this label.
    tmpTextBufferCreationParams.letterCaseArray = textElement.glyphCaseArray;
    if (textElement.textBufferObject === undefined) {
        textElement.textBufferObject = canvas.createTextBufferObject(textElement.glyphs, tmpTextBufferCreationParams);
    }
    const backgroundIsVisible = textElement.renderStyle.backgroundOpacity > 0 &&
        canvas.textRenderStyle.fontSize.backgroundSize > 0;
    tmpBufferAdditionParams.layer = textElement.renderOrder;
    tmpBufferAdditionParams.position = screenPosition;
    tmpBufferAdditionParams.scale = scaleFactor;
    tmpBufferAdditionParams.opacity = opacity;
    tmpBufferAdditionParams.backgroundOpacity = backgroundIsVisible
        ? tmpBufferAdditionParams.opacity * textElement.renderStyle.backgroundOpacity
        : 0.0;
    tmpBufferAdditionParams.pickingData = textElement.userData ? textElement : undefined;
    canvas.addTextBufferObject(textElement.textBufferObject, tmpBufferAdditionParams);
    return true;
}
function shouldRenderPointText(labelState, viewState, options) {
    const textRenderState = labelState.textRenderState;
    const label = labelState.element;
    const poiInfo = label.poiInfo;
    harp_utils_1.assert(label.type !== TextElementType_1.TextElementType.PathLabel);
    const hasText = textRenderState !== undefined && label.text !== "";
    if (!hasText) {
        return false;
    }
    const visibleInZoomLevel = poiInfo === undefined ||
        harp_utils_1.MathUtils.isClamped(viewState.zoomLevel, poiInfo.textMinZoomLevel, poiInfo.textMaxZoomLevel);
    if (!visibleInZoomLevel) {
        return false;
    }
    const poiTextMaxDistance = Placement_1.getMaxViewDistance(viewState, options.maxDistanceRatioForPoiLabels);
    const visibleAtDistance = label.ignoreDistance === true ||
        labelState.viewDistance === undefined ||
        (labelState.viewDistance < poiTextMaxDistance && labelState.viewDistance > 0);
    if (!visibleAtDistance) {
        return false;
    }
    // If there's an icon, render text only if icon is valid or optional.
    return !poiInfo || poiInfo.isValid === true || poiInfo.iconIsOptional === true;
}
function shouldRenderPoiText(labelState, viewState) {
    // Do not actually render (just allocate space) if camera is moving and
    // renderTextDuringMovements is not true.
    const poiInfo = labelState.element.poiInfo;
    return (!viewState.cameraIsMoving ||
        poiInfo === undefined ||
        poiInfo.renderTextDuringMovements === true);
}
function isPlacementTimeExceeded(startTime) {
    // startTime is set in overload mode.
    if (startTime === undefined || OVERLOAD_PLACE_TIME_LIMIT <= 0) {
        return false;
    }
    const endTime = harp_utils_1.PerformanceTimer.now();
    const elapsedTime = endTime - startTime;
    if (elapsedTime > OVERLOAD_PLACE_TIME_LIMIT) {
        logger.debug("Placement time limit exceeded.");
        return true;
    }
    return false;
}
function createDefaultFontCatalogConfig(defaultFontCatalogUrl) {
    return {
        name: exports.DEFAULT_FONT_CATALOG_NAME,
        url: defaultFontCatalogUrl
    };
}
/**
 *
 * Internal class to manage all text rendering.
 */
class TextElementsRenderer {
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
    constructor(m_viewState, m_screenProjector, m_poiManager, m_renderer, m_imageCaches, options, textCanvasFactory, poiRenderer, screenCollisions) {
        this.m_viewState = m_viewState;
        this.m_screenProjector = m_screenProjector;
        this.m_poiManager = m_poiManager;
        this.m_renderer = m_renderer;
        this.m_imageCaches = m_imageCaches;
        this.m_loadPromisesCount = 0;
        this.m_textCanvases = new Map();
        this.m_tmpVector = new THREE.Vector2();
        this.m_tmpVector3 = new THREE.Vector3();
        this.m_cameraLookAt = new THREE.Vector3();
        this.m_overloaded = false;
        this.m_cacheInvalidated = false;
        this.m_addNewLabels = true;
        this.m_forceNewLabelsPass = false;
        this.m_textElementStateCache = new TextElementStateCache_1.TextElementStateCache();
        this.m_camera = new THREE.OrthographicCamera(-1, 1, 1, -1);
        this.m_textStyleCache = new TextStyleCache_1.TextStyleCache();
        this.m_screenCollisions = new ScreenCollisions_1.ScreenCollisions();
        /**
         * indicates if the TextElementsRenderer is still updating, includes fading, elevations etc
         */
        this.m_isUpdatePending = false;
        this.m_options = Object.assign({}, options);
        TextElementsRendererOptions_1.initializeDefaultOptions(this.m_options);
        if (screenCollisions) {
            this.m_screenCollisions = screenCollisions;
        }
        else if (this.m_options.collisionDebugCanvas !== undefined &&
            this.m_options.collisionDebugCanvas !== null) {
            this.m_screenCollisions = new ScreenCollisions_1.ScreenCollisionsDebug(this.m_options.collisionDebugCanvas);
        }
        this.m_textCanvasFactory = textCanvasFactory !== null && textCanvasFactory !== void 0 ? textCanvasFactory : new TextCanvasFactory_1.TextCanvasFactory(this.m_renderer);
        this.m_textCanvasFactory.setGlyphCountLimits(this.m_options.minNumGlyphs, this.m_options.maxNumGlyphs);
        this.m_poiRenderer = poiRenderer !== null && poiRenderer !== void 0 ? poiRenderer : new PoiRenderer_1.PoiRenderer(this.m_renderer, this.m_poiManager, this.m_imageCaches);
        this.initializeCamera();
        this.initializeDefaultFontCatalog();
        this.m_textStyleCache.updateTextCanvases(this.m_textCanvases);
    }
    /**
     * Disable all fading animations (for debugging and performance measurement). Defaults to
     * `false`.
     */
    set disableFading(disable) {
        this.m_options.disableFading = disable;
    }
    get disableFading() {
        return this.m_options.disableFading === true;
    }
    get styleCache() {
        return this.m_textStyleCache;
    }
    get delayLabelsUntilMovementFinished() {
        return this.m_options.delayLabelsUntilMovementFinished === true;
    }
    set delayLabelsUntilMovementFinished(delay) {
        this.m_options.delayLabelsUntilMovementFinished = delay;
    }
    /**
     * If `true`, a replacement glyph ("?") is rendered for every missing glyph.
     */
    get showReplacementGlyphs() {
        return this.m_options.showReplacementGlyphs === true;
    }
    /**
     * If `true`, a replacement glyph ("?") is rendered for every missing glyph.
     */
    set showReplacementGlyphs(value) {
        this.m_options.showReplacementGlyphs = value;
        this.m_textCanvases.forEach(textCanvas => {
            if (textCanvas === null || textCanvas === void 0 ? void 0 : textCanvas.fontCatalog) {
                textCanvas.fontCatalog.showReplacementGlyphs = value;
            }
        });
    }
    restoreRenderers(renderer) {
        this.m_renderer = renderer;
        this.m_poiRenderer = new PoiRenderer_1.PoiRenderer(this.m_renderer, this.m_poiManager, this.m_imageCaches);
        //TODO: restore TextCanvasRenderers
    }
    /**
     * Updates the FontCatalogs used by this {@link TextElementsRenderer}.
     *
     * @param fontCatalogs - The new list of {@link FontCatalogConfig}s
     */
    async updateFontCatalogs(fontCatalogs) {
        if (this.m_defaultFontCatalogConfig) {
            if (!fontCatalogs ||
                fontCatalogs.findIndex(config => {
                    return config.name === exports.DEFAULT_FONT_CATALOG_NAME;
                }) === -1) {
                // not other default catalog available, keep the old one
                if (!fontCatalogs) {
                    fontCatalogs = [];
                }
                // Never remove the default Canvas if set per configuration
                fontCatalogs.unshift(this.m_defaultFontCatalogConfig);
            }
            else {
                if (this.m_textCanvases.has(exports.DEFAULT_FONT_CATALOG_NAME)) {
                    this.m_textCanvases.delete(exports.DEFAULT_FONT_CATALOG_NAME);
                }
            }
        }
        if (fontCatalogs && fontCatalogs.length > 0) {
            // Remove obsolete ones
            for (const [name] of this.m_textCanvases) {
                if (fontCatalogs.findIndex(catalog => {
                    return catalog.name === name;
                }) < 0) {
                    this.m_textCanvases.delete(name);
                }
            }
            // Add new catalogs
            for (const fontCatalog of fontCatalogs) {
                await this.addTextCanvas(fontCatalog);
            }
        }
        else {
            this.m_textCanvases.clear();
        }
        this.m_textStyleCache.updateTextCanvases(this.m_textCanvases);
    }
    async updateTextStyles(textStyles, defaultTextStyle) {
        this.m_textStyleCache.updateTextStyles(textStyles, defaultTextStyle);
        await this.waitLoaded();
        this.m_textStyleCache.updateTextCanvases(this.m_textCanvases);
        this.invalidateCache();
    }
    /**
     * Render the text using the specified camera into the current canvas.
     *
     * @param camera - Orthographic camera to use.
     */
    renderText(farPlane) {
        this.m_camera.far = farPlane;
        this.updateGlyphDebugMesh();
        let previousLayer;
        this.m_poiRenderer.update();
        for (const poiLayer of this.m_poiRenderer.layers) {
            for (const [, textCanvas] of this.m_textCanvases) {
                textCanvas === null || textCanvas === void 0 ? void 0 : textCanvas.render(this.m_camera, previousLayer === null || previousLayer === void 0 ? void 0 : previousLayer.id, poiLayer.id, undefined, false);
            }
            this.m_poiRenderer.render(this.m_camera, poiLayer);
            previousLayer = poiLayer;
        }
        for (const [, textCanvas] of this.m_textCanvases) {
            textCanvas === null || textCanvas === void 0 ? void 0 : textCanvas.render(this.m_camera, previousLayer === null || previousLayer === void 0 ? void 0 : previousLayer.id, undefined, undefined, false);
        }
    }
    /**
     * Forces update of text elements in the next call to [[placeText]].
     */
    invalidateCache() {
        this.m_cacheInvalidated = true;
    }
    /**
     * Notify `TextElementsRenderer` that the camera has started a movement.
     */
    movementStarted() {
        if (this.delayLabelsUntilMovementFinished) {
            this.m_addNewLabels = false;
        }
    }
    /**
     * Notify `TextElementsRenderer` that the camera has finished its movement.
     */
    movementFinished() {
        this.invalidateCache();
        if (this.delayLabelsUntilMovementFinished) {
            this.m_addNewLabels = true;
        }
    }
    /**
     * Is `true` if number of {@link TextElement}s in visible tiles is larger than the recommended
     * number `OVERLOAD_LABEL_LIMIT`.
     */
    get overloaded() {
        return this.m_overloaded;
    }
    /**
     * Places text elements for the current frame.
     * @param dataSourceTileList - List of tiles to be rendered for each data source.
     * @param time - Current frame time.
     */
    placeText(dataSourceTileList, time) {
        const tileTextElementsChanged = checkIfTextElementsChanged(dataSourceTileList);
        const textElementsAvailable = this.hasOverlayText() || tileTextElementsChanged || hasTextElements(dataSourceTileList);
        this.m_isUpdatePending = false;
        if (!textElementsAvailable &&
            !this.m_cacheInvalidated &&
            !this.m_viewState.renderedTilesChanged) {
            return;
        }
        const updateTextElements = this.m_cacheInvalidated ||
            tileTextElementsChanged ||
            this.m_viewState.renderedTilesChanged;
        const findReplacements = updateTextElements && this.m_addNewLabels;
        if (findReplacements) {
            this.m_textElementStateCache.clearVisited();
            this.updateTextElements(dataSourceTileList);
        }
        const anyTextGroupEvicted = this.m_textElementStateCache.update(time, this.m_options.disableFading, findReplacements, this.m_viewState.zoomLevel);
        // TODO: this seems extremly suboptimal.. review if an update is possible
        this.reset();
        if (this.m_addNewLabels) {
            this.prepopulateScreenWithBlockingElements(dataSourceTileList);
        }
        // New text elements must be placed either if text elements were updated in this frame
        // or if any text element group was evicted. The second case happens when the group is not
        // visited anymore and all it's elements just became invisible, which means there's newly
        // available screen space where new text elements could be placed. A common scenario where
        // this happens is zooming in/out: text groups from the old level may still be fading out
        // after all groups in the new level were updated.
        const placeNewTextElements = (updateTextElements || anyTextGroupEvicted) && this.m_addNewLabels;
        this.placeTextElements(time, placeNewTextElements);
        this.placeOverlayTextElements();
    }
    /**
     * Adds new overlay text elements to this `MapView`.
     *
     * @param textElements - Array of {@link TextElement} to be added.
     */
    addOverlayText(textElements) {
        if (textElements.length === 0) {
            return;
        }
        this.m_overlayTextElements =
            this.m_overlayTextElements === undefined
                ? textElements.slice()
                : this.m_overlayTextElements.concat(textElements);
    }
    /**
     * Adds new overlay text elements to this `MapView`.
     *
     * @param textElements - Array of {@link TextElement} to be added.
     */
    clearOverlayText() {
        this.m_overlayTextElements = [];
    }
    /**
     * @returns Whether there's overlay text to be rendered.
     */
    hasOverlayText() {
        return this.m_overlayTextElements !== undefined && this.m_overlayTextElements.length > 0;
    }
    get overlayText() {
        return this.m_overlayTextElements;
    }
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
    pickTextElements(screenPosition, pickListener) {
        const pickHandler = (pickData, pickObjectType) => {
            if (pickData === undefined) {
                return;
            }
            const textElement = pickData;
            const pickResult = {
                type: pickObjectType,
                point: screenPosition,
                distance: 0,
                renderOrder: textElement.renderOrder,
                featureId: textElement.featureId,
                userData: textElement.userData,
                dataSourceName: textElement.dataSourceName,
                dataSourceOrder: textElement.dataSourceOrder,
                text: textElement.text
            };
            pickListener.addResult(pickResult);
        };
        for (const [, textCanvas] of this.m_textCanvases) {
            textCanvas === null || textCanvas === void 0 ? void 0 : textCanvas.pickText(screenPosition, (pickData) => {
                pickHandler(pickData, PickHandler_1.PickObjectType.Text);
            });
        }
        this.m_poiRenderer.pickTextElements(screenPosition, (pickData) => {
            pickHandler(pickData, PickHandler_1.PickObjectType.Icon);
        });
    }
    /**
     * `true` if any resource used by any `FontCatalog` is still loading.
     */
    get loading() {
        return this.m_loadPromisesCount > 0;
    }
    /**
     * `true` if TextElements are not placed finally but are still updating, including fading or
     * waiting for elevation.
     */
    get isUpdatePending() {
        return this.m_isUpdatePending;
    }
    /**
     * Waits till all pending resources from any `FontCatalog` are loaded.
     */
    async waitLoaded() {
        if (this.m_loadPromise !== undefined) {
            return await this.m_loadPromise;
        }
    }
    /**
     * Reset the current text render states of all visible tiles.
     *
     * @remarks
     * All {@link TextElement}s will fade in
     * after that as if they have just been added.
     */
    clearRenderStates() {
        this.m_textElementStateCache.clear();
    }
    /**
     * Return memory used by all objects managed by `TextElementsRenderer`.
     *
     * @returns `MemoryUsage` Heap and GPU memory used by this `TextElementsRenderer`.
     */
    getMemoryUsage() {
        const memoryUsage = {
            heapSize: 0,
            gpuSize: 0
        };
        for (const [, textCanvas] of this.m_textCanvases) {
            textCanvas === null || textCanvas === void 0 ? void 0 : textCanvas.getMemoryUsage(memoryUsage);
        }
        this.m_poiRenderer.getMemoryUsage(memoryUsage);
        return memoryUsage;
    }
    async addDefaultTextCanvas() {
        if (this.m_textCanvases.has(exports.DEFAULT_FONT_CATALOG_NAME) ||
            !this.m_defaultFontCatalogConfig) {
            return;
        }
        await this.addTextCanvas(this.m_defaultFontCatalogConfig);
        this.m_textStyleCache.updateTextCanvases(this.m_textCanvases);
    }
    /**
     * Reset internal state at the beginning of a frame.
     */
    reset() {
        this.m_cameraLookAt.copy(this.m_viewState.lookAtVector);
        this.m_screenCollisions.reset();
        for (const [, textCanvas] of this.m_textCanvases) {
            textCanvas === null || textCanvas === void 0 ? void 0 : textCanvas.clear();
        }
        this.m_poiRenderer.reset();
    }
    /**
     * Fills the screen with lines projected from world space, see [[Tile.blockingElements]].
     * @note These boxes have highest priority, so will block all other labels.
     * @param dataSourceTileList - List of tiles to be rendered for each data source.
     */
    prepopulateScreenWithBlockingElements(dataSourceTileList) {
        const boxes = [];
        dataSourceTileList.forEach(renderListEntry => {
            const startLinePointProj = new THREE.Vector3();
            const endLinePointProj = new THREE.Vector3();
            for (const tile of renderListEntry.renderedTiles.values()) {
                for (const pathBlockingElement of tile.blockingElements) {
                    if (pathBlockingElement.points.length < 2) {
                        continue;
                    }
                    this.m_screenProjector.project3(pathBlockingElement.points[0], startLinePointProj);
                    for (let i = 1; i < pathBlockingElement.points.length; i++) {
                        this.m_screenProjector.project3(pathBlockingElement.points[i], endLinePointProj);
                        const line = pathBlockingElement.screenSpaceLines[i - 1];
                        line.start.copy(startLinePointProj);
                        line.end.copy(endLinePointProj);
                        const lineWithBound = {
                            minX: Math.min(startLinePointProj.x, endLinePointProj.x),
                            maxX: Math.max(startLinePointProj.x, endLinePointProj.x),
                            minY: Math.min(startLinePointProj.y, endLinePointProj.y),
                            maxY: Math.max(startLinePointProj.y, endLinePointProj.y),
                            line
                        };
                        boxes.push(lineWithBound);
                        startLinePointProj.copy(endLinePointProj);
                    }
                }
            }
        });
        this.m_screenCollisions.allocateIBoxes(boxes);
    }
    /**
     * @returns True if whole group was processed for placement,
     * false otherwise (e.g. placement limit reached).
     */
    placeTextElementGroup(groupState, renderParams, maxNumPlacedLabels, pass) {
        var _a;
        // Unvisited text elements are never placed.
        harp_utils_1.assert(groupState.visited);
        const shieldGroups = [];
        const hiddenKinds = this.m_viewState.hiddenGeometryKinds;
        const projection = this.m_viewState.projection;
        const elevationProvider = this.m_viewState.elevationProvider;
        const elevationMap = elevationProvider === null || elevationProvider === void 0 ? void 0 : elevationProvider.getDisplacementMap(groupState.tileKey);
        for (const textElementState of groupState.textElementStates) {
            if (pass === Pass.PersistentLabels) {
                if (placementStats) {
                    ++placementStats.total;
                }
            }
            // Limit labels only in new labels pass (Pass.NewLabels).
            else if (maxNumPlacedLabels !== undefined &&
                renderParams.numRenderedTextElements >= maxNumPlacedLabels) {
                logger.debug("Placement label limit exceeded.");
                return false;
            }
            // Skip all labels that are not initialized (didn't pass early placement tests)
            // or don't belong to this pass.
            if (!textElementState.initialized) {
                if (placementStats) {
                    ++placementStats.uninitialized;
                }
                continue;
            }
            if (textElementState.viewDistance === undefined || textElementState.viewDistance < 0) {
                if (placementStats) {
                    ++placementStats.tooFar;
                }
                continue;
            }
            const elementVisible = textElementState.visible;
            if ((pass === Pass.PersistentLabels && !elementVisible) ||
                (pass === Pass.NewLabels && elementVisible)) {
                continue;
            }
            const textElement = textElementState.element;
            // Get the TextElementStyle.
            const textElementStyle = this.m_textStyleCache.getTextElementStyle(textElement.style);
            const textCanvas = textElementStyle.textCanvas;
            // TODO: HARP-7648. Discard hidden kinds sooner, before placement.
            // Check if the label should be hidden.
            if (hiddenKinds !== undefined &&
                textElement.kind !== undefined &&
                hiddenKinds.hasOrIntersects(textElement.kind)) {
                continue;
            }
            if (elevationProvider !== undefined && !textElement.elevated) {
                if (!elevationMap) {
                    this.m_isUpdatePending = true;
                    this.m_forceNewLabelsPass = true;
                    continue;
                }
                overlayOnElevation_1.overlayTextElement(textElement, elevationProvider, elevationMap, projection);
            }
            const elementType = textElement.type;
            const isPathLabel = elementType === TextElementType_1.TextElementType.PathLabel;
            // For paths, check if the label may fit.
            if (isPathLabel) {
                if (Placement_1.isPathLabelTooSmall(textElement, this.m_screenProjector, tempScreenPoints)) {
                    if (placementStats) {
                        placementStats.numNotVisible++;
                    }
                    if (textElement.dbgPathTooSmall === true) {
                        if (placementStats) {
                            placementStats.numPathTooSmall++;
                        }
                    }
                    textElementState.reset();
                    continue;
                }
            }
            const forceNewPassOnLoaded = true;
            if (textCanvas) {
                // This ensures that textElement.renderStyle and textElement.layoutStyle are
                // already instantiated and initialized with theme style values.
                if (!this.initializeGlyphs(textElement, textElementStyle, forceNewPassOnLoaded)) {
                    continue;
                }
                const layer = textCanvas.getLayer((_a = textElement.renderOrder) !== null && _a !== void 0 ? _a : harp_text_canvas_1.DEFAULT_TEXT_CANVAS_LAYER);
                // Move onto the next TextElement if we cannot continue adding glyphs to this layer.
                if (layer !== undefined) {
                    if (layer.storage.drawCount + textElement.glyphs.length >
                        layer.storage.capacity) {
                        if (placementStats) {
                            ++placementStats.numCannotAdd;
                        }
                        logger.warn("layer glyph storage capacity exceeded.");
                        continue;
                    }
                }
                // Set the current style for the canvas.
                // This means text canvas has always references (not a copy) to text element styles.
                // The only exception is multi-anchor placement where layoutStyle need to be
                // modified and thus textCanvas will using its own copy of textElement.layoutStyle.
                // See: placePointLabel()
                textCanvas.textRenderStyle = textElement.renderStyle;
                textCanvas.textLayoutStyle = textElement.layoutStyle;
            }
            switch (elementType) {
                case TextElementType_1.TextElementType.PoiLabel:
                    this.addPoiLabel(textElementState, textCanvas, renderParams);
                    break;
                case TextElementType_1.TextElementType.LineMarker:
                    this.addLineMarkerLabel(textElementState, shieldGroups, textCanvas, renderParams);
                    break;
                case TextElementType_1.TextElementType.PathLabel:
                    if (textCanvas) {
                        this.addPathLabel(textElementState, tempScreenPoints, textCanvas, renderParams);
                    }
            }
        }
        return true;
    }
    initializeGlyphs(textElement, textElementStyle, forceNewPassOnLoaded) {
        // Trigger the glyph load if needed.
        if (textElement.loadingState === TextElement_1.LoadingState.Initialized) {
            return textElement.glyphs !== undefined;
        }
        harp_utils_1.assert(textElementStyle.textCanvas !== undefined);
        const textCanvas = textElementStyle.textCanvas;
        if (textElement.loadingState === undefined) {
            textElement.loadingState = TextElement_1.LoadingState.Requested;
            if (textElement.renderStyle === undefined) {
                textElement.renderStyle = new harp_text_canvas_1.TextRenderStyle(Object.assign(Object.assign({}, textElementStyle.renderParams), textElement.renderParams));
            }
            if (textElement.layoutStyle === undefined) {
                textElement.layoutStyle = new harp_text_canvas_1.TextLayoutStyle(Object.assign(Object.assign({}, textElementStyle.layoutParams), textElement.layoutParams));
            }
            if (textElement.text === "") {
                textElement.loadingState = TextElement_1.LoadingState.Loaded;
            }
            else {
                const newLoadPromise = textCanvas.fontCatalog
                    .loadCharset(textElement.text, textElement.renderStyle)
                    .then(() => {
                    --this.m_loadPromisesCount;
                    textElement.loadingState = TextElement_1.LoadingState.Loaded;
                    this.m_isUpdatePending = true;
                    this.m_forceNewLabelsPass =
                        this.m_forceNewLabelsPass || forceNewPassOnLoaded;
                });
                if (this.m_loadPromisesCount === 0) {
                    this.m_loadPromise = undefined;
                }
                ++this.m_loadPromisesCount;
                this.m_loadPromise =
                    this.m_loadPromise === undefined
                        ? newLoadPromise
                        : Promise.all([this.m_loadPromise, newLoadPromise]);
            }
        }
        if (textElement.loadingState === TextElement_1.LoadingState.Loaded) {
            textCanvas.textRenderStyle = textElement.renderStyle;
            textCanvas.textLayoutStyle = textElement.layoutStyle;
            textElement.glyphCaseArray = [];
            textElement.bounds = undefined;
            textElement.glyphs = textCanvas.fontCatalog.getGlyphs(textElement.text, textCanvas.textRenderStyle, textElement.glyphCaseArray);
            textElement.loadingState = TextElement_1.LoadingState.Initialized;
        }
        // Return true as soon as a text element has some glyphs assigned so that it's rendered.
        // The glyphs may be either the final ones or some temporal glyphs inherited from a
        // predecessor as part of the text element replacement process.
        // See TextElementState.replace().
        return textElement.glyphs !== undefined;
    }
    initializeCamera() {
        this.m_camera.position.z = 1;
        this.m_camera.near = 0;
    }
    updateCamera() {
        const { width, height } = this.m_renderer.getSize(cache.vector2[0]);
        this.m_camera.left = width / -2;
        this.m_camera.right = width / 2;
        this.m_camera.bottom = height / -2;
        this.m_camera.top = height / 2;
        this.m_camera.updateProjectionMatrix();
        this.m_camera.updateMatrixWorld(false);
        this.m_screenCollisions.update(width, height);
    }
    initializeDefaultFontCatalog() {
        if (this.m_options.fontCatalog) {
            this.m_defaultFontCatalogConfig = createDefaultFontCatalogConfig(this.m_options.fontCatalog);
            this.addDefaultTextCanvas();
        }
    }
    async addTextCanvas(fontCatalogConfig) {
        const catalogCallback = (name, catalog) => {
            if (this.m_textCanvases.has(name)) {
                const loadedTextCanvas = this.m_textCanvasFactory.createTextCanvas(catalog, name);
                catalog.showReplacementGlyphs = this.showReplacementGlyphs;
                // Check if the textCanvas has not been removed in the meantime
                this.m_textCanvases.set(name, loadedTextCanvas);
            }
        };
        const errorCallback = () => {
            this.m_textCanvases.delete(fontCatalogConfig.name);
        };
        if (this.m_textCanvases.has(fontCatalogConfig.name)) {
            return Promise.resolve();
        }
        else {
            // Reserve map space, until loaded or error
            this.m_textCanvases.set(fontCatalogConfig.name, undefined);
            const newLoadPromise = FontCatalogLoader_1.loadFontCatalog(fontCatalogConfig, catalogCallback, errorCallback)
                .then(() => {
                --this.m_loadPromisesCount;
            })
                .catch(error => {
                logger.info("rendering without font catalog, only icons possible", error);
                --this.m_loadPromisesCount;
            });
            if (this.m_loadPromisesCount === 0) {
                this.m_loadPromise = undefined;
            }
            ++this.m_loadPromisesCount;
            this.m_loadPromise =
                this.m_loadPromise === undefined
                    ? newLoadPromise
                    : Promise.all([this.m_loadPromise, newLoadPromise]);
            return newLoadPromise;
        }
    }
    updateGlyphDebugMesh() {
        const debugGlyphs = DebugContext_1.debugContext.getValue("DEBUG_GLYPHS");
        if (debugGlyphs === undefined) {
            return;
        }
        if (debugGlyphs && this.m_debugGlyphTextureCacheMesh === undefined) {
            this.initializeGlyphDebugMesh();
        }
        harp_utils_1.assert(this.m_debugGlyphTextureCacheMesh !== undefined);
        harp_utils_1.assert(this.m_debugGlyphTextureCacheWireMesh !== undefined);
        this.m_debugGlyphTextureCacheMesh.visible = debugGlyphs;
        this.m_debugGlyphTextureCacheWireMesh.visible = debugGlyphs;
    }
    initializeGlyphDebugMesh() {
        if (this.m_textCanvases.size === 0) {
            return;
        }
        const defaultTextCanvas = this.m_textCanvases.values().next().value;
        const defaultFontCatalog = defaultTextCanvas.fontCatalog;
        // Initialize glyph-debugging mesh.
        const planeGeometry = new THREE.PlaneGeometry(defaultFontCatalog.textureSize.width / 2.5, defaultFontCatalog.textureSize.height / 2.5, defaultFontCatalog.textureSize.width / defaultFontCatalog.maxWidth, defaultFontCatalog.textureSize.height / defaultFontCatalog.maxHeight);
        const material = new THREE.MeshBasicMaterial({
            transparent: true,
            depthWrite: false,
            depthTest: false,
            map: defaultFontCatalog.texture
        });
        this.m_debugGlyphTextureCacheMesh = new THREE.Mesh(planeGeometry, material);
        this.m_debugGlyphTextureCacheMesh.renderOrder = 10000;
        this.m_debugGlyphTextureCacheMesh.visible = false;
        this.m_debugGlyphTextureCacheMesh.name = "glyphDebug";
        const wireframe = new THREE.WireframeGeometry(planeGeometry);
        const wireframeMaterial = new THREE.LineBasicMaterial({
            transparent: true,
            color: 0x999999,
            depthWrite: false,
            depthTest: false
        });
        this.m_debugGlyphTextureCacheWireMesh = new THREE.LineSegments(wireframe, wireframeMaterial);
        this.m_debugGlyphTextureCacheWireMesh.renderOrder = 9999;
        this.m_debugGlyphTextureCacheWireMesh.visible = false;
        this.m_debugGlyphTextureCacheWireMesh.name = "glyphDebug";
        defaultTextCanvas
            .getLayer(harp_text_canvas_1.DEFAULT_TEXT_CANVAS_LAYER)
            .storage.scene.add(this.m_debugGlyphTextureCacheMesh, this.m_debugGlyphTextureCacheWireMesh);
    }
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
    updateTextElements(dataSourceTileList) {
        if (updateStats) {
            updateStats.clear();
        }
        this.m_textElementStateCache.clearTextCache();
        this.m_cacheInvalidated = false;
        this.checkIfOverloaded(dataSourceTileList);
        // Used with tile offset to compute the x coordinate offset for tiles.
        const updateStartTime = this.overloaded && this.m_viewState.isDynamic ? harp_utils_1.PerformanceTimer.now() : undefined;
        // TODO: HARP-7648. Skip all data sources that won't contain text.
        // TODO: HARP-7651. Higher priority labels should be updated before lower priority ones
        // across all data sources.
        // TODO: HARP-7373. Use rendered tiles (tiles currently rendered to cover the view,
        // including fallbacks if necessary) instead of visible tiles (target tiles that might not
        // be decoded yet).
        // Otherwise labels persistent when crossing a zoom level boundary will flicker (fade out
        // and back in) due to the delay in decoding the visible tiles.
        dataSourceTileList.forEach(tileList => {
            this.updateTextElementsFromSource(tileList.dataSource, tileList.storageLevel, Array.from(tileList.renderedTiles.values()), updateStartTime);
        });
        if (updateStats) {
            updateStats.log();
        }
    }
    updateTextElementsFromSource(tileDataSource, storageLevel, visibleTiles, updateStartTime) {
        if (updateStats) {
            updateStats.tiles += visibleTiles.length;
        }
        const sortedTiles = visibleTiles;
        // TODO: HARP-7648. Really needed? Should it be done here or in VisibleTileSet?
        sortedTiles.sort((a, b) => {
            return a.tileKey.mortonCode() - b.tileKey.mortonCode();
        });
        const sortedGroups = [];
        this.createSortedGroupsForSorting(tileDataSource, storageLevel, sortedTiles, sortedGroups);
        let numTextElementsUpdated = 0;
        for (const textElementLists of sortedGroups) {
            this.selectTextElementsToUpdateByDistance(textElementLists);
            // The value of updateStartTime is set if this.overloaded is true.
            if (updateStartTime !== undefined) {
                // If overloaded and all time is used up, exit early.
                if (OVERLOAD_UPDATE_TIME_LIMIT > 0) {
                    const endTime = harp_utils_1.PerformanceTimer.now();
                    const elapsedTime = endTime - updateStartTime;
                    if (elapsedTime > OVERLOAD_UPDATE_TIME_LIMIT) {
                        logger.debug("Update time limit exceeded.");
                        break;
                    }
                }
                // Try not to update too many elements. They will be checked for visibility each
                // frame.
                numTextElementsUpdated += textElementLists.count();
                if (numTextElementsUpdated >= OVERLOAD_UPDATED_LABEL_LIMIT) {
                    logger.debug("Update label limit exceeded.");
                    break;
                }
            }
        }
    }
    prepareTextElementGroup(textElementGroup, tileKey, maxViewDistance) {
        if (textElementGroup.elements.length === 0) {
            return;
        }
        const textElementSelection = (textElementState) => {
            let { result, viewDistance } = Placement_1.checkReadyForPlacement(textElementState.element, textElementState.element.type === TextElementType_1.TextElementType.LineMarker
                ? textElementState.lineMarkerIndex
                : undefined, this.m_viewState, this.m_poiManager, maxViewDistance);
            if (result === Placement_1.PrePlacementResult.Ok &&
                !this.m_textElementStateCache.deduplicateElement(this.m_viewState.zoomLevel, textElementState)) {
                result = Placement_1.PrePlacementResult.Duplicate;
                viewDistance = undefined;
            }
            if (updateStats) {
                updateStats.totalLabels++;
                updateStats.results[result]++;
            }
            return viewDistance;
        };
        const [, found] = this.m_textElementStateCache.getOrSet(textElementGroup, tileKey, textElementSelection);
        if (updateStats) {
            ++updateStats.totalGroups;
            if (!found) {
                ++updateStats.newGroups;
            }
        }
    }
    createSortedGroupsForSorting(tileDataSource, storageLevel, sortedTiles, sortedGroups) {
        if (sortedTiles.length === 0) {
            return;
        }
        const tilesToRender = [];
        for (const tile of sortedTiles) {
            if (tileDataSource.shouldRenderText(storageLevel, tile.tileKey)) {
                tilesToRender.push(tile);
            }
        }
        const groupedPriorityLists = new Map();
        for (const tile of tilesToRender) {
            for (const group of tile.textElementGroups.groups.values()) {
                if (group.elements.length === 0) {
                    continue;
                }
                const foundGroup = groupedPriorityLists.get(group.priority);
                if (foundGroup === undefined) {
                    groupedPriorityLists.set(group.priority, new TextElementLists([new TileTextElements(tile, group)]));
                }
                else {
                    foundGroup.lists.push(new TileTextElements(tile, group));
                }
            }
        }
        if (groupedPriorityLists.size === 0) {
            return;
        }
        for (const g of groupedPriorityLists) {
            const lists = g[1];
            sortedGroups.push(lists);
        }
        sortedGroups.sort((a, b) => {
            return b.priority - a.priority;
        });
        const printTextInfo = false;
        if (PRINT_LABEL_DEBUG_INFO && printTextInfo) {
            let outString = "";
            for (const textElementLists of sortedGroups) {
                let size = 0;
                for (const tileTextElements of textElementLists.lists) {
                    size += tileTextElements.group.elements.length;
                }
                outString += `priority ${textElementLists.priority} size: ${size}\n`;
            }
            logger.log(outString);
        }
    }
    selectTextElementsToUpdateByDistance(textElementLists) {
        const farDistanceLimitRatio = Math.max(this.m_options.maxDistanceRatioForTextLabels, this.m_options.maxDistanceRatioForPoiLabels);
        const maxViewDistance = Placement_1.getMaxViewDistance(this.m_viewState, farDistanceLimitRatio);
        for (const tileTextElements of textElementLists.lists) {
            this.prepareTextElementGroup(tileTextElements.group, tileTextElements.tile.tileKey, maxViewDistance);
        }
    }
    placeTextElements(time, placeNewTextElements) {
        const renderParams = {
            numRenderedTextElements: 0,
            fadeAnimationRunning: false,
            time
        };
        const placeStartTime = this.overloaded && this.m_viewState.isDynamic ? harp_utils_1.PerformanceTimer.now() : undefined;
        if (placementStats) {
            placementStats.clear();
        }
        if (this.m_textElementStateCache.size === 0) {
            logger.debug("Text element cache empty.");
            return;
        }
        const placeNew = this.m_forceNewLabelsPass || placeNewTextElements;
        if (this.m_forceNewLabelsPass) {
            this.m_forceNewLabelsPass = false;
        }
        const maxNumPlacedTextElements = this.m_options.maxNumVisibleLabels;
        // TODO: HARP-7648. Potential performance improvement. Place persistent labels + rejected
        // candidates from previous frame if there's been no placement in this one.
        const groupStates = this.m_textElementStateCache.sortedGroupStates;
        let currentPriority = groupStates[0].priority;
        let currentPriorityBegin = 0;
        for (let i = 0; i < groupStates.length; ++i) {
            const textElementGroupState = groupStates[i];
            if (placementStats) {
                ++placementStats.totalGroups;
            }
            const newPriority = textElementGroupState.priority;
            if (placeNew && currentPriority !== newPriority) {
                // Place all new labels of the previous priority before placing the persistent
                // labels of this priority.
                this.placeNewTextElements(currentPriorityBegin, i, renderParams);
                if (isPlacementTimeExceeded(placeStartTime)) {
                    break;
                }
                currentPriority = newPriority;
                currentPriorityBegin = i;
            }
            if (!this.placeTextElementGroup(textElementGroupState, renderParams, maxNumPlacedTextElements, Pass.PersistentLabels)) {
                break;
            }
            if (isPlacementTimeExceeded(placeStartTime)) {
                break;
            }
        }
        if (placeNew) {
            // Place new text elements of the last priority.
            this.placeNewTextElements(currentPriorityBegin, groupStates.length, renderParams);
        }
        if (placementStats) {
            placementStats.numRenderedTextElements = renderParams.numRenderedTextElements;
            placementStats.log();
        }
        if (renderParams.fadeAnimationRunning) {
            this.m_isUpdatePending = true;
        }
    }
    placeNewTextElements(beginGroupIndex, endGroupIndex, renderParams) {
        const groupStates = this.m_textElementStateCache.sortedGroupStates;
        for (let i = beginGroupIndex; i < endGroupIndex; ++i) {
            if (!this.placeTextElementGroup(groupStates[i], renderParams, this.m_options.maxNumVisibleLabels, Pass.NewLabels)) {
                break;
            }
        }
    }
    placeOverlayTextElements() {
        var _a;
        if (this.m_overlayTextElements === undefined || this.m_overlayTextElements.length === 0) {
            return;
        }
        const screenSize = this.m_tmpVector.set(this.m_screenProjector.width, this.m_screenProjector.height);
        const screenXOrigin = -screenSize.width / 2.0;
        const screenYOrigin = screenSize.height / 2.0;
        // Place text elements one by one.
        for (const textElement of this.m_overlayTextElements) {
            // Get the TextElementStyle.
            const textElementStyle = this.m_textStyleCache.getTextElementStyle(textElement.style);
            const textCanvas = textElementStyle.textCanvas;
            if (textCanvas === undefined) {
                continue;
            }
            const forceNewPassOnLoaded = false;
            this.initializeGlyphs(textElement, textElementStyle, forceNewPassOnLoaded);
            if (textElement.loadingState !== TextElement_1.LoadingState.Initialized) {
                continue;
            }
            const layer = textCanvas.getLayer((_a = textElement.renderOrder) !== null && _a !== void 0 ? _a : harp_text_canvas_1.DEFAULT_TEXT_CANVAS_LAYER);
            // Move onto the next TextElement if we cannot continue adding glyphs to this layer.
            if (layer !== undefined) {
                if (layer.storage.drawCount + textElement.glyphs.length > layer.storage.capacity) {
                    continue;
                }
            }
            // Set the current style for the canvas.
            textCanvas.textRenderStyle = textElement.renderStyle;
            textCanvas.textLayoutStyle = textElement.layoutStyle;
            // Place text.
            let textPath;
            if (!(textElement.type === TextElementType_1.TextElementType.PathLabel)) {
                // Adjust the label positioning.
                tempScreenPosition.x = screenXOrigin + textElement.position.x * screenSize.width;
                tempScreenPosition.y = screenYOrigin - textElement.position.y * screenSize.height;
                if (textElement.xOffset !== undefined) {
                    tempScreenPosition.x += textElement.xOffset;
                }
                if (textElement.yOffset !== undefined) {
                    tempScreenPosition.y -= textElement.yOffset;
                }
                tempPosition.x = tempScreenPosition.x;
                tempPosition.y = tempScreenPosition.y;
                tempPosition.z = 0.0;
                addTextToCanvas(textElement, textCanvas, tempPosition);
            }
            else {
                // Adjust the label positioning.
                tempScreenPosition.x = screenXOrigin;
                tempScreenPosition.y = screenYOrigin;
                if (textElement.xOffset !== undefined) {
                    tempScreenPosition.x += textElement.xOffset;
                }
                if (textElement.yOffset !== undefined) {
                    tempScreenPosition.y -= textElement.yOffset;
                }
                // Get the screen points that define the label's segments and create a path with
                // them.
                // TODO: HARP-7648. Optimize array allocations.
                const screenPoints = [];
                for (const pt of textElement.path) {
                    const pX = tempScreenPosition.x + pt.x * screenSize.width;
                    const pY = tempScreenPosition.y - pt.y * screenSize.height;
                    screenPoints.push(new THREE.Vector2(pX, pY));
                }
                textPath = new SimplePath_1.SimplePath();
                for (let i = 0; i < screenPoints.length - 1; ++i) {
                    textPath.add(new THREE.LineCurve(screenPoints[i], screenPoints[i + 1]));
                }
                addTextToCanvas(textElement, textCanvas, tempPosition, textPath, true);
            }
        }
    }
    getDistanceScalingFactor(label, distance, lookAtDistance) {
        // Distance scale is based on relation between camera focus point distance and
        // the actual label distance. For labels close to camera look at point the scale
        // remains unchanged, the farther is label from that point the smaller size it is
        // rendered in screen space. This method is unaffected by near and far clipping planes
        // distances, but may be improved by taking FOV into equation or customizing the
        // focus point screen position based on horizon, actual ground, tilt ets.
        let factor = lookAtDistance / distance;
        // The label.distanceScale property defines the influence ratio at which
        // distance affects the final scaling of label.
        factor = 1.0 + (factor - 1.0) * label.distanceScale;
        // Preserve the constraints
        factor = Math.max(factor, this.m_options.labelDistanceScaleMin);
        factor = Math.min(factor, this.m_options.labelDistanceScaleMax);
        return factor;
    }
    getDistanceFadingFactor(label, state, maxVisibilityDist) {
        let distanceFadeValue = 1.0;
        const textDistance = state.viewDistance;
        if (textDistance !== undefined && label.fadeFar !== undefined && label.fadeFar > 0.0) {
            const fadeNear = label.fadeNear === undefined ? 0.0 : label.fadeNear;
            const fadeFar = label.fadeFar;
            if (fadeFar > fadeNear) {
                distanceFadeValue =
                    1.0 -
                        THREE.MathUtils.clamp((textDistance / maxVisibilityDist - fadeNear) / (fadeFar - fadeNear), 0.0, 1.0);
            }
        }
        return distanceFadeValue;
    }
    addPointLabel(labelState, position, screenPosition, textCanvas, renderParams) {
        var _a;
        const pointLabel = labelState.element;
        const textRenderState = labelState.textRenderState;
        const isLineMarker = pointLabel.type === TextElementType_1.TextElementType.LineMarker;
        const iconRenderState = labelState.iconRenderState;
        harp_utils_1.assert(iconRenderState !== undefined);
        // Find the label's original position.
        tempScreenPosition.x = tempPoiScreenPosition.x = screenPosition.x;
        tempScreenPosition.y = tempPoiScreenPosition.y = screenPosition.y;
        // Scale the text depending on the label's distance to the camera "zero" plane.
        const textDistance = Placement_1.pointToPlaneDistance(position, this.m_viewState.worldCenter, this.m_cameraLookAt);
        if (pointLabel.fadeFar !== undefined &&
            (pointLabel.fadeFar <= 0.0 ||
                pointLabel.fadeFar * this.m_viewState.maxVisibilityDist < textDistance)) {
            // The label is farther away than fadeFar value, which means it is totally
            // transparent.
            if (placementStats) {
                ++placementStats.tooFar;
            }
            return false;
        }
        labelState.setViewDistance(textDistance);
        // Check if there is need to check for screen space for the label's icon.
        const poiInfo = pointLabel.poiInfo;
        let iconRejected = false;
        // Check if icon should be rendered at this zoomLevel
        const renderIcon = poiInfo !== undefined &&
            harp_utils_1.MathUtils.isClamped(this.m_viewState.zoomLevel, poiInfo.iconMinZoomLevel, poiInfo.iconMaxZoomLevel) &&
            poiInfo.isValid !== false;
        const distanceScaleFactor = this.getDistanceScalingFactor(pointLabel, textDistance, this.m_viewState.lookAtDistance);
        const iconReady = renderIcon && this.m_poiRenderer.prepareRender(pointLabel, this.m_viewState.env);
        let iconInvisible = false;
        if (iconReady) {
            const result = Placement_1.placeIcon(iconRenderState, poiInfo, tempPoiScreenPosition, distanceScaleFactor, this.m_viewState.env, this.m_screenCollisions);
            iconInvisible = result === Placement_1.PlacementResult.Invisible;
            iconRejected = result === Placement_1.PlacementResult.Rejected;
            if (iconInvisible) {
                iconRenderState.reset();
            }
        }
        else if (renderIcon && (poiInfo === null || poiInfo === void 0 ? void 0 : poiInfo.imageItem) !== null) {
            this.m_forceNewLabelsPass = true;
            this.m_isUpdatePending = true;
        }
        const distanceFadeFactor = this.getDistanceFadingFactor(pointLabel, labelState, this.m_viewState.maxVisibilityDist);
        // Render the label's text...
        // textRenderState is always defined at this point.
        if (textCanvas && shouldRenderPointText(labelState, this.m_viewState, this.m_options)) {
            // For the new labels with rejected icons we don't need to go further.
            const newLabel = !labelState.visible;
            // Multi point (icons) features (line markers) will use single placement anchor, but
            // single point labels (POIs, etc.) may use multi-placement algorithm.
            const placeResult = iconRejected && newLabel
                ? Placement_1.PlacementResult.Rejected
                : Placement_1.placePointLabel(labelState, tempScreenPosition, distanceScaleFactor, textCanvas, this.m_viewState.env, this.m_screenCollisions, tempPosition, !isLineMarker);
            const textInvisible = placeResult === Placement_1.PlacementResult.Invisible;
            if (textInvisible) {
                if (placementStats) {
                    placementStats.numPoiTextsInvisible++;
                }
                if (!renderIcon || iconInvisible) {
                    labelState.reset();
                    return false;
                }
                textRenderState.reset();
            }
            const iconIsOptional = (poiInfo === null || poiInfo === void 0 ? void 0 : poiInfo.iconIsOptional) === true;
            // Rejected icons are only considered to hide the text if they are valid, so a missing
            // icon image will not keep the text from showing up.
            const requiredIconRejected = iconRejected && iconReady && !iconIsOptional;
            const textRejected = requiredIconRejected || placeResult === Placement_1.PlacementResult.Rejected;
            if (!iconRejected && !iconInvisible) {
                const textIsOptional = ((_a = pointLabel.poiInfo) === null || _a === void 0 ? void 0 : _a.textIsOptional) === true;
                iconRejected = textRejected && !textIsOptional;
            }
            if (textRejected) {
                textRenderState.startFadeOut(renderParams.time);
            }
            const textNeedsDraw = !textInvisible &&
                ((!textRejected && shouldRenderPoiText(labelState, this.m_viewState)) ||
                    textRenderState.isFading());
            if (textNeedsDraw) {
                if (!textRejected) {
                    textRenderState.startFadeIn(renderParams.time, this.m_options.disableFading);
                }
                renderParams.fadeAnimationRunning =
                    renderParams.fadeAnimationRunning || textRenderState.isFading();
                if (addTextBufferToCanvas(labelState, textCanvas, tempPosition, distanceFadeFactor, distanceScaleFactor) &&
                    placementStats) {
                    placementStats.numRenderedPoiTexts++;
                }
            }
        }
        // ... and render the icon (if any).
        if (iconReady && !iconInvisible) {
            if (iconRejected) {
                iconRenderState.startFadeOut(renderParams.time);
            }
            else {
                iconRenderState.startFadeIn(renderParams.time, this.m_options.disableFading);
            }
            renderParams.fadeAnimationRunning =
                renderParams.fadeAnimationRunning || iconRenderState.isFading();
            const opacity = iconRenderState.opacity * distanceFadeFactor;
            if (opacity > 0) {
                // Same as for text, don't allocate screen space for an icon that's fading out so
                // that any label blocked by it gets a chance to be placed as soon as any other
                // surrounding new labels.
                const allocateSpace = poiInfo.reserveSpace !== false && !iconRejected;
                this.m_poiRenderer.addPoi(poiInfo, tempPoiScreenPosition, this.m_screenCollisions, labelState.renderDistance, distanceScaleFactor, allocateSpace, opacity, this.m_viewState.env);
                if (placementStats) {
                    placementStats.numRenderedPoiIcons++;
                }
            }
        }
        renderParams.numRenderedTextElements++;
        return true;
    }
    addPoiLabel(labelState, textCanvas, renderParams) {
        const worldPosition = Placement_1.getWorldPosition(labelState.element, this.m_viewState.projection, this.m_viewState.env, this.m_tmpVector3);
        // Only process labels that are potentially within the frustum.
        if (!this.labelPotentiallyVisible(worldPosition, tempScreenPosition)) {
            return false;
        }
        // Add this POI as a point label.
        return this.addPointLabel(labelState, worldPosition, tempScreenPosition, textCanvas, renderParams);
    }
    addLineMarkerLabel(labelState, shieldGroups, textCanvas, renderParams) {
        var _a;
        const lineMarkerLabel = labelState.element;
        // Early exit if the line marker doesn't have the necessary data.
        const poiInfo = lineMarkerLabel.poiInfo;
        if (!((_a = this.m_poiRenderer) === null || _a === void 0 ? void 0 : _a.prepareRender(lineMarkerLabel, this.m_viewState.env))) {
            return;
        }
        // Initialize the shield group for this lineMarker.
        let shieldGroup;
        if (poiInfo.shieldGroupIndex !== undefined) {
            shieldGroup = shieldGroups[poiInfo.shieldGroupIndex];
            if (shieldGroup === undefined) {
                shieldGroup = [];
                shieldGroups[poiInfo.shieldGroupIndex] = shieldGroup;
            }
        }
        const lineTechnique = poiInfo.technique;
        const minDistanceSqr = lineTechnique.minDistance !== undefined
            ? lineTechnique.minDistance * lineTechnique.minDistance
            : 0;
        // Process markers (with shield groups).
        if (minDistanceSqr > 0 && shieldGroup !== undefined) {
            let numShieldsVisible = 0;
            const point = labelState.position;
            // Only process potentially visible labels
            if (this.labelPotentiallyVisible(point, tempScreenPosition)) {
                // Find a suitable location for the lineMarker to be placed at.
                let tooClose = false;
                for (let j = 0; j < shieldGroup.length; j += 2) {
                    const distanceSqr = harp_utils_1.Math2D.distSquared(shieldGroup[j], shieldGroup[j + 1], tempScreenPosition.x, tempScreenPosition.y);
                    tooClose = distanceSqr < minDistanceSqr;
                    if (tooClose) {
                        break;
                    }
                }
                // Place it as a point label if it's not to close to another marker in the
                // same shield group.
                if (!tooClose) {
                    if (this.addPointLabel(labelState, point, tempScreenPosition, textCanvas, renderParams)) {
                        shieldGroup.push(tempScreenPosition.x, tempScreenPosition.y);
                        numShieldsVisible++;
                    }
                }
            }
            if (numShieldsVisible === 0) {
                // For road shields the shared textRenderState may only be reset if none of the
                // icons can be rendered.
                labelState.reset();
            }
        }
        // Process markers (without shield groups).
        else {
            const point = labelState.position;
            // Only process potentially visible labels
            if (this.labelPotentiallyVisible(point, tempScreenPosition)) {
                this.addPointLabel(labelState, point, tempScreenPosition, textCanvas, renderParams);
            }
        }
    }
    addPathLabel(labelState, screenPoints, textCanvas, renderParams) {
        // TODO: HARP-7649. Add fade out transitions for path labels.
        const textMaxDistance = Placement_1.getMaxViewDistance(this.m_viewState, this.m_options.maxDistanceRatioForTextLabels);
        const pathLabel = labelState.element;
        // Limit the text rendering of path labels in the far distance.
        if (!(pathLabel.ignoreDistance === true ||
            labelState.viewDistance === undefined ||
            labelState.viewDistance < textMaxDistance)) {
            if (placementStats) {
                ++placementStats.tooFar;
            }
            labelState.textRenderState.reset();
            return false;
        }
        if (pathLabel.fadeFar !== undefined &&
            (pathLabel.fadeFar <= 0.0 ||
                pathLabel.fadeFar * this.m_viewState.maxVisibilityDist < labelState.renderDistance)) {
            // The label is farther away than fadeFar value, which means it is totally
            // transparent
            if (placementStats) {
                ++placementStats.tooFar;
            }
            labelState.textRenderState.reset();
            return false;
        }
        // Get the screen points that define the label's segments and create a path with
        // them.
        let textPath = new THREE.Path();
        tempScreenPosition.copy(screenPoints[0]);
        for (let i = 0; i < screenPoints.length - 1; ++i) {
            textPath.add(new SimplePath_1.SimpleLineCurve(screenPoints[i], screenPoints[i + 1]));
        }
        // Flip the path if the label is gonna be rendered downwards.
        if (textPath.getPoint(0.5).x - textPath.getPoint(0.51).x > 0) {
            tempScreenPosition.copy(screenPoints[screenPoints.length - 1]);
            textPath = new THREE.Path();
            for (let i = screenPoints.length - 1; i > 0; --i) {
                textPath.add(new SimplePath_1.SimpleLineCurve(screenPoints[i], screenPoints[i - 1]));
            }
        }
        // Update the real rendering distance to have smooth fading and scaling
        labelState.setViewDistance(Placement_1.computeViewDistance(pathLabel, undefined, this.m_viewState.worldCenter, this.m_cameraLookAt));
        const textRenderDistance = -labelState.renderDistance;
        // Scale the text depending on the label's distance to the camera.
        const distanceScaleFactor = this.getDistanceScalingFactor(pathLabel, textRenderDistance, this.m_viewState.lookAtDistance);
        const prevSize = textCanvas.textRenderStyle.fontSize.size;
        textCanvas.textRenderStyle.fontSize.size *= distanceScaleFactor;
        if (Placement_1.placePathLabel(labelState, textPath, tempScreenPosition, textCanvas, this.m_screenCollisions) !== Placement_1.PlacementResult.Ok) {
            textCanvas.textRenderStyle.fontSize.size = prevSize;
            if (placementStats) {
                ++placementStats.numNotVisible;
            }
            labelState.textRenderState.reset();
            return false;
        }
        labelState.textRenderState.startFadeIn(renderParams.time, this.m_options.disableFading);
        let opacity = pathLabel.renderStyle.opacity;
        if (labelState.textRenderState.isFading()) {
            opacity *= labelState.textRenderState.opacity;
            renderParams.fadeAnimationRunning = true;
        }
        if (labelState.textRenderState.opacity === 0) {
            textCanvas.textRenderStyle.fontSize.size = prevSize;
            return false;
        }
        const prevOpacity = textCanvas.textRenderStyle.opacity;
        const prevBgOpacity = textCanvas.textRenderStyle.backgroundOpacity;
        const distanceFadeFactor = this.getDistanceFadingFactor(pathLabel, labelState, this.m_viewState.maxVisibilityDist);
        textCanvas.textRenderStyle.opacity = opacity * distanceFadeFactor;
        textCanvas.textRenderStyle.backgroundOpacity =
            textCanvas.textRenderStyle.opacity * pathLabel.renderStyle.backgroundOpacity;
        tempPosition.z = labelState.renderDistance;
        addTextToCanvas(pathLabel, textCanvas, tempPosition, textPath);
        renderParams.numRenderedTextElements++;
        // Restore previous style values for text elements using the same style.
        textCanvas.textRenderStyle.fontSize.size = prevSize;
        textCanvas.textRenderStyle.opacity = prevOpacity;
        textCanvas.textRenderStyle.backgroundOpacity = prevBgOpacity;
        return true;
    }
    checkIfOverloaded(dataSourceTileList) {
        // Count the number of TextElements in the scene to see if we have to switch to
        // "overloadMode".
        let numTextElementsInScene = 0;
        dataSourceTileList.forEach(renderListEntry => {
            for (const tile of renderListEntry.renderedTiles.values()) {
                numTextElementsInScene += tile.textElementGroups.count();
            }
        });
        const newOverloaded = numTextElementsInScene > OVERLOAD_LABEL_LIMIT;
        if (newOverloaded && !this.m_overloaded) {
            logger.debug("Overloaded Mode enabled.");
        }
        this.m_overloaded = newOverloaded;
        return this.m_overloaded;
    }
    /**
     * Project point to screen and check if it is on screen or within a fixed distance to the
     * border.
     *
     * @param point center point of label.
     * @param outPoint projected screen point of label.
     */
    labelPotentiallyVisible(point, outPoint) {
        var _a;
        const maxDistance = THREE.MathUtils.clamp((_a = this.m_options.maxPoiDistanceToBorder) !== null && _a !== void 0 ? _a : 0, 0, 1);
        const projectionResult = this.m_screenProjector.projectAreaToScreen(point, maxDistance, maxDistance, outPoint);
        return projectionResult !== undefined;
    }
}
exports.TextElementsRenderer = TextElementsRenderer;
//# sourceMappingURL=TextElementsRenderer.js.map
export default exports