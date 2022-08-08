"use strict";
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.overlayOnElevation = exports.overlayTextElement = void 0;
import harp_datasource_protocol_1 from "@here/harp-datasource-protocol"
import harp_materials_1 from "@here/harp-materials"
import harp_utils_1 from "@here/harp-utils"
/**
 * Overlays the specified object's geometry on the elevation represented by the given displacement
 * map .
 *
 * @param object - The object to be overlaid.
 * @param displacementMap - Texture representing the elevation data used to overlay the object.
 */
function overlayObject(object, displacementMap) {
    if (!("material" in object)) {
        return;
    }
    const setDisplacementMap = harp_materials_1.setDisplacementMapToMaterial.bind(null, displacementMap);
    const material = object.material;
    if (Array.isArray(material)) {
        material.forEach(setDisplacementMap);
    }
    else if (material) {
        setDisplacementMap(material);
    }
}
/**
 * Overlays the specified coordinates on top of elevation data if available.
 *
 * @param worldCoords - World coordinates to overlay.
 * @param elevationProvider - Used to sample elevation data.
 * @param displacementMap - Elevation data to be sampled.
 * @param projection - Projection from geo to world space.
 * @returns `true` if the position was successfully overlaid, `false` otherwise (e.g. elevation
 * data not available).
 */
function overlayPosition(worldCoords, elevationProvider, displacementMap, projection) {
    // TODO: Move calculation of text element geoCoordinates to decoder.
    const geoCoords = projection.unprojectPoint(worldCoords);
    if (displacementMap.geoBox.contains(geoCoords)) {
        geoCoords.altitude = elevationProvider.sampleHeight(geoCoords, displacementMap);
    }
    else {
        geoCoords.altitude = elevationProvider.getHeight(geoCoords, displacementMap.tileKey.level);
        if (geoCoords.altitude === undefined) {
            return false;
        }
    }
    projection.projectPoint(geoCoords, worldCoords);
    return true;
}
/**
 * Overlays the specified coordinates on top of elevation data if available.
 *
 * @param path - World coordinates to overlay.
 * @param elevationProvider - Used to sample elevation data.
 * @param displacementMap - Elevation data to be sampled.
 * @param projection - Projection from geo to world space.
 * @returns `true` if the position was successfully overlaid, `false` otherwise (e.g. elevation
 * data not available).
 */
function overlayPath(path, elevationProvider, displacementMap, projection) {
    for (const position of path) {
        if (!overlayPosition(position, elevationProvider, displacementMap, projection)) {
            return false;
        }
    }
    return true;
}
/**
 * Overlays a text element on top of elevation data if available.
 *
 * @param textElement - The text element whose geometry will be overlaid.
 * @param elevationProvider -  Used to sample elevation data.
 * @param displacementMap - Elevation data to be sampled.
 * @param projection - Projection from geo to world space.
 */
function overlayTextElement(textElement, elevationProvider, displacementMap, projection) {
    harp_utils_1.assert(!textElement.elevated);
    if (!displacementMap) {
        return;
    }
    textElement.elevated = textElement.path
        ? overlayPath(textElement.path, elevationProvider, displacementMap, projection)
        : overlayPosition(textElement.position, elevationProvider, displacementMap, projection);
}
exports.overlayTextElement = overlayTextElement;
/**
 * Overlays the geometry in the given tile on top of elevation data if available. The tile's
 * elevation may be updated with a more precise range.
 *
 * @param tile - The tile whose geometry will be overlaid.
 */
function overlayOnElevation(tile) {
    const elevationProvider = tile.mapView.elevationProvider;
    if (elevationProvider === undefined || tile.objects.length === 0) {
        return;
    }
    const firstObject = tile.objects[0];
    if (!firstObject.userData ||
        !firstObject.userData.kind ||
        !firstObject.userData.kind.find((kind) => {
            return kind !== harp_datasource_protocol_1.GeometryKind.All && kind !== harp_datasource_protocol_1.GeometryKind.Terrain;
        })) {
        return;
    }
    const displacementMap = elevationProvider.getDisplacementMap(tile.tileKey);
    if (displacementMap === undefined) {
        return;
    }
    // TODO: HARP-8808 Apply displacement maps once per material.
    for (const object of tile.objects) {
        overlayObject(object, displacementMap.texture);
    }
}
exports.overlayOnElevation = overlayOnElevation;
//# sourceMappingURL=overlayOnElevation.js.map

export default exports