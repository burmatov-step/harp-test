"use strict";
let exports = {}
exports.Tile = exports.getFeatureDataSize = void 0;
import * as harp_geoutils_1 from "@here/harp-geoutils";
import * as harp_utils_1 from "@here/harp-utils";
import * as THREE from "three";
import LodMesh_1 from "./geometry/LodMesh";
import Object3DUtils_1 from "./geometry/Object3DUtils";
import TileGeometryLoader_1 from "./geometry/TileGeometryLoader";
import ITileLoader_1 from "./ITileLoader";
import Statistics_1 from "./Statistics";
import TextElement_1 from "./text/TextElement";
import TextElementGroup_1 from "./text/TextElementGroup";
import TextElementGroupPriorityList_1 from "./text/TextElementGroupPriorityList";
import TileTextStyleCache_1 from "./text/TileTextStyleCache";
const logger = harp_utils_1.LoggerManager.instance.create("Tile");
/**
 * Minimum estimated size of a JS object.
 */
const MINIMUM_SMALL_OBJECT_SIZE_ESTIMATION = 16;
const MINIMUM_OBJECT_SIZE_ESTIMATION = 100;
/**
 * Compute the memory footprint of `TileFeatureData`.
 *
 * @internal
 */
function getFeatureDataSize(featureData) {
    let numBytes = MINIMUM_OBJECT_SIZE_ESTIMATION;
    if (featureData.starts !== undefined) {
        numBytes += featureData.starts.length * 8;
    }
    if (featureData.objInfos !== undefined) {
        // 16 (estimated) bytes per objInfos
        numBytes += featureData.objInfos.length * MINIMUM_SMALL_OBJECT_SIZE_ESTIMATION;
    }
    return numBytes;
}
exports.getFeatureDataSize = getFeatureDataSize;
/**
 * The class that holds the tiled data for a {@link DataSource}.
 */
