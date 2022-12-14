"use strict";
let exports = {}
exports.DataSource = void 0;
import * as ExprPool_1 from "@here/harp-datasource-protocol/lib/ExprPool"
import * as harp_utils_1 from "@here/harp-utils"
import * as THREE from "three"
const logger = harp_utils_1.LoggerManager.instance.create("DataSource");
/**
 * Derive a class from `DataSource` to contribute data and geometries to the {@link MapView}.
 */
class DataSource extends THREE.EventDispatcher {
    /**
     * Constructs a new `DataSource`.
     *
     * @param options - The options to create the data source.
     */
    constructor(options = {}) {
        super();
        /**
         * Keep the update event here to avoid a global reference to the datasource (and thus prevent garbage collection).
         */
        this.UPDATE_EVENT = { type: "update" };
        /**
         * Set to `true` if this `DataSource` is enabled; `false` otherwise.
         */
        this.enabled = true;
        /**
         * Set to `true` if the {@link MapView} can cache tiles produced by this `DataSource`.
         */
        this.cacheable = false;
        /**
         * Set to `true` if the loader should be used to get the tile contents.
         */
        this.useGeometryLoader = false;
        /**
         * Whether the datasource should have a ground plane (this plane covers the tile entirely and
         * has the minimum possible renderOrder), this can be required in some cases when fallback
         * parent tiles need to be covered by the children, otherwise the content will overlap.
         * Default is false
         */
        this.addGroundPlane = false;
        /**
         * The minimum zoom level at which data is available.
         */
        this.minDataLevel = 1;
        /**
         * The maximum zoom level at which data is available.
         */
        this.maxDataLevel = 20;
        /**
         * The minimum zoom level at which {@link DataSource} is displayed.
         */
        this.minDisplayLevel = 1;
        /**
         * The maximum zoom level at which {@link DataSource} is displayed.
         */
        this.maxDisplayLevel = 20;
        this.allowOverlappingTiles = true;
        this.enablePicking = true;
        /**
         * Overrides the default rendering order of this `DataSource`.
         *
         * @remarks
         * When `dataSourceOrder` is defined, all the objects created by this `DataSource`
         * will be rendered on top of the objects created by other `DataSource`s with
         * lower `dataSourceOrder` values.
         *
         * @defaultValue undefined
         */
        this.dataSourceOrder = 0;
        /**
         * @internal
         * @hidden
         */
        this.exprPool = new ExprPool_1.ExprPool();
        /**
         * Current value of [[maxGeometryHeight]] property.
         */
        this.m_maxGeometryHeight = 0;
        /**
         * Current value of [[minGeometryHeight]] property.
         */
        this.m_minGeometryHeight = 0;
        /**
         * Storage level offset applied to this `DataSource`.
         */
        this.m_storageLevelOffset = 0;
        this.m_featureStateMap = new Map();
        let { name } = options;
        const { styleSetName, languages, minZoomLevel, maxZoomLevel, minDataLevel, maxDataLevel, minDisplayLevel, maxDisplayLevel, storageLevelOffset, allowOverlappingTiles, enablePicking, minGeometryHeight, maxGeometryHeight, dataSourceOrder } = options;
        if (name === undefined || name.length === 0) {
            name = `anonymous-datasource#${++DataSource.uniqueNameCounter}`;
        }
        this.name = name;
        this.styleSetName = styleSetName;
        if (languages !== undefined) {
            this.languages = languages;
        }
        if (minDataLevel !== undefined) {
            this.minDataLevel = minDataLevel;
        }
        if (maxDataLevel !== undefined) {
            this.maxDataLevel = maxDataLevel;
        }
        if (minZoomLevel !== undefined) {
            this.minZoomLevel = minZoomLevel;
        }
        if (maxZoomLevel !== undefined) {
            this.maxZoomLevel = maxZoomLevel;
        }
        if (minDisplayLevel !== undefined) {
            this.minDisplayLevel = minDisplayLevel;
        }
        if (maxDisplayLevel !== undefined) {
            this.maxDisplayLevel = maxDisplayLevel;
        }
        if (storageLevelOffset !== undefined) {
            this.m_storageLevelOffset = storageLevelOffset;
        }
        if (allowOverlappingTiles !== undefined) {
            this.allowOverlappingTiles = allowOverlappingTiles;
        }
        if (enablePicking !== undefined) {
            this.enablePicking = enablePicking;
        }
        if (minGeometryHeight !== undefined) {
            this.minGeometryHeight = minGeometryHeight;
        }
        if (maxGeometryHeight !== undefined) {
            this.maxGeometryHeight = maxGeometryHeight;
        }
        if (dataSourceOrder) {
            this.dataSourceOrder = dataSourceOrder;
        }
    }
    /**
     * Gets the state of the given feature id.
     *
     * @param featureId - The id of the feature. Id numbers are deprecated in favor of strings.
     */
    getFeatureState(featureId) {
        return this.m_featureStateMap.get(featureId);
    }
    /**
     * Clears the state of all the features of this {@link DataSource}.
     */
    clearFeatureState() {
        this.m_featureStateMap.clear();
    }
    /**
     * Sets the state of the given feature id.
     *
     * ```typescript
     * dataSource.setFeatureState(featureId, { enabled: true });
     * ```
     *
     * @param featureId - The id of the feature. Id numbers are deprecated in favor of strings.
     * @param state - The new state of the feature.
     */
    setFeatureState(featureId, state) {
        this.m_featureStateMap.set(featureId, state);
    }
    /**
     * Removes the state associated to the given feature.
     *
     * @param featureId - The id of the feature. Id numbers are deprecated in favor of strings.
     */
    removeFeatureState(featureId) {
        this.m_featureStateMap.delete(featureId);
    }
    /**
     * Returns the name of the [[StyleSet]] to use for the decoding.
     */
    get styleSetName() {
        return this.m_styleSetName;
    }
    /**
     * Sets the name of the [[StyleSet]] to use for the decoding.
     * If this {@link DataSource} is already
     * attached to a {@link MapView}, this setter then reapplies
     * [[StyleSet]] with this name found in
     * {@link MapView}s theme.
     */
    set styleSetName(styleSetName) {
        if (styleSetName !== this.m_styleSetName) {
            this.m_styleSetName = styleSetName;
            this.clearCache();
            this.requestUpdate();
        }
    }
    /**
     * Destroys this `DataSource`.
     */
    dispose() {
        // to be overloaded by subclasses
    }
    /**
     * Purges all the caching done by this `DataSource`
     */
    clearCache() {
        // to be overloaded by subclasses
    }
    /**
     * Boolean which says whether a {@link DataSource} produces
     * tiles that fully cover the tile, i.e.
     * tiles underneath are completely hidden. Must be
     * overridden for {@link DataSource}'s that don't
     * have a ground plane, but which still fully
     * cover the tile, e.g. web tiles.
     */
    isFullyCovering() {
        return this.addGroundPlane;
    }
    /**
     * Returns `true` if this `DataSource` is ready
     * and the {@link MapView} can invoke `getTile()` to
     * start requesting data.
     */
    ready() {
        return true;
    }
    /**
     * The {@link MapView} that is holding this `DataSource`.
     */
    get mapView() {
        if (this.m_mapView === undefined) {
            throw new Error("This DataSource was not added to MapView");
        }
        return this.m_mapView;
    }
    /**
     * The {@link @here/harp-geoutils#Projection} used by
     * the {@link MapView} that is holding this `DataSource`.
     *
     * An `Error` is thrown if you call this method
     * before this `DataSource` has been added
     * to a {@link MapView}.
     */
    get projection() {
        return this.mapView.projection;
    }
    /**
     * This method is called when the `DataSource` is added to a {@link MapView}. Override this
     * method to provide any custom initialization, such as, to establish a network connection,
     * or to initialize complex data structures.
     */
    async connect() {
        // to be overloaded by subclasses
    }
    /**
     * This method is called when this `DataSource` is added to a {@link MapView}.
     *
     * Overrides of this method must invoke the definition of the super class.
     *
     * @param mapView - The instance of the {@link MapView}.
     */
    attach(mapView) {
        this.m_mapView = mapView;
    }
    /**
     * This method is called when this `DataSource` is removed from a {@link MapView}.
     *
     * Overrides of this method must invoke the definition of the super class.
     *
     * @param mapView - The instance of the {@link MapView}.
     */
    detach(mapView) {
        harp_utils_1.assert(this.m_mapView === mapView);
        this.m_mapView = undefined;
    }
    /**
     * @return Whether this `DataSource` is detached from the `MapView`
     */
    isDetached() {
        return this.m_mapView === undefined;
    }
    /**
     * Apply the {@link @here/harp-datasource-protocol#Theme} to this data source.
     *
     * If `DataSource` depends on a `styleSet` defined by this theme or `languages`, it must update
     * its tiles' geometry.
     *
     * @param theme - The Theme to be applied
     * @param languages - optional: The languages in priority order to be applied
     *
     * @deprecated use setTheme( Theme | FlatTheme) and setLanguages(string[]) instead
     */
    async setTheme(theme, languages) {
        // to be overwritten by subclasses
    }
    /**
     * Used to configure the languages used by the `DataSource` according to priority;
     * the first language in the array has the highest priority.
     *
     * @param languages - An array of ISO 639-1 language codes.
     */
    setLanguages(languages) {
        this.languages = languages;
        // to be overloaded by subclasses
    }
    /**
     * Used to express different country point of view (political view).
     *
     * @note Set to `undefined` (or empty string) if you want to reset to default point of view.
     * @param pov - The country code which point of view should be presented in lower-case
     * ISO 3166-1 alpha-2 format.
     */
    setPoliticalView(pov) {
        // to be overloaded by subclasses
    }
    /**
     * This method is called by {@link MapView} before the
     * tile needs to be updated, for example after
     * a theme change.
     *
     * @param tile - The {@link Tile} to update.
     */
    updateTile(tile) {
        // to be overloaded by subclasses
    }
    /**
     * This method is called by the {@link MapView} to determine if the content of the surrounding
     * tiles must be preloaded.
     *
     * @returns `true` if the {@link MapView} should try to preload tiles surrounding the visible
     * tiles; `false` otherwise. The default is `false`.
     */
    shouldPreloadTiles() {
        return false;
    }
    /**
     * The minimum zoom level at which data is available or displayed at
     * (depending on {@link DataSource} subclass).
     * @deprecated Use [[minDataLevel]] and [[minDisplayLevel]] instead.
     */
    get minZoomLevel() {
        logger.warn("DataSource.minZoomLevel is deprecated. Use minDataLevel and maxDataLevel instead.");
        return this.minDataLevel;
    }
    set minZoomLevel(level) {
        logger.warn("DataSource.minZoomLevel is deprecated. Use minDataLevel and minDisplayLevel instead.");
        this.minDataLevel = level;
    }
    /**
     * The maximum zoom level at which data is available or displayed at
     * (depending on {@link DataSource} subclass).
     * @deprecated Use [[maxDataLevel]] and [[maxDisplayLevel]] instead.
     */
    get maxZoomLevel() {
        logger.warn("DataSource.maxZoomLevel is deprecated. Use maxDataLevel and maxDisplayLevel instead.");
        return this.maxDataLevel;
    }
    set maxZoomLevel(level) {
        logger.warn("DataSource.maxZoomLevel is deprecated. Use maxDataLevel and maxDisplayLevel instead.");
        this.maxDataLevel = level;
    }
    /**
     * Maximum geometry height above ground level this `DataSource` can produce.
     *
     * Used in first stage of frustum culling before
     * {@link Tile.maxGeometryHeight} data is available.
     *
     * @default 0.
     */
    get maxGeometryHeight() {
        return this.m_maxGeometryHeight;
    }
    set maxGeometryHeight(value) {
        this.m_maxGeometryHeight = value;
    }
    /**
     * Minimum geometry height below ground level this `DataSource` can produce. A negative number
     * specifies a value below ground level.
     *
     * Used in first stage of frustum culling before
     * {@link Tile.minGeometryHeight} data is available.
     *
     * @default 0.
     */
    get minGeometryHeight() {
        return this.m_minGeometryHeight;
    }
    set minGeometryHeight(value) {
        this.m_minGeometryHeight = value;
    }
    /**
     * The difference between storage level and display level of tile.
     *
     * Storage level offset is a value applied (added) to current zoom level giving
     * a final tile level being displayed. This way we may differentiate current
     * zoom level from the storage level that is displayed, giving fine grained
     * control over the tiles being decoded an displayed.
     */
    get storageLevelOffset() {
        return this.m_storageLevelOffset;
    }
    /**
     * Setup the relative offset between storage level and display level of tile.
     *
     * @param levelOffset - Difference between zoom level and display level.
     */
    set storageLevelOffset(levelOffset) {
        this.m_storageLevelOffset = levelOffset;
    }
    /**
     * Enables or disables overlay of geometry on elevation. It must be overloaded by data sources
     * supporting this feature.
     *
     * @param value - True to enable, false to disable.
     */
    setEnableElevationOverlay(enable) {
        // to be overloaded by subclasses
    }
    /**
     * Computes the data zoom level to use.
     *
     * @param zoomLevel - The zoom level of the {@link MapView}.
     * @returns The data zoom level to use.
     */
    getDataZoomLevel(zoomLevel) {
        return THREE.MathUtils.clamp(zoomLevel + this.m_storageLevelOffset, this.minDataLevel, this.maxDataLevel);
    }
    /**
     * Returns `true` if {@link DataSource} should be displayed for the zoom level.
     * @param zoomLevel - The zoom level of the {@link MapView}.
     */
    isVisible(zoomLevel) {
        return zoomLevel >= this.minDisplayLevel && zoomLevel <= this.maxDisplayLevel;
    }
    /**
     * Returns `true` if {@link DataSource} can load tile with
     * given {@link @here/harp-geoutils#TileKey} and zoom level.
     *
     * @param zoomLevel - The zoom level of the {@link MapView}.
     * @param tileKey - The unique identifier for a map tile.
     * @returns `true` if the tile for the given {@link @here/harp-geoutils#TileKey} can be loaded.
     */
    canGetTile(zoomLevel, tileKey) {
        return tileKey.level <= zoomLevel;
    }
    /**
     * Returns `true` if {@link MapView} should traverse tiles
     * further with given {@link @here/harp-geoutils#TileKey} and
     * zoom level.
     *
     * @param zoomLevel - The zoom level of the {@link MapView}.
     * @param tileKey - The unique identifier for a map tile.
     * @returns `true` if the subtiles of the given {@link @here/harp-geoutils#TileKey} should be
     * checked for collisions.
     */
    shouldSubdivide(zoomLevel, tileKey) {
        return tileKey.level <= zoomLevel;
    }
    /**
     * Returns `true` if {@link MapView} should render the text
     * elements with the given {@link @here/harp-geoutils#TileKey} and
     * zoom level.
     *
     * @remarks
     * This is an additional check for the tiles that are already selected for rendering so the
     * default implementation returns `true`.
     *
     * @param zoomLevel - The zoom level.
     * @param tileKey - The unique identifier for a map tile.
     * @returns `true` if the text elements created for the
     *          given {@link @here/harp-geoutils#TileKey} should be rendered.
     */
    shouldRenderText(zoomLevel, tileKey) {
        return true;
    }
    /**
     * Sends a request to the {@link MapView} to redraw the scene.
     */
    requestUpdate() {
        this.dispatchEvent(this.UPDATE_EVENT);
    }
}
exports.DataSource = DataSource;
/**
 * A counter to generate unique names for each `DataSource`, if no name is provided in the
 * constructor.
 */
DataSource.uniqueNameCounter = 0;
//# sourceMappingURL=DataSource.js.map

export default exports