"use strict";
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {};
exports.isLatLngLike = void 0;
/**
 * Type guard to assert that `object` conforms to {@link LatLngLike} interface.
 */
function isLatLngLike(object) {
    return object && typeof object.lat === "number" && typeof object.lng === "number";
}
exports.isLatLngLike = isLatLngLike;
//# sourceMappingURL=LatLngLike.js.map
export default exports