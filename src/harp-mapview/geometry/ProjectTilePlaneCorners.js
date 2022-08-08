"use strict";
/*
 * Copyright (C) 2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.projectTilePlaneCorners = void 0;
import * as harp_geoutils_1  from "@here/harp-geoutils"
import * as THREE  from "three"
/**
 * Returns the corners of the tile's geo bounding box projected using a given projection.
 * @param tile - The tile whose corners will be projected.
 * @param projection - The projection to be used.
 * @returns The projected tile corners.
 * @internal
 * @hidden
 */
function projectTilePlaneCorners(tile, projection) {
    const { east, west, north, south } = tile.geoBox;
    const sw = projection.projectPoint(new harp_geoutils_1.GeoCoordinates(south, west), new THREE.Vector3());
    const se = projection.projectPoint(new harp_geoutils_1.GeoCoordinates(south, east), new THREE.Vector3());
    const nw = projection.projectPoint(new harp_geoutils_1.GeoCoordinates(north, west), new THREE.Vector3());
    const ne = projection.projectPoint(new harp_geoutils_1.GeoCoordinates(north, east), new THREE.Vector3());
    return { sw, se, nw, ne };
}
exports.projectTilePlaneCorners = projectTilePlaneCorners;

export default exports
//# sourceMappingURL=ProjectTilePlaneCorners.js.map