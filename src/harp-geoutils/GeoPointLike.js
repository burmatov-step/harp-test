"use strict";
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.isGeoPointLike = void 0;
/**
 * Type guard to assert that `object` conforms to [[GeoPointLike]] interface.
 */
function isGeoPointLike(geoPoint) {
    if (Array.isArray(geoPoint)) {
        const [longitude, latitude, altitude] = geoPoint;
        return (typeof longitude === "number" &&
            typeof latitude === "number" &&
            (altitude === undefined || typeof altitude === "number"));
    }
    return false;
}
exports.isGeoPointLike = isGeoPointLike;
//# sourceMappingURL=GeoPointLike.js.map

export default exports