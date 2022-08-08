"use strict";
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.BackgroundDataSource = void 0;
import * as harp_geoutils_1 from "@here/harp-geoutils"
import DataSource_1 from "./DataSource"
import AddGroundPlane_1 from "./geometry/AddGroundPlane"
import Tile_1 from "./Tile"
/**
 * Provides background geometry for all tiles.
 */
class BackgroundDataSource extends DataSource_1.DataSource {
    constructor() {
        super({ name: "background" });
        this.m_tilingScheme = BackgroundDataSource.DEFAULT_TILING_SCHEME;
        this.cacheable = true;
        this.addGroundPlane = true;
        this.enablePicking = false;
    }
    updateStorageLevelOffset() {
        let storageLevelOffset;
        this.mapView.dataSources.forEach(ds => {
            if (ds === this) {
                return;
            }
            const tilingScheme = ds.getTilingScheme();
            if (tilingScheme === this.m_tilingScheme) {
                storageLevelOffset =
                    storageLevelOffset === undefined
                        ? ds.storageLevelOffset
                        : Math.max(storageLevelOffset, ds.storageLevelOffset);
            }
        });
        if (storageLevelOffset === undefined) {
            storageLevelOffset = 0;
        }
        if (storageLevelOffset !== this.storageLevelOffset) {
            this.storageLevelOffset = storageLevelOffset;
            this.mapView.clearTileCache(this.name);
        }
    }
    /** @override */
    async setTheme(theme, languages) {
        this.mapView.clearTileCache(this.name);
    }
    setTilingScheme(tilingScheme) {
        const newScheme = tilingScheme !== null && tilingScheme !== void 0 ? tilingScheme : BackgroundDataSource.DEFAULT_TILING_SCHEME;
        if (newScheme === this.m_tilingScheme) {
            return;
        }
        this.m_tilingScheme = newScheme;
        this.updateStorageLevelOffset();
        this.mapView.clearTileCache(this.name);
    }
    /** @override */
    getTilingScheme() {
        return this.m_tilingScheme;
    }
    /** @override */
    getTile(tileKey) {
        const tile = new Tile_1.Tile(this, tileKey);
        tile.forceHasGeometry(true);
        AddGroundPlane_1.addGroundPlane(tile, BackgroundDataSource.GROUND_RENDER_ORDER);
        return tile;
    }
}
exports.BackgroundDataSource = BackgroundDataSource;
BackgroundDataSource.GROUND_RENDER_ORDER = Number.MIN_SAFE_INTEGER;
BackgroundDataSource.DEFAULT_TILING_SCHEME = harp_geoutils_1.webMercatorTilingScheme;
//# sourceMappingURL=BackgroundDataSource.js.map

export default exports