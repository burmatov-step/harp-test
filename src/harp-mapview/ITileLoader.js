"use strict";
/*
 * Copyright (C) 2020-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.TileLoaderState = void 0;
/**
 * The state the {@link ITileLoader}.
 */
var TileLoaderState;
(function (TileLoaderState) {
    TileLoaderState[TileLoaderState["Initialized"] = 0] = "Initialized";
    TileLoaderState[TileLoaderState["Loading"] = 1] = "Loading";
    TileLoaderState[TileLoaderState["Loaded"] = 2] = "Loaded";
    TileLoaderState[TileLoaderState["Decoding"] = 3] = "Decoding";
    TileLoaderState[TileLoaderState["Ready"] = 4] = "Ready";
    TileLoaderState[TileLoaderState["Canceled"] = 5] = "Canceled";
    TileLoaderState[TileLoaderState["Failed"] = 6] = "Failed";
})(TileLoaderState = exports.TileLoaderState || (exports.TileLoaderState = {}));
//# sourceMappingURL=ITileLoader.js.map

export default exports