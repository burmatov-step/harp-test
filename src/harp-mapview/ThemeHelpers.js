"use strict";
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.createLight = exports.toTextureFilter = exports.toWrappingMode = exports.toTextureDataType = exports.toPixelFormat = void 0;
import * as THREE from "three"
/**
 * Returns `three.js` pixel format object basing on a [[PixelFormat]] specified.
 */
function toPixelFormat(format) {
    switch (format) {
        case "Alpha":
            return THREE.AlphaFormat;
        case "RGB":
            return THREE.RGBFormat;
        case "RGBA":
            return THREE.RGBAFormat;
        case "Luminance":
            return THREE.LuminanceFormat;
        case "LuminanceAlpha":
            return THREE.LuminanceAlphaFormat;
        case "RGBE":
            return THREE.RGBEFormat;
        case "Depth":
            return THREE.DepthFormat;
        case "DepthStencil":
            return THREE.DepthStencilFormat;
        case "Red":
            return THREE.RedFormat;
        default:
            throw new Error(`invalid pixel format: ${format}`);
    }
}
exports.toPixelFormat = toPixelFormat;
/**
 * Returns `three.js` texture data types based on a [[TextureDataType]] specified.
 */
function toTextureDataType(dataType) {
    switch (dataType) {
        case "UnsignedByte":
            return THREE.UnsignedByteType;
        case "Byte":
            return THREE.ByteType;
        case "Short":
            return THREE.ShortType;
        case "UnsignedShort":
            return THREE.UnsignedShortType;
        case "Int":
            return THREE.IntType;
        case "UnsignedInt":
            return THREE.UnsignedIntType;
        case "Float":
            return THREE.FloatType;
        case "HalfFloat":
            return THREE.HalfFloatType;
        default:
            throw new Error(`invalid texture data type: ${dataType}`);
    }
}
exports.toTextureDataType = toTextureDataType;
/**
 * Returns `three.js` wrapping mode object based on a [[WrappingMode]] specified.
 */
function toWrappingMode(mode) {
    switch (mode) {
        case "clamp":
            return THREE.ClampToEdgeWrapping;
        case "repeat":
            return THREE.RepeatWrapping;
        case "mirror":
            return THREE.MirroredRepeatWrapping;
        default:
            throw new Error(`invalid wrapping mode: ${mode}`);
    }
}
exports.toWrappingMode = toWrappingMode;
/**
 * Returns `three.js` texture filter object based on a [[MagFilter]] or [[MinFilter]] specified.
 */
function toTextureFilter(filter) {
    switch (filter) {
        case "nearest":
            return THREE.NearestFilter;
        case "nearestMipMapNearest":
            return THREE.NearestMipMapNearestFilter;
        case "nearestMipMapLinear":
            return THREE.NearestMipMapLinearFilter;
        case "linear":
            return THREE.LinearFilter;
        case "linearMipMapNearest":
            return THREE.LinearMipMapNearestFilter;
        case "linearMipMapLinear":
            return THREE.LinearMipMapLinearFilter;
        default:
            throw new Error(`invalid texture filter: ${filter}`);
    }
}
exports.toTextureFilter = toTextureFilter;
/**
 * Create a specific light for lighting the map.
 */
function createLight(lightDescription) {
    switch (lightDescription.type) {
        case "ambient": {
            const light = new THREE.AmbientLight(lightDescription.color, lightDescription.intensity);
            light.name = lightDescription.name;
            return light;
        }
        case "directional": {
            const light = new THREE.DirectionalLight(lightDescription.color, lightDescription.intensity);
            light.name = lightDescription.name;
            if (lightDescription.castShadow !== undefined) {
                light.castShadow = lightDescription.castShadow;
            }
            if (light.castShadow) {
                light.shadow.bias = 0.00001;
                light.shadow.mapSize.width = 1024;
                light.shadow.mapSize.height = 1024;
            }
            light.position.set(lightDescription.direction.x, lightDescription.direction.y, lightDescription.direction.z);
            light.position.normalize();
            return light;
        }
    }
}
exports.createLight = createLight;
export default exports
//# sourceMappingURL=ThemeHelpers.js.map