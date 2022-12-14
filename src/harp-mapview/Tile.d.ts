import { DecodedTile, GeometryKindSet, GeometryType, TextPathGeometry } from "@here/harp-datasource-protocol";
import { GeoBox, OrientedBox3, Projection, TileKey } from "@here/harp-geoutils";
import { CachedResource } from "@here/harp-utils";
import * as THREE from "three";
import { CopyrightInfo } from "./copyrights/CopyrightInfo";
import { DataSource } from "./DataSource";
import { ElevationRange } from "./ElevationRangeSource";
import { TileGeometryLoader } from "./geometry/TileGeometryLoader";
import { ITileLoader } from "./ITileLoader";
import { MapView } from "./MapView";
import { PathBlockingElement } from "./PathBlockingElement";
import { TextElement } from "./text/TextElement";
import { TextElementGroup } from "./text/TextElementGroup";
import { TextElementGroupPriorityList } from "./text/TextElementGroupPriorityList";
import { TileTextStyleCache } from "./text/TileTextStyleCache";
export declare type TileObject = THREE.Object3D & {
    /**
     * Distance of this object from the {@link Tile}'s center.
     */
    displacement?: THREE.Vector3;
};
/**
 * An interface for optional feature data that is saved in a `THREE.Object3D`'s `userData`
 * property.
 */
export interface TileFeatureData {
    /**
     * The original type of geometry.
     */
    geometryType?: GeometryType;
    /**
     * An optional array of sorted indices into geometry where the feature starts. The lists of IDs
     * and starting indices (starts) must have the same size.
     * Feature i starts at starts[i] and ends at starts[i+1]-1, except for the last feature, which
     * ends at the last index in the object's geometry.
     */
    starts?: number[];
    /**
     * An optional object containing properties defined by the developer. It has the same size as
     * the list of IDs and the starting indices (starts).
     */
    objInfos?: Array<{} | undefined>;
}
/**
 * Compute the memory footprint of `TileFeatureData`.
 *
 * @internal
 */
export declare function getFeatureDataSize(featureData: TileFeatureData): number;
/**
 * An object that contains information about resources used by a tile.
 */
export interface TileResourceUsage {
    /**
     * The estimated memory usage, in bytes.
     */
    estimatedMemoryUsage: number;
    /**
     * The amount of vertices used by a tile.
     */
    numVertices: number;
    /**
     * The amount of colors used by a tile.
     */
    numColors: number;
    /**
     * The amount of objects used by a tile.
     */
    numObjects: number;
    /**
     * The amount of geometries used by a tile.
     */
    numGeometries: number;
    /**
     * The amount of materials used by a tile.
     */
    numMaterials: number;
}
/**
 * Simple information about resource usage by the {@link Tile}.
 *
 * @remarks
 * Heap and GPU information are
 * estimations.
 */
export interface TileResourceInfo {
    /**
     * Estimated number of bytes used on the heap.
     */
    heapSize: number;
    /**
     * Estimated number of bytes used on the GPU.
     */
    gpuSize: number;
    /**
     * Number of [[THREE.Object3D]] in this tile.
     */
    num3dObjects: number;
    /**
     * Number of {@link TextElement}s in this tile.
     */
    numTextElements: number;
    /**
     * @deprecated This counter has been merged with numTextElements.
     * Number of user {@link TextElement}s in this tile.
     */
    numUserTextElements: number;
}
/**
 * @internal
 */
export interface TextElementIndex {
    groupIndex: number;
    elementIndex: number;
}
declare type TileCallback = (tile: Tile) => void;
/**
 * The class that holds the tiled data for a {@link DataSource}.
 */
