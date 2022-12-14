"use strict";
/*
 * Copyright (C) 2020 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.TileTextStyleCache = void 0;
class TileTextStyleCache {
    constructor(tile) {
        this.textRenderStyles = [];
        this.textLayoutStyles = [];
        this.tile = tile;
    }
    clear() {
        this.textRenderStyles.length = 0;
        this.textLayoutStyles.length = 0;
    }
    getRenderStyle(technique) {
        let style = this.textRenderStyles[technique._index];
        if (style === undefined) {
            style = this.textRenderStyles[technique._index] = this.tile.mapView.textElementsRenderer.styleCache.createRenderStyle(this.tile, technique);
        }
        return style;
    }
    getLayoutStyle(technique) {
        let style = this.textLayoutStyles[technique._index];
        if (style === undefined) {
            style = this.textLayoutStyles[technique._index] = this.tile.mapView.textElementsRenderer.styleCache.createLayoutStyle(this.tile, technique);
        }
        return style;
    }
}
exports.TileTextStyleCache = TileTextStyleCache;

export default exports
//# sourceMappingURL=TileTextStyleCache.js.map