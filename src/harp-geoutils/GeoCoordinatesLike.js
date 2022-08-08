"use strict";
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.isGeoCoordinatesLike = void 0;
/**
 * Type guard to assert that `object` conforms to {@link GeoCoordinatesLike} data interface.
 */
function isGeoCoordinatesLike(object) {
    return (object &&
        typeof object.latitude === "number" &&
        typeof object.longitude === "number" &&
        (typeof object.altitude === "number" || typeof object.altitude === "undefined"));
}
exports.isGeoCoordinatesLike = isGeoCoordinatesLike;
//# sourceMappingURL=GeoCoordinatesLike.js.map
export default exports