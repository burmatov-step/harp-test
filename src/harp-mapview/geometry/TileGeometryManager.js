"use strict";
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.TileGeometryManager = void 0;
import * as harp_datasource_protocol_1 from "@here/harp-datasource-protocol"
import MapObjectAdapter_1 from "../MapObjectAdapter"
/**
 * Manages the content (the geometries) of a tile.
 * @internal
 */
class TileGeometryManager {
    /**
     * Creates an instance of `TileGeometryManager` with a reference to the {@link MapView}.
     */
    constructor(mapView) {
        this.mapView = mapView;
        /**
         * If set to `true`, the filters of enabled/disabledGeometryKinds are applied, otherwise they
         * are ignored.
         * @deprecated See {@link @here/here-datasource-protocol/BaseTechniqueParams.kind}.
         */
        this.enableFilterByKind = true;
        this.enabledKinds = new harp_datasource_protocol_1.GeometryKindSet();
        this.disabledKinds = new harp_datasource_protocol_1.GeometryKindSet();
        this.hiddenKinds = new harp_datasource_protocol_1.GeometryKindSet();
        /**
         * Optimization for evaluation in `update()` method. Only if a kind is hidden/unhidden, the
         * visibility of the kinds is applied to their geometries.
         */
        this.m_visibilityCounter = 1;
    }
    /**
     * The set of geometry kinds that is enabled. Their geometry will be created after decoding.
     * @deprecated See {@link @here/here-datasource-protocol/BaseTechniqueParams.kind}.
     */
    get enabledGeometryKinds() {
        return this.enabledKinds;
    }
    /**
     * @deprecated See {@link @here/here-datasource-protocol/BaseTechniqueParams.kind}.
     */
    set enabledGeometryKinds(kinds) {
        this.enabledKinds = kinds;
    }
    /**
     * The set of geometry kinds that is disabled. Their geometry will not be created after
     * decoding.
     * @deprecated See {@link @here/here-datasource-protocol/BaseTechniqueParams.kind}.
     */
    get disabledGeometryKinds() {
        return this.disabledKinds;
    }
    /**
     * @deprecated See {@link @here/here-datasource-protocol/BaseTechniqueParams.kind}.
     */
    set disabledGeometryKinds(kinds) {
        this.disabledKinds = kinds;
    }
    /**
     * The set of geometry kinds that is hidden. Their geometry may be created, but it is hidden
     * until the method `hideKind` with an argument of `addOrRemoveToHiddenSet:false` is called.
     * @deprecated See {@link @here/here-datasource-protocol/BaseTechniqueParams.kind}.
     */
    get hiddenGeometryKinds() {
        return this.hiddenKinds;
    }
    /**
     * @deprecated See {@link @here/here-datasource-protocol/BaseTechniqueParams.kind}.
     */
    set hiddenGeometryKinds(kinds) {
        this.hiddenKinds = kinds;
        this.incrementVisibilityCounter();
    }
    get visibilityCounter() {
        return this.m_visibilityCounter;
    }
    /**
     * Process the {@link Tile}s for rendering. May alter the content of the tile per frame.
     */
    updateTiles(tiles) {
        let prio = 0;
        for (const tile of tiles) {
            //this assumes the tiles are ordered by priority, this is currently done in
            // the visible tile set with 0 as the highest priority
            const tilePriority = prio++;
            const updateDone = tile.updateGeometry(tilePriority, this.enableFilterByKind ? this.enabledGeometryKinds : undefined, this.enableFilterByKind ? this.disabledGeometryKinds : undefined);
            if (updateDone && this.m_tileUpdateCallback) {
                this.m_tileUpdateCallback(tile);
            }
        }
        // If the visibility status of the kinds changed since the last update, the new visibility
        // status is applied (again).
        if (this.updateTileObjectVisibility(tiles)) {
            this.mapView.update();
        }
    }
    /**
     * Clear the enabled, disabled and hidden sets.
     */
    clear() {
        this.enabledKinds.clear();
        this.disabledKinds.clear();
        this.hiddenKinds.clear();
    }
    /**
     * Enable a [[GeometryKind]] by adding it to the enabled set, or remove it from that set.
     *
     * @param {(GeometryKind | GeometryKind[] | GeometryKindSet)} kind The kind to add or remove
     *      from the enabled set.
     * @param {boolean} addOrRemoveToEnabledSet Pass in `true` to add the kind to the set, pass in
     *      `false` to remove from that set.
     * @deprecated See {@link @here/here-datasource-protocol/BaseTechniqueParams.kind}.
     */
    enableKind(kind, addOrRemoveToEnabledSet = true) {
        this.enableDisableKinds(this.enabledKinds, kind, addOrRemoveToEnabledSet);
    }
    /**
     * Disable a [[GeometryKind]] by adding it to the disabled set, or remove it from that set.
     *
     * @param {(GeometryKind | GeometryKind[] | GeometryKindSet)} kind The kind to add or remove
     *      from the disabled set.
     * @param {boolean} addOrRemoveToHiddenSet Pass in `true` to add the kind to the set, pass in
     *      `false` to remove from that set.
     * @deprecated See {@link @here/here-datasource-protocol/BaseTechniqueParams.kind}.
     */
    disableKind(kind, addOrRemoveToDisabledSet = true) {
        this.enableDisableKinds(this.disabledKinds, kind, addOrRemoveToDisabledSet);
    }
    /**
     * Hide a [[GeometryKind]] by adding it to the hidden set, or remove it from that set.
     *
     * @param {(GeometryKind | GeometryKind[] | GeometryKindSet)} kind The kind to add or remove
     *      from the hidden set.
     * @param {boolean} addOrRemoveToHiddenSet Pass in `true` to hide the kind(s), `false` to show
     *      it again.
     * @deprecated See {@link @here/here-datasource-protocol/BaseTechniqueParams.kind}.
     */
    hideKind(kind, addOrRemoveToHiddenSet = true) {
        let visibilityHasChanged = false;
        if (Array.isArray(kind) || kind instanceof Set) {
            for (const oneKind of kind) {
                const visibilityChange = this.addRemove(this.hiddenKinds, oneKind, addOrRemoveToHiddenSet);
                visibilityHasChanged = visibilityHasChanged || visibilityChange;
            }
        }
        else {
            visibilityHasChanged = this.addRemove(this.hiddenKinds, kind, addOrRemoveToHiddenSet);
        }
        // Will be evaluated in the next update()
        if (visibilityHasChanged) {
            this.incrementVisibilityCounter();
        }
    }
    /**
     * Return all [[GeometryKind]]s that are contained in the tiles.
     *
     * @param {IterableIterator<Tile>} tiles The
     * @returns {GeometryKindSet}
     * @deprecated See {@link @here/here-datasource-protocol/BaseTechniqueParams.kind}.
     */
    getAvailableKinds(tiles) {
        const visibleKinds = new harp_datasource_protocol_1.GeometryKindSet();
        for (const tile of tiles) {
            const tileKinds = tile.loadedGeometryKinds;
            if (tileKinds !== undefined) {
                for (const kind of tileKinds) {
                    visibleKinds.add(kind);
                }
            }
        }
        return visibleKinds;
    }
    /**
     * Apply the visibility status taken from the `hiddenKinds` to all geometries in the specified
     * tiles.
     *
     * @param {Tile[]} tiles List of [[Tiles]] to process the visibility status of.
     */
    updateTileObjectVisibility(tiles) {
        let needUpdate = false;
        for (const tile of tiles) {
            if (tile.objects.length === 0 || tile.visibilityCounter === this.visibilityCounter) {
                continue;
            }
            tile.visibilityCounter = this.visibilityCounter;
            for (const object of tile.objects) {
                const objectAdapter = MapObjectAdapter_1.MapObjectAdapter.get(object);
                const geometryKind = objectAdapter === null || objectAdapter === void 0 ? void 0 : objectAdapter.kind;
                if (geometryKind !== undefined) {
                    const nowVisible = !geometryKind.some(kind => this.hiddenKinds.has(kind));
                    needUpdate = needUpdate || object.visible !== nowVisible;
                    object.visible = nowVisible;
                }
            }
        }
        return needUpdate;
    }
    /**
     * Sets a callback that will be called for every updated tile on [[updateTiles]].
     *
     * @param {TileUpdateCallback} callback The callback that will be called after a tile has been
     * updated, passing the updated tile as argument. If `undefined`, a previously set callback will
     * be cleared.
     */
    setTileUpdateCallback(callback) {
        this.m_tileUpdateCallback = callback;
    }
    incrementVisibilityCounter() {
        return ++this.m_visibilityCounter;
    }
    /**
     * Add or remove a kind|array of kinds|set of kinds from the specified kind set.
     *
     * @hidden
     * @param {GeometryKindSet} set
     * @param {(GeometryKind | GeometryKind[] | GeometryKindSet)} kind
     * @param {boolean} addToSet
     */
    enableDisableKinds(set, kind, addToSet) {
        if (Array.isArray(kind)) {
            for (const oneKind of kind) {
                this.addRemove(set, oneKind, addToSet);
            }
        }
        else if (kind instanceof Set) {
            const kindSet = kind;
            for (const oneKind of kindSet) {
                this.addRemove(set, oneKind, addToSet);
            }
        }
        else if (kind !== undefined) {
            this.addRemove(set, kind, addToSet);
        }
    }
    /**
     * Add or remove a single kind from the specified kind set.
     *
     * @hidden
     * @param {GeometryKindSet} set
     * @param {(GeometryKind | GeometryKind[] | GeometryKindSet)} kind
     * @param {boolean} addToSet
     */
    addRemove(kindsSet, kind, addToSet) {
        if (addToSet) {
            if (!kindsSet.has(kind)) {
                kindsSet.add(kind);
                return true;
            }
        }
        else {
            if (kindsSet.has(kind)) {
                kindsSet.delete(kind);
                return true;
            }
        }
        return false;
    }
}
exports.TileGeometryManager = TileGeometryManager;
//# sourceMappingURL=TileGeometryManager.js.map
export default exports