class Tile {
    /**
     * Creates a new {@link Tile}.
     *
     * @param dataSource - The {@link DataSource} that created this {@link Tile}.
     * @param tileKey - The unique identifier for this {@link Tile}.
     *                  Currently only up to level 24 is
     *                  supported, because of the use of the upper bits for the offset.
     * @param offset - The optional offset, this is an integer which represents what multiple of 360
     *                 degrees to shift, only useful for flat projections, hence optional.
     * @param localTangentSpace - Whether the tile geometry is in local tangent space or not.
     */
    constructor(dataSource, tileKey, offset = 0, localTangentSpace) {
        this.dataSource = dataSource;
        this.tileKey = tileKey;
        /**
         * A list of the THREE.js objects stored in this `Tile`.
         */
        this.objects = [];
        /**
         * The optional list of HERE TileKeys of tiles with geometries that cross the boundaries of this
         * `Tile`.
         */
        this.dependencies = [];
        /**
         * Keeping some stats for the individual {@link Tile}s to analyze caching behavior.
         *
         * The frame the {@link Tile} was last requested. This is
         * required to know when the given {@link Tile}
         * can be removed from the cache.
         */
        this.frameNumLastRequested = -1;
        /**
         * The frame the `Tile` was first visible.
         */
        this.frameNumVisible = -1;
        /**
         * The last frame this `Tile` has been rendered (or was in the visible set). Used to determine
         * visibility of `Tile` at the end of a frame, if the number is the current frame number, it is
         * visible.
         */
        this.frameNumLastVisible = -1;
        /**
         * After removing from cache, this is the number of frames the `Tile` was visible.
         */
        this.numFramesVisible = 0;
        /**
         * Version stamp of the visibility set in the [[TileManager]]. If the counter is different, the
         * visibility of the Tile's objects has to be calculated. Optimization to reduce overhead of
         * computing visibility.
         */
        this.visibilityCounter = -1;
        /**
         * @hidden
         *
         * Used to tell if the Tile is used temporarily as a fallback tile.
         *
         * levelOffset is in in the range [-quadTreeSearchDistanceUp,
         * quadTreeSearchDistanceDown], where these values come from the
         * {@link VisibleTileSetOptions}
         */
        this.levelOffset = 0;
        /**
         * If the tile should not be rendered, this is used typically when the tile in question
         * is completely covered by another tile and therefore can be skipped without any visual
         * impact. Setting this value directly affects the [[willRender]] method, unless
         * overriden by deriving classes.
         */
        this.skipRendering = false;
        /**
         * If the tile should not yet be rendered, this is used typically when the tile in question
         * does not fit into the gpu upload limit of the current frame.
         * Setting this value directly affects the [[willRender]] method, unless
         * overriden by deriving classes.
         */
        this.delayRendering = false;
        /**
         * The bounding box of this `Tile` in world coordinates.
         */
        this.m_boundingBox = new harp_geoutils_1.OrientedBox3();
        this.m_disposed = false;
        this.m_forceHasGeometry = undefined;
        // Used for {@link TextElement}s that are stored in the data, and that are placed explicitly,
        // fading in and out.
        this.m_textElementGroups = new TextElementGroupPriorityList_1.TextElementGroupPriorityList();
        // Blocks other labels from showing.
        this.m_pathBlockingElements = [];
        // Center of the tile's un-elevated bounding box world coordinates.
        this.m_worldCenter = new THREE.Vector3();
        this.m_visibleArea = 0;
        // Tile elevation range in meters
        this.m_elevationRange = { minElevation: 0, maxElevation: 0 };
        // List of owned textures for disposal
        this.m_ownedTextures = new WeakSet();
        this.geoBox = this.dataSource.getTilingScheme().getGeoBox(this.tileKey);
        this.updateBoundingBox();
        this.m_worldCenter.copy(this.boundingBox.position);
        this.m_localTangentSpace = localTangentSpace !== null && localTangentSpace !== void 0 ? localTangentSpace : false;
        this.m_textStyleCache = new TileTextStyleCache_1.TileTextStyleCache(this);
        this.m_offset = offset;
        this.m_uniqueKey = harp_geoutils_1.TileKeyUtils.getKeyForTileKeyAndOffset(this.tileKey, this.offset);
        if (dataSource.useGeometryLoader) {
            this.m_tileGeometryLoader = new TileGeometryLoader_1.TileGeometryLoader(this, this.mapView.taskQueue);
            this.attachGeometryLoadedCallback();
        }
    }
    /**
     * The visibility status of the {@link Tile}. It is actually
     * visible or planned to become visible.
     */
    get isVisible() {
        // Tiles are not evaluated as invisible until the second frame they aren't requested.
        // This happens in order to prevent that, during VisibleTileSet visibility evaluation,
        // visible tiles that haven't yet been evaluated for the current frame are preemptively
        // removed from [[DataSourceCache]].
        // There is cases when a tile was already removed from the MapView, i.e. the PolaCaps
        // Datasource might get remove on a change of projection, in this case
        // this.dataSource.mapView will throw an error
        try {
            return this.frameNumLastRequested >= this.dataSource.mapView.frameNumber - 1;
        }
        catch (error) {
            logger.debug(error);
            return false;
        }
    }
    /**
     * Sets the tile visibility status.
     * @param visible - `True` to mark the tile as visible, `False` otherwise.
     */
    set isVisible(visible) {
        this.frameNumLastRequested = visible ? this.dataSource.mapView.frameNumber : -1;
        if (!visible && this.m_tileGeometryLoader && !this.m_tileGeometryLoader.isSettled) {
            this.m_tileGeometryLoader.cancel();
        }
    }
    /**
     * The {@link @here/harp-geoutils#Projection} currently used by the {@link MapView}.
     */
    get projection() {
        return this.dataSource.projection;
    }
    /**
     * The {@link MapView} this `Tile` belongs to.
     */
    get mapView() {
        return this.dataSource.mapView;
    }
    /**
     * Whether the data of this tile is in local tangent space or not.
     *
     * @remarks
     * If the data is in local tangent space (i.e. up vector is (0,0,1) for high zoomlevels) then
     * {@link MapView} will rotate the objects before rendering using the rotation matrix of the
     * oriented [[boundingBox]].
     */
    get localTangentSpace() {
        return this.m_localTangentSpace;
    }
    /*
     * The size of this Tile in system memory.
     */
    get memoryUsage() {
        if (this.m_resourceInfo === undefined) {
            this.computeResourceInfo();
        }
        return this.m_resourceInfo.heapSize;
    }
    /**
     * The center of this `Tile` in world coordinates.
     */
    get center() {
        return this.m_worldCenter;
    }
    /**
     * Gets the key to uniquely represent this tile (based on
     * the {@link tileKey} and {@link offset}).
     *
     * @remarks
     * This key is only unique within the given {@link DataSource},
     * to get a key which is unique across
     * {@link DataSource}s see [[DataSourceCache.getKeyForTile]].
     */
    get uniqueKey() {
        return this.m_uniqueKey;
    }
    /**
     * The optional offset, this is an integer which represents what multiple of 360 degrees to
     * shift, only useful for flat projections, hence optional.
     */
    get offset() {
        return this.m_offset;
    }
    /**
     * The optional offset, this is an integer which represents what multiple of 360 degrees to
     * shift, only useful for flat projections, hence optional.
     * @param offset - Which multiple of 360 degrees to apply to the {@link Tile}.
     */
    set offset(offset) {
        if (this.m_offset !== offset) {
            this.m_uniqueKey = harp_geoutils_1.TileKeyUtils.getKeyForTileKeyAndOffset(this.tileKey, offset);
        }
        this.m_offset = offset;
    }
    /**
     * Compute {@link TileResourceInfo} of this `Tile`.
     *
     * @remarks
     * May be using a cached value. The method
     * `invalidateResourceInfo` can be called beforehand to force a recalculation.
     *
     * @returns `TileResourceInfo` for this `Tile`.
     */
    getResourceInfo() {
        if (this.m_resourceInfo === undefined) {
            this.computeResourceInfo();
        }
        return this.m_resourceInfo;
    }
    /**
     * Force invalidation of the cached {@link TileResourceInfo}.
     *
     * @remarks
     * Useful after the `Tile` has been
     * modified.
     */
    invalidateResourceInfo() {
        this.m_resourceInfo = undefined;
    }
    /**
     * Add ownership of a texture to this tile.
     *
     * @remarks
     * The texture will be disposed if the `Tile` is disposed.
     * @param texture - Texture to be owned by the `Tile`
     */
    addOwnedTexture(texture) {
        this.m_ownedTextures.add(texture);
    }
    /**
     * @internal
     * @deprecated User text elements are deprecated.
     *
     * Gets the list of developer-defined {@link TextElement} in this `Tile`.
     *
     * @remarks
     * This list is always rendered first.
     */
    get userTextElements() {
        let group = this.m_textElementGroups.groups.get(TextElement_1.TextElement.HIGHEST_PRIORITY);
        if (group === undefined) {
            group = new TextElementGroup_1.TextElementGroup(TextElement_1.TextElement.HIGHEST_PRIORITY);
            this.m_textElementGroups.groups.set(group.priority, group);
        }
        return group;
    }
    /**
     * Adds a developer-defined {@link TextElement} to this `Tile`.
     *
     * @remarks
     * The {@link TextElement} is always
     * visible, if it's in the map's currently visible area.
     *
     * @deprecated use [[addTextElement]].
     *
     * @param textElement - The Text element to add.
     */
    addUserTextElement(textElement) {
        textElement.priority = TextElement_1.TextElement.HIGHEST_PRIORITY;
        this.addTextElement(textElement);
    }
    /**
     * Removes a developer-defined {@link TextElement} from this `Tile`.
     *
     * @deprecated use `removeTextElement`.
     *
     * @param textElement - A developer-defined TextElement to remove.
     * @returns `true` if the element has been removed successfully; `false` otherwise.
     */
    removeUserTextElement(textElement) {
        textElement.priority = TextElement_1.TextElement.HIGHEST_PRIORITY;
        return this.removeTextElement(textElement);
    }
    /**
     * Adds a {@link TextElement} to this `Tile`, which is added to the visible set of
     * {@link TextElement}s based on the capacity and visibility.
     *
     * @remarks
     * The {@link TextElement}'s priority controls if or when it becomes visible.
     *
     * To ensure that a TextElement is visible, use a high value for its priority, such as
     * `TextElement.HIGHEST_PRIORITY`. Since the number of visible TextElements is limited by the
     * screen space, not all TextElements are visible at all times.
     *
     * @param textElement - The TextElement to add.
     */
    addTextElement(textElement) {
        this.textElementGroups.add(textElement);
        if (this.m_textElementsChanged === false) {
            // HARP-8733: Clone all groups so that they are handled as new element groups
            // by TextElementsRenderer and it doesn't try to reuse the same state stored
            // for the old groups.
            this.m_textElementGroups = this.textElementGroups.clone();
        }
        this.textElementsChanged = true;
    }
    /**
     * Adds a `PathBlockingElement` to this `Tile`.
     *
     * @remarks
     * This path has the highest priority and blocks
     * all other labels. There maybe in future a use case to give it a priority, but as that isn't
     * yet required, it is left to be implemented later if required.
     * @param blockingElement - Element which should block all other labels.
     */
    addBlockingElement(blockingElement) {
        this.m_pathBlockingElements.push(blockingElement);
    }
    /**
     * Removes a {@link TextElement} from this `Tile`.
     *
     * @remarks
     * For the element to be removed successfully, the
     * priority of the {@link TextElement} has to be equal to its priority when it was added.
     *
     * @param textElement - The TextElement to remove.
     * @returns `true` if the TextElement has been removed successfully; `false` otherwise.
     */
    removeTextElement(textElement) {
        const groups = this.textElementGroups;
        if (!groups.remove(textElement)) {
            return false;
        }
        if (this.m_textElementsChanged === false) {
            // HARP-8733: Clone all groups so that they are handled as new element groups
            // by TextElementsRenderer and it doesn't try to reuse the same state stored
            // for the old groups.
            this.m_textElementGroups = groups.clone();
        }
        this.textElementsChanged = true;
        return true;
    }
    /**
     * @internal
     *
     * Gets the current `GroupedPriorityList` which
     * contains a list of all {@link TextElement}s to be
     * selected and placed for rendering.
     */
    get textElementGroups() {
        return this.m_textElementGroups;
    }
    /**
     * Gets the current modification state for the list
     * of {@link TextElement}s in the `Tile`.
     *
     * @remarks
     * If the value is `true` the `TextElement` is placed for
     * rendering during the next frame.
     */
    get textElementsChanged() {
        var _a;
        return (_a = this.m_textElementsChanged) !== null && _a !== void 0 ? _a : false;
    }
    set textElementsChanged(changed) {
        this.m_textElementsChanged = changed;
    }
    /**
     * Returns true if the `Tile` has any text elements to render.
     */
    hasTextElements() {
        return this.m_textElementGroups.count() > 0;
    }
    /**
     * Get the current blocking elements.
     */
    get blockingElements() {
        return this.m_pathBlockingElements;
    }
    /**
     * Called before {@link MapView} starts rendering this `Tile`.
     *
     * @remarks
     * @param zoomLevel - The current zoom level.
     * @returns Returns `true` if this `Tile` should be rendered. Influenced directly by the
     *      `skipRendering` property unless specifically overriden in deriving classes.
     */
    willRender(_zoomLevel) {
        return !this.skipRendering && !this.delayRendering;
    }
    /**
     * Called after {@link MapView} has rendered this `Tile`.
     */
    didRender() {
        // to be overridden by subclasses
    }
    /**
     * Estimated visible area of tile used for sorting the priorities during loading.
     */
    get visibleArea() {
        return this.m_visibleArea;
    }
    set visibleArea(area) {
        this.m_visibleArea = area;
        if (this.tileLoader !== undefined) {
            this.tileLoader.priority = area;
        }
    }
    /**
     * @internal
     * Gets the tile's ground elevation range in meters.
     */
    get elevationRange() {
        return this.m_elevationRange;
    }
    /**
     * @internal
     * Sets the tile's ground elevation range in meters.
     *
     * @param elevationRange - The elevation range.
     */
    set elevationRange(elevationRange) {
        var _a;
        if (elevationRange.minElevation === this.m_elevationRange.minElevation &&
            elevationRange.maxElevation === this.m_elevationRange.maxElevation &&
            elevationRange.calculationStatus === this.m_elevationRange.calculationStatus) {
            return;
        }
        this.m_elevationRange.minElevation = elevationRange.minElevation;
        this.m_elevationRange.maxElevation = elevationRange.maxElevation;
        this.m_elevationRange.calculationStatus = elevationRange.calculationStatus;
        this.elevateGeoBox();
        // Only update bounding box if tile has already been decoded and a maximum/minimum geometry
        // height is provided by the data source.
        if (this.m_maxGeometryHeight !== undefined || this.m_minGeometryHeight !== undefined) {
            harp_utils_1.assert(((_a = this.decodedTile) === null || _a === void 0 ? void 0 : _a.boundingBox) === undefined);
            this.updateBoundingBox();
        }
    }
    /**
     * Gets the decoded tile; it is removed after geometry handling.
     */
    get decodedTile() {
        return this.m_decodedTile;
    }
    /**
     * Applies the decoded tile to the tile.
     *
     * @remarks
     * If the geometry is empty, then the tile's forceHasGeometry flag is set.
     * Map is updated.
     * @param decodedTile - The decoded tile to set.
     */
    set decodedTile(decodedTile) {
        var _a, _b;
        this.m_decodedTile = decodedTile;
        this.invalidateResourceInfo();
        if (decodedTile === undefined) {
            return;
        }
        if (decodedTile.geometries.length === 0) {
            this.forceHasGeometry(true);
        }
        // If the decoder provides a more accurate bounding box than the one we computed from
        // the flat geo box we take it instead. Otherwise, if an elevation range was set, elevate
        // bounding box to match the elevated geometry.
        this.m_maxGeometryHeight = decodedTile.boundingBox
            ? undefined
            : (_a = decodedTile.maxGeometryHeight) !== null && _a !== void 0 ? _a : 0;
        this.m_minGeometryHeight = decodedTile.boundingBox
            ? undefined
            : (_b = decodedTile.minGeometryHeight) !== null && _b !== void 0 ? _b : 0;
        this.elevateGeoBox();
        this.updateBoundingBox(decodedTile.boundingBox);
        const stats = Statistics_1.PerformanceStatistics.instance;
        if (stats.enabled && decodedTile.decodeTime !== undefined) {
            stats.currentFrame.addValue("decode.decodingTime", decodedTile.decodeTime);
            stats.currentFrame.addValue("decode.decodedTiles", 1);
        }
        if (decodedTile.copyrightHolderIds !== undefined) {
            this.copyrightInfo = decodedTile.copyrightHolderIds.map(id => ({ id }));
        }
        this.dataSource.requestUpdate();
    }
    /**
     * Called when the default implementation of `dispose()` needs
     * to free the geometry of a `Tile` object.
     *
     * @param object - The object that references the geometry.
     * @returns `true` if the geometry can be disposed.
     */
    shouldDisposeObjectGeometry(object) {
        return true;
    }
    /**
     * Called when the default implementation of `dispose()` needs
     * to free a `Tile` object's material.
     *
     * @param object - The object referencing the geometry.
     * @returns `true` if the material can be disposed.
     */
    shouldDisposeObjectMaterial(object) {
        return true;
    }
    /**
     * Called when the default implementation of `dispose()` needs
     * to free a Texture that is part of a `Tile` object's material.
     *
     * @param texture - The texture about to be disposed.
     * @returns `true` if the texture can be disposed.
     */
    shouldDisposeTexture(texture) {
        return this.m_ownedTextures.has(texture);
    }
    /**
     * Returns `true` if this `Tile` has been disposed.
     */
    get disposed() {
        return this.m_disposed;
    }
    /**
     * `True` if all geometry of the `Tile` has been loaded.
     */
    get allGeometryLoaded() {
        var _a, _b;
        return (_b = (_a = this.m_tileGeometryLoader) === null || _a === void 0 ? void 0 : _a.isFinished) !== null && _b !== void 0 ? _b : this.hasGeometry;
    }
    /**
     * MapView checks if this `Tile` is ready to be rendered while culling.
     *
     * By default, MapView checks if the [[objects]] list is not empty. However, you can override
     * this check by manually setting this property.
     */
    get hasGeometry() {
        if (this.m_forceHasGeometry === undefined) {
            return this.objects.length !== 0;
        }
        else {
            return this.m_forceHasGeometry;
        }
    }
    /**
     * Overrides the default value for [[hasGeometry]] if value is not `undefined`.
     *
     * @param value - A new value for the [[hasGeometry]] flag.
     */
    forceHasGeometry(value) {
        this.m_forceHasGeometry = value;
    }
    /**
     * Reset the visibility counter. This will force the visibility check to be rerun on all objects
     * in this `Tile`.
     */
    resetVisibilityCounter() {
        this.visibilityCounter = -1;
    }
    /**
     * Gets the {@link ITileLoader} that manages this tile.
     */
    get tileLoader() {
        return this.m_tileLoader;
    }
    /**
     * Sets the {@link ITileLoader} to manage this tile.
     *
     * @param tileLoader - A {@link ITileLoader} instance to manage
     *                     the loading process for this tile.
     */
    set tileLoader(tileLoader) {
        this.m_tileLoader = tileLoader;
    }
    /**
     * Loads this `Tile` geometry.
     *
     * @returns Promise which can be used to wait for the loading to be finished.
     */
    async load() {
        const tileLoader = this.tileLoader;
        if (tileLoader === undefined) {
            return await Promise.resolve();
        }
        if (this.m_tileGeometryLoader) {
            const wasSettled = this.m_tileGeometryLoader.isSettled;
            this.m_tileGeometryLoader.reset();
            if (wasSettled) {
                this.attachGeometryLoadedCallback();
            }
        }
        return await tileLoader
            .loadAndDecode()
            .then(tileLoaderState => {
            var _a;
            harp_utils_1.assert(tileLoaderState === ITileLoader_1.TileLoaderState.Ready);
            const decodedTile = tileLoader.decodedTile;
            this.decodedTile = decodedTile;
            (_a = decodedTile === null || decodedTile === void 0 ? void 0 : decodedTile.dependencies) === null || _a === void 0 ? void 0 : _a.forEach(mortonCode => {
                this.dependencies.push(harp_geoutils_1.TileKey.fromMortonCode(mortonCode));
            });
        })
            .catch(tileLoaderState => {
            if (tileLoaderState === ITileLoader_1.TileLoaderState.Failed) {
                this.dispose();
            }
            else if (tileLoaderState !== ITileLoader_1.TileLoaderState.Canceled) {
                logger.error("Unknown error" + tileLoaderState);
            }
        });
    }
    /**
     * Text style cache for this tile.
     * @hidden
     */
    get textStyleCache() {
        return this.m_textStyleCache;
    }
    /**
     * Frees the rendering resources allocated by this `Tile`.
     *
     * @remarks
     * The default implementation of this method frees the geometries and the materials for all the
     * reachable objects.
     * Textures are freed if they are owned by this `Tile` (i.e. if they where created by this
     * `Tile`or if the ownership was explicitely set to this `Tile` by [[addOwnedTexture]]).
     */
    clear() {
        const disposeMaterial = (material) => {
            Object.getOwnPropertyNames(material).forEach((property) => {
                const materialProperty = material[property];
                if (materialProperty !== undefined && materialProperty instanceof THREE.Texture) {
                    const texture = materialProperty;
                    if (this.shouldDisposeTexture(texture)) {
                        texture.dispose();
                    }
                }
            });
            material.dispose();
        };
        const disposeObject = (object) => {
            if (this.shouldDisposeObjectGeometry(object)) {
                if (object.geometry !== undefined) {
                    object.geometry.dispose();
                }
                if (object.geometries !== undefined) {
                    for (const geometry of object.geometries) {
                        geometry.dispose();
                    }
                }
            }
            if (object.material !== undefined && this.shouldDisposeObjectMaterial(object)) {
                if (object.material instanceof Array) {
                    object.material.forEach((material) => {
                        if (material !== undefined) {
                            disposeMaterial(material);
                        }
                    });
                }
                else {
                    disposeMaterial(object.material);
                }
            }
        };
        this.objects.forEach((rootObject) => {
            rootObject.traverse((object) => {
                disposeObject(object);
            });
            disposeObject(rootObject);
        });
        this.objects.length = 0;
        if (this.preparedTextPaths) {
            this.preparedTextPaths = [];
        }
        this.m_textStyleCache.clear();
        this.clearTextElements();
        this.invalidateResourceInfo();
    }
    /**
     * Removes all {@link TextElement} from the tile.
     */
    clearTextElements() {
        if (!this.hasTextElements()) {
            return;
        }
        this.textElementsChanged = true;
        this.m_pathBlockingElements.splice(0);
        this.textElementGroups.forEach((element) => {
            element.dispose();
        });
        this.textElementGroups.clear();
    }
    /**
     * Adds a callback that will be called whenever the tile is disposed.
     *
     * @remarks
     * Multiple callbacks may be added.
     * @internal
     * @param callback - The callback to be called when the tile is disposed.
     */
    addDisposeCallback(callback) {
        this.m_disposeCallback = harp_utils_1.chainCallbacks(this.m_disposeCallback, callback);
    }
    /**
     * Disposes this `Tile`, freeing all geometries and materials for the reachable objects.
     */
    dispose() {
        var _a;
        if (this.m_disposed) {
            return;
        }
        if (this.m_tileLoader) {
            this.m_tileLoader.cancel();
            this.m_tileLoader = undefined;
        }
        this.clear();
        // Ensure that tile is removable from tile cache.
        this.frameNumLastRequested = 0;
        this.m_disposed = true;
        (_a = this.m_tileGeometryLoader) === null || _a === void 0 ? void 0 : _a.dispose();
        if (this.m_disposeCallback) {
            this.m_disposeCallback(this);
        }
    }
    /**
     * Computes the offset in the x world coordinates corresponding to this tile, based on
     * its {@link offset}.
     *
     * @returns The x offset.
     */
    computeWorldOffsetX() {
        return this.projection.worldExtent(0, 0).max.x * this.offset;
    }
    /**
     * Update tile for current map view zoom level
     * @param zoomLevel - Zoom level of the map view
     * @internal
     */
    update(zoomLevel) {
        for (const object of this.objects) {
            if (object instanceof LodMesh_1.LodMesh) {
                object.setLevelOfDetail(zoomLevel - this.tileKey.level);
            }
        }
    }
    /**
     * Gets the tile's bounding box.
     */
    get boundingBox() {
        return this.m_boundingBox;
    }
    /**
     * Start with or continue with loading geometry for tiles requiring this step. Called
     * repeatedly until loading is finished.
     * @param priority - Priority assigned to asynchronous tasks doing the geometry update.
     * @param enabledKinds - {@link GeometryKind}s that will be created.
     * @param disabledKinds - {@link GeometryKind}s that will not be created.
     * @return `true` if tile uses a geometry loader, `false` otherwise.
     * @internal
     */
    updateGeometry(priority, enabledKinds, disabledKinds) {
        if (!this.m_tileGeometryLoader) {
            return false;
        }
        if (this.m_tileGeometryLoader.isSettled) {
            return true;
        }
        if (this.dataSource.isDetached()) {
            this.m_tileGeometryLoader.cancel();
            return true;
        }
        if (this.tileLoader) {
            if (!this.tileLoader.isFinished) {
                return true;
            }
            else if (!this.decodedTile) {
                // Finish loading if tile has no data.
                this.m_tileGeometryLoader.finish();
                return true;
            }
        }
        if (priority !== undefined) {
            this.m_tileGeometryLoader.priority = priority;
        }
        this.m_tileGeometryLoader.update(enabledKinds, disabledKinds);
        return true;
    }
    /**
     * Gets a set of the {@link GeometryKind}s that were loaded (if any).
     * @internal
     */
    get loadedGeometryKinds() {
        var _a;
        return (_a = this.m_tileGeometryLoader) === null || _a === void 0 ? void 0 : _a.availableGeometryKinds;
    }
    /**
     * Called when {@link TileGeometryLoader} is finished.
     *
     * @remarks
     * It may be used to add content to the `Tile`.
     * The {@link @here/harp-datasource-protocol#DecodedTile} is still available.
     */
    loadingFinished() {
        // To be used in subclasses.
    }
    attachGeometryLoadedCallback() {
        harp_utils_1.assert(this.m_tileGeometryLoader !== undefined);
        this.m_tileGeometryLoader.waitFinished()
            .then(() => {
            this.loadingFinished();
            this.removeDecodedTile();
        })
            .catch(() => {
            if (this.disposed) {
                return;
            }
            // Loader was canceled, dispose tile.
            if (!this.dataSource.isDetached()) {
                this.mapView.visibleTileSet.disposeTile(this);
            }
        });
    }
    /**
     * Remove the decodedTile when no longer needed.
     */
    removeDecodedTile() {
        this.m_decodedTile = undefined;
        this.invalidateResourceInfo();
    }
    /**
     * Updates the tile's world bounding box.
     * @param newBoundingBox - The new bounding box to set. If undefined, the bounding box will be
     *                         computed by projecting the tile's geoBox.
     */
    updateBoundingBox(newBoundingBox) {
        if (newBoundingBox) {
            this.m_boundingBox.copy(newBoundingBox);
            this.m_worldCenter.copy(this.boundingBox.position);
        }
        else {
            this.projection.projectBox(this.geoBox, this.boundingBox);
        }
    }
    /**
     * Elevates the tile's geo box using the elevation range and maximum geometry height.
     */
    elevateGeoBox() {
        var _a, _b;
        this.geoBox.southWest.altitude =
            this.m_elevationRange.minElevation + ((_a = this.m_minGeometryHeight) !== null && _a !== void 0 ? _a : 0);
        this.geoBox.northEast.altitude =
            this.m_elevationRange.maxElevation + ((_b = this.m_maxGeometryHeight) !== null && _b !== void 0 ? _b : 0);
    }
    computeResourceInfo() {
        let heapSize = 0;
        let num3dObjects = 0;
        let numTextElements = 0;
        const aggregatedObjSize = {
            heapSize: 0,
            gpuSize: 0
        };
        // Keep a map of the uuids of the larger objects, like Geometries, Materials and Attributes.
        // They should be counted only once even if they are shared.
        const visitedObjects = new Map();
        for (const object of this.objects) {
            if (object.visible) {
                num3dObjects++;
            }
            Object3DUtils_1.Object3DUtils.estimateSize(object, aggregatedObjSize, visitedObjects);
        }
        for (const group of this.textElementGroups.groups) {
            numTextElements += group[1].elements.length;
        }
        // 216 was the shallow size of a single TextElement last time it has been checked, 312 bytes
        // was the minimum retained size of a TextElement that was not being rendered. If a
        // TextElement is actually rendered, the size may be _much_ bigger.
        heapSize += numTextElements * 312;
        if (this.m_decodedTile !== undefined && this.m_decodedTile.tileInfo !== undefined) {
            aggregatedObjSize.heapSize += this.m_decodedTile.tileInfo.numBytes;
        }
        this.m_resourceInfo = {
            heapSize: aggregatedObjSize.heapSize + heapSize,
            gpuSize: aggregatedObjSize.gpuSize,
            num3dObjects,
            numTextElements,
            numUserTextElements: 0
        };
    }
}
exports.Tile = Tile;

export default exports
//# sourceMappingURL=Tile.js.map