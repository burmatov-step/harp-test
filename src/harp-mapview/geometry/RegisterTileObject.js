"use strict";
/*
 * Copyright (C) 2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.registerTileObject = void 0;
import MapObjectAdapter_1 from "../MapObjectAdapter"
/**
 * Adds a THREE object to the root of the tile and register [[MapObjectAdapter]].
 *
 * Sets the owning tiles datasource.name and the `tileKey` in the `userData` property of the
 * object, such that the tile it belongs to can be identified during picking.
 *
 * @param tile - The {@link Tile} to add the object to.
 * @param object - The object to add to the root of the tile.
 * @param geometryKind - The kind of object. Can be used for filtering.
 * @param mapAdapterParams - additional parameters for [[MapObjectAdapter]]
 */
function registerTileObject(tile, object, geometryKind, mapAdapterParams) {
    const kind = geometryKind instanceof Set
        ? Array.from(geometryKind.values())
        : Array.isArray(geometryKind)
            ? geometryKind
            : [geometryKind];
    MapObjectAdapter_1.MapObjectAdapter.create(object, Object.assign({ dataSource: tile.dataSource, kind, level: tile.tileKey.level }, mapAdapterParams));
    // TODO legacy fields, encoded directly in `userData to be removed
    if (object.userData === undefined) {
        object.userData = {};
    }
    const userData = object.userData;
    userData.tileKey = tile.tileKey;
    userData.dataSource = tile.dataSource.name;
    userData.kind = kind;
    // Force a visibility check of all objects.
    tile.resetVisibilityCounter();
}
exports.registerTileObject = registerTileObject;
export default exports
//# sourceMappingURL=RegisterTileObject.js.map