export declare class Tile implements CachedResource {
    readonly dataSource: DataSource;
    readonly tileKey: TileKey;
    /**
     * A list of the THREE.js objects stored in this `Tile`.
     */
    readonly objects: TileObject[];
    /**
     * The optional list of HERE TileKeys of tiles with geometries that cross the boundaries of this
     * `Tile`.
     */
    readonly dependencies: TileKey[];
    /**
     * The bounding box of this `Tile` in geocoordinates.
     */
    readonly geoBox: GeoBox;
    /**
     * Copyright information of this `Tile`'s data.
     */
    copyrightInfo?: CopyrightInfo[];
    /**
     * Keeping some stats for the individual {@link Tile}s to analyze caching behavior.
     *
     * The frame the {@link Tile} was last requested. This is
     * required to know when the given {@link Tile}
     * can be removed from the cache.
     */
    frameNumLastRequested: number;
    /**
     * The frame the `Tile` was first visible.
     */
    frameNumVisible: number;
    /**
     * The last frame this `Tile` has been rendered (or was in the visible set). Used to determine
     * visibility of `Tile` at the end of a frame, if the number is the current frame number, it is
     * visible.
     */
    frameNumLastVisible: number;
    /**
     * After removing from cache, this is the number of frames the `Tile` was visible.
     */
    numFramesVisible: number;
    /**
     * Version stamp of the visibility set in the [[TileManager]]. If the counter is different, the
     * visibility of the Tile's objects has to be calculated. Optimization to reduce overhead of
     * computing visibility.
     */
    visibilityCounter: number;
    /**
     * @hidden
     *
     * Used to tell if the Tile is used temporarily as a fallback tile.
     *
     * levelOffset is in in the range [-quadTreeSearchDistanceUp,
     * quadTreeSearchDistanceDown], where these values come from the
     * {@link VisibleTileSetOptions}
     */
    levelOffset: number;
    /**
     * If the tile should not be rendered, this is used typically when the tile in question
     * is completely covered by another tile and therefore can be skipped without any visual
     * impact. Setting this value directly affects the [[willRender]] method, unless
     * overriden by deriving classes.
     */
    skipRendering: boolean;
    /**
     * If the tile should not yet be rendered, this is used typically when the tile in question
     * does not fit into the gpu upload limit of the current frame.
     * Setting this value directly affects the [[willRender]] method, unless
     * overriden by deriving classes.
     */
    delayRendering: boolean;
    /**
     * @hidden
     *
     * Prepared text geometries optimized for display.
     */
    protected preparedTextPaths: TextPathGeometry[] | undefined;
    protected readonly m_tileGeometryLoader?: TileGeometryLoader;
    /**
     * The bounding box of this `Tile` in world coordinates.
     */
    private readonly m_boundingBox;
    private m_disposed;
    private m_disposeCallback?;
    private readonly m_localTangentSpace;
    private m_forceHasGeometry;
    private m_tileLoader?;
    private m_decodedTile?;
    private m_textElementGroups;
    private readonly m_pathBlockingElements;
    private m_textElementsChanged;
    private readonly m_worldCenter;
    private m_visibleArea;
    private readonly m_elevationRange;
    private m_maxGeometryHeight?;
    private m_minGeometryHeight?;
    private m_resourceInfo;
    private readonly m_ownedTextures;
    private readonly m_textStyleCache;
    private m_uniqueKey;
    private m_offset;
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
    constructor(dataSource: DataSource, tileKey: TileKey, offset?: number, localTangentSpace?: boolean);
    /**
     * The visibility status of the {@link Tile}. It is actually
     * visible or planned to become visible.
     */
    get isVisible(): boolean;
    /**
     * Sets the tile visibility status.
     * @param visible - `True` to mark the tile as visible, `False` otherwise.
     */
    set isVisible(visible: boolean);
    /**
     * The {@link @here/harp-geoutils#Projection} currently used by the {@link MapView}.
     */
    get projection(): Projection;
    /**
     * The {@link MapView} this `Tile` belongs to.
     */
    get mapView(): MapView;
    /**
     * Whether the data of this tile is in local tangent space or not.
     *
     * @remarks
     * If the data is in local tangent space (i.e. up vector is (0,0,1) for high zoomlevels) then
     * {@link MapView} will rotate the objects before rendering using the rotation matrix of the
     * oriented [[boundingBox]].
     */
    get localTangentSpace(): boolean;
    get memoryUsage(): number;
    /**
     * The center of this `Tile` in world coordinates.
     */
    get center(): THREE.Vector3;
    /**
     * Gets the key to uniquely represent this tile (based on
     * the {@link tileKey} and {@link offset}).
     *
     * @remarks
     * This key is only unique within the given {@link DataSource},
     * to get a key which is unique across
     * {@link DataSource}s see [[DataSourceCache.getKeyForTile]].
     */
    get uniqueKey(): number;
    /**
     * The optional offset, this is an integer which represents what multiple of 360 degrees to
     * shift, only useful for flat projections, hence optional.
     */
    get offset(): number;
    /**
     * The optional offset, this is an integer which represents what multiple of 360 degrees to
     * shift, only useful for flat projections, hence optional.
     * @param offset - Which multiple of 360 degrees to apply to the {@link Tile}.
     */
    set offset(offset: number);
    /**
     * Compute {@link TileResourceInfo} of this `Tile`.
     *
     * @remarks
     * May be using a cached value. The method
     * `invalidateResourceInfo` can be called beforehand to force a recalculation.
     *
     * @returns `TileResourceInfo` for this `Tile`.
     */
    getResourceInfo(): TileResourceInfo;
    /**
     * Force invalidation of the cached {@link TileResourceInfo}.
     *
     * @remarks
     * Useful after the `Tile` has been
     * modified.
     */
    invalidateResourceInfo(): void;
    /**
     * Add ownership of a texture to this tile.
     *
     * @remarks
     * The texture will be disposed if the `Tile` is disposed.
     * @param texture - Texture to be owned by the `Tile`
     */
    addOwnedTexture(texture: THREE.Texture): void;
    /**
     * @internal
     * @deprecated User text elements are deprecated.
     *
     * Gets the list of developer-defined {@link TextElement} in this `Tile`.
     *
     * @remarks
     * This list is always rendered first.
     */
    get userTextElements(): TextElementGroup;
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
    addUserTextElement(textElement: TextElement): void;
    /**
     * Removes a developer-defined {@link TextElement} from this `Tile`.
     *
     * @deprecated use `removeTextElement`.
     *
     * @param textElement - A developer-defined TextElement to remove.
     * @returns `true` if the element has been removed successfully; `false` otherwise.
     */
    removeUserTextElement(textElement: TextElement): boolean;
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
    addTextElement(textElement: TextElement): void;
    /**
     * Adds a `PathBlockingElement` to this `Tile`.
     *
     * @remarks
     * This path has the highest priority and blocks
     * all other labels. There maybe in future a use case to give it a priority, but as that isn't
     * yet required, it is left to be implemented later if required.
     * @param blockingElement - Element which should block all other labels.
     */
    addBlockingElement(blockingElement: PathBlockingElement): void;
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
    removeTextElement(textElement: TextElement): boolean;
    /**
     * @internal
     *
     * Gets the current `GroupedPriorityList` which
     * contains a list of all {@link TextElement}s to be
     * selected and placed for rendering.
     */
    get textElementGroups(): TextElementGroupPriorityList;
    /**
     * Gets the current modification state for the list
     * of {@link TextElement}s in the `Tile`.
     *
     * @remarks
     * If the value is `true` the `TextElement` is placed for
     * rendering during the next frame.
     */
    get textElementsChanged(): boolean;
    set textElementsChanged(changed: boolean);
    /**
     * Returns true if the `Tile` has any text elements to render.
     */
    hasTextElements(): boolean;
    /**
     * Get the current blocking elements.
     */
    get blockingElements(): PathBlockingElement[];
    /**
     * Called before {@link MapView} starts rendering this `Tile`.
     *
     * @remarks
     * @param zoomLevel - The current zoom level.
     * @returns Returns `true` if this `Tile` should be rendered. Influenced directly by the
     *      `skipRendering` property unless specifically overriden in deriving classes.
     */
    willRender(_zoomLevel: number): boolean;
    /**
     * Called after {@link MapView} has rendered this `Tile`.
     */
    didRender(): void;
    /**
     * Estimated visible area of tile used for sorting the priorities during loading.
     */
    get visibleArea(): number;
    set visibleArea(area: number);
    /**
     * @internal
     * Gets the tile's ground elevation range in meters.
     */
    get elevationRange(): ElevationRange;
    /**
     * @internal
     * Sets the tile's ground elevation range in meters.
     *
     * @param elevationRange - The elevation range.
     */
    set elevationRange(elevationRange: ElevationRange);
    /**
     * Gets the decoded tile; it is removed after geometry handling.
     */
    get decodedTile(): DecodedTile | undefined;
    /**
     * Applies the decoded tile to the tile.
     *
     * @remarks
     * If the geometry is empty, then the tile's forceHasGeometry flag is set.
     * Map is updated.
     * @param decodedTile - The decoded tile to set.
     */
    set decodedTile(decodedTile: DecodedTile | undefined);
    /**
     * Called when the default implementation of `dispose()` needs
     * to free the geometry of a `Tile` object.
     *
     * @param object - The object that references the geometry.
     * @returns `true` if the geometry can be disposed.
     */
    shouldDisposeObjectGeometry(object: TileObject): boolean;
    /**
     * Called when the default implementation of `dispose()` needs
     * to free a `Tile` object's material.
     *
     * @param object - The object referencing the geometry.
     * @returns `true` if the material can be disposed.
     */
    shouldDisposeObjectMaterial(object: TileObject): boolean;
    /**
     * Called when the default implementation of `dispose()` needs
     * to free a Texture that is part of a `Tile` object's material.
     *
     * @param texture - The texture about to be disposed.
     * @returns `true` if the texture can be disposed.
     */
    shouldDisposeTexture(texture: THREE.Texture): boolean;
    /**
     * Returns `true` if this `Tile` has been disposed.
     */
    get disposed(): boolean;
    /**
     * `True` if all geometry of the `Tile` has been loaded.
     */
    get allGeometryLoaded(): boolean;
    /**
     * MapView checks if this `Tile` is ready to be rendered while culling.
     *
     * By default, MapView checks if the [[objects]] list is not empty. However, you can override
     * this check by manually setting this property.
     */
    get hasGeometry(): boolean;
    /**
     * Overrides the default value for [[hasGeometry]] if value is not `undefined`.
     *
     * @param value - A new value for the [[hasGeometry]] flag.
     */
    forceHasGeometry(value: boolean | undefined): void;
    /**
     * Reset the visibility counter. This will force the visibility check to be rerun on all objects
     * in this `Tile`.
     */
    resetVisibilityCounter(): void;
    /**
     * Gets the {@link ITileLoader} that manages this tile.
     */
    get tileLoader(): ITileLoader | undefined;
    /**
     * Sets the {@link ITileLoader} to manage this tile.
     *
     * @param tileLoader - A {@link ITileLoader} instance to manage
     *                     the loading process for this tile.
     */
    set tileLoader(tileLoader: ITileLoader | undefined);
    /**
     * Loads this `Tile` geometry.
     *
     * @returns Promise which can be used to wait for the loading to be finished.
     */
    load(): Promise<void>;
    /**
     * Text style cache for this tile.
     * @hidden
     */
    get textStyleCache(): TileTextStyleCache;
    /**
     * Frees the rendering resources allocated by this `Tile`.
     *
     * @remarks
     * The default implementation of this method frees the geometries and the materials for all the
     * reachable objects.
     * Textures are freed if they are owned by this `Tile` (i.e. if they where created by this
     * `Tile`or if the ownership was explicitely set to this `Tile` by [[addOwnedTexture]]).
     */
    clear(): void;
    /**
     * Removes all {@link TextElement} from the tile.
     */
    clearTextElements(): void;
    /**
     * Adds a callback that will be called whenever the tile is disposed.
     *
     * @remarks
     * Multiple callbacks may be added.
     * @internal
     * @param callback - The callback to be called when the tile is disposed.
     */
    addDisposeCallback(callback: TileCallback): void;
    /**
     * Disposes this `Tile`, freeing all geometries and materials for the reachable objects.
     */
    dispose(): void;
    /**
     * Computes the offset in the x world coordinates corresponding to this tile, based on
     * its {@link offset}.
     *
     * @returns The x offset.
     */
    computeWorldOffsetX(): number;
    /**
     * Update tile for current map view zoom level
     * @param zoomLevel - Zoom level of the map view
     * @internal
     */
    update(zoomLevel: number): void;
    /**
     * Gets the tile's bounding box.
     */
    get boundingBox(): OrientedBox3;
    /**
     * Start with or continue with loading geometry for tiles requiring this step. Called
     * repeatedly until loading is finished.
     * @param priority - Priority assigned to asynchronous tasks doing the geometry update.
     * @param enabledKinds - {@link GeometryKind}s that will be created.
     * @param disabledKinds - {@link GeometryKind}s that will not be created.
     * @return `true` if tile uses a geometry loader, `false` otherwise.
     * @internal
     */
    updateGeometry(priority?: number, enabledKinds?: GeometryKindSet, disabledKinds?: GeometryKindSet): boolean;
    /**
     * Gets a set of the {@link GeometryKind}s that were loaded (if any).
     * @internal
     */
    get loadedGeometryKinds(): GeometryKindSet | undefined;
    /**
     * Called when {@link TileGeometryLoader} is finished.
     *
     * @remarks
     * It may be used to add content to the `Tile`.
     * The {@link @here/harp-datasource-protocol#DecodedTile} is still available.
     */
    protected loadingFinished(): void;
    private attachGeometryLoadedCallback;
    /**
     * Remove the decodedTile when no longer needed.
     */
    private removeDecodedTile;
    /**
     * Updates the tile's world bounding box.
     * @param newBoundingBox - The new bounding box to set. If undefined, the bounding box will be
     *                         computed by projecting the tile's geoBox.
     */
    private updateBoundingBox;
    /**
     * Elevates the tile's geo box using the elevation range and maximum geometry height.
     */
    private elevateGeoBox;
    private computeResourceInfo;
}
export {};
//# sourceMappingURL=Tile.d.ts.map