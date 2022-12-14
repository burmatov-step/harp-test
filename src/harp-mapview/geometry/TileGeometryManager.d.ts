import { GeometryKind, GeometryKindSet } from "@here/harp-datasource-protocol";
import { MapView } from "../MapView";
import { Tile } from "../Tile";
declare type TileUpdateCallback = (tile: Tile) => void;
/**
 * Manages the content (the geometries) of a tile.
 * @internal
 */
export declare class TileGeometryManager {
    protected mapView: MapView;
    /**
     * The set of geometry kinds that is enabled. Their geometry will be created after decoding.
     * @deprecated See {@link @here/here-datasource-protocol/BaseTechniqueParams.kind}.
     */
    get enabledGeometryKinds(): GeometryKindSet;
    /**
     * @deprecated See {@link @here/here-datasource-protocol/BaseTechniqueParams.kind}.
     */
    set enabledGeometryKinds(kinds: GeometryKindSet);
    /**
     * The set of geometry kinds that is disabled. Their geometry will not be created after
     * decoding.
     * @deprecated See {@link @here/here-datasource-protocol/BaseTechniqueParams.kind}.
     */
    get disabledGeometryKinds(): GeometryKindSet;
    /**
     * @deprecated See {@link @here/here-datasource-protocol/BaseTechniqueParams.kind}.
     */
    set disabledGeometryKinds(kinds: GeometryKindSet);
    /**
     * The set of geometry kinds that is hidden. Their geometry may be created, but it is hidden
     * until the method `hideKind` with an argument of `addOrRemoveToHiddenSet:false` is called.
     * @deprecated See {@link @here/here-datasource-protocol/BaseTechniqueParams.kind}.
     */
    get hiddenGeometryKinds(): GeometryKindSet;
    /**
     * @deprecated See {@link @here/here-datasource-protocol/BaseTechniqueParams.kind}.
     */
    set hiddenGeometryKinds(kinds: GeometryKindSet);
    /**
     * If set to `true`, the filters of enabled/disabledGeometryKinds are applied, otherwise they
     * are ignored.
     * @deprecated See {@link @here/here-datasource-protocol/BaseTechniqueParams.kind}.
     */
    enableFilterByKind: boolean;
    protected get visibilityCounter(): number;
    protected enabledKinds: GeometryKindSet;
    protected disabledKinds: GeometryKindSet;
    protected hiddenKinds: GeometryKindSet;
    protected m_tileUpdateCallback: TileUpdateCallback | undefined;
    /**
     * Optimization for evaluation in `update()` method. Only if a kind is hidden/unhidden, the
     * visibility of the kinds is applied to their geometries.
     */
    private m_visibilityCounter;
    /**
     * Creates an instance of `TileGeometryManager` with a reference to the {@link MapView}.
     */
    constructor(mapView: MapView);
    /**
     * Process the {@link Tile}s for rendering. May alter the content of the tile per frame.
     */
    updateTiles(tiles: Tile[]): void;
    /**
     * Clear the enabled, disabled and hidden sets.
     */
    clear(): void;
    /**
     * Enable a [[GeometryKind]] by adding it to the enabled set, or remove it from that set.
     *
     * @param {(GeometryKind | GeometryKind[] | GeometryKindSet)} kind The kind to add or remove
     *      from the enabled set.
     * @param {boolean} addOrRemoveToEnabledSet Pass in `true` to add the kind to the set, pass in
     *      `false` to remove from that set.
     * @deprecated See {@link @here/here-datasource-protocol/BaseTechniqueParams.kind}.
     */
    enableKind(kind: GeometryKind | GeometryKind[] | GeometryKindSet, addOrRemoveToEnabledSet?: boolean): void;
    /**
     * Disable a [[GeometryKind]] by adding it to the disabled set, or remove it from that set.
     *
     * @param {(GeometryKind | GeometryKind[] | GeometryKindSet)} kind The kind to add or remove
     *      from the disabled set.
     * @param {boolean} addOrRemoveToHiddenSet Pass in `true` to add the kind to the set, pass in
     *      `false` to remove from that set.
     * @deprecated See {@link @here/here-datasource-protocol/BaseTechniqueParams.kind}.
     */
    disableKind(kind: GeometryKind | GeometryKind[] | GeometryKindSet, addOrRemoveToDisabledSet?: boolean): void;
    /**
     * Hide a [[GeometryKind]] by adding it to the hidden set, or remove it from that set.
     *
     * @param {(GeometryKind | GeometryKind[] | GeometryKindSet)} kind The kind to add or remove
     *      from the hidden set.
     * @param {boolean} addOrRemoveToHiddenSet Pass in `true` to hide the kind(s), `false` to show
     *      it again.
     * @deprecated See {@link @here/here-datasource-protocol/BaseTechniqueParams.kind}.
     */
    hideKind(kind: GeometryKind | GeometryKind[] | GeometryKindSet, addOrRemoveToHiddenSet?: boolean): void;
    /**
     * Return all [[GeometryKind]]s that are contained in the tiles.
     *
     * @param {IterableIterator<Tile>} tiles The
     * @returns {GeometryKindSet}
     * @deprecated See {@link @here/here-datasource-protocol/BaseTechniqueParams.kind}.
     */
    getAvailableKinds(tiles: IterableIterator<Tile>): GeometryKindSet;
    /**
     * Apply the visibility status taken from the `hiddenKinds` to all geometries in the specified
     * tiles.
     *
     * @param {Tile[]} tiles List of [[Tiles]] to process the visibility status of.
     */
    updateTileObjectVisibility(tiles: Tile[]): boolean;
    /**
     * Sets a callback that will be called for every updated tile on [[updateTiles]].
     *
     * @param {TileUpdateCallback} callback The callback that will be called after a tile has been
     * updated, passing the updated tile as argument. If `undefined`, a previously set callback will
     * be cleared.
     */
    setTileUpdateCallback(callback?: TileUpdateCallback): void;
    protected incrementVisibilityCounter(): number;
    /**
     * Add or remove a kind|array of kinds|set of kinds from the specified kind set.
     *
     * @hidden
     * @param {GeometryKindSet} set
     * @param {(GeometryKind | GeometryKind[] | GeometryKindSet)} kind
     * @param {boolean} addToSet
     */
    private enableDisableKinds;
    /**
     * Add or remove a single kind from the specified kind set.
     *
     * @hidden
     * @param {GeometryKindSet} set
     * @param {(GeometryKind | GeometryKind[] | GeometryKindSet)} kind
     * @param {boolean} addToSet
     */
    private addRemove;
}
export {};
//# sourceMappingURL=TileGeometryManager.d.ts.map