"use strict";
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexedBufferedGeometryLineAccessor = exports.IndexedBufferedGeometryAccessor = exports.BufferedGeometryObject3dAccessor = exports.BufferedGeometryLineAccessor = exports.BufferedGeometryAccessor = exports.BufferedGeometryAccessorBase = exports.isObject3dAccessor = exports.isLineAccessor = void 0;
const harp_datasource_protocol_1 = require("@here/harp-datasource-protocol");
const harp_lines_1 = require("@here/harp-lines");
const harp_utils_1 = require("@here/harp-utils");
const logger = harp_utils_1.LoggerManager.instance.create("TileGeometry");
/**
 * Helper function to check if an accessor is of type `ILineAccessor`.
 *
 * @param arg - `true` if `arg` is `ILineAccessor`.
 * @internal
 */
function isLineAccessor(arg) {
    /**
     * Get vertices from the object.
     *
     * @param mode - Specifies which part of the vertices should be returned.
     */
    return typeof arg.isLineAccessor === "function" && arg.isLineAccessor() === true;
}
exports.isLineAccessor = isLineAccessor;
/**
 * Helper function to check if an accessor is of type `IObject3dAccessor`.
 *
 * @param arg - `true` if `arg` is `IObject3dAccessor`.
 * @internal
 */
function isObject3dAccessor(arg) {
    return typeof arg.isObject3dAccessor === "function" && arg.isObject3dAccessor() === true;
}
exports.isObject3dAccessor = isObject3dAccessor;
/**
 * Geometry accessor for both indexed and nonindexed `BufferedGeometry`.
 */
class BufferedGeometryAccessorBase {
    constructor(object, geometryType, bufferGeometry) {
        this.object = object;
        this.geometryType = geometryType;
        this.bufferGeometry = bufferGeometry;
        this.start = -1;
        this.end = -1;
        this.startCapSize = 0;
        this.endCapSize = 0;
        harp_utils_1.assert(!!object);
        if (bufferGeometry.type !== "BufferGeometry") {
            logger.error("IndexedBufferedGeometryAccessor#constructor: BufferGeometry has wrong " + "type");
        }
        harp_utils_1.assert(bufferGeometry.type === "BufferGeometry", "IndexedBufferedGeometryAccessor#constructor: BufferGeometry has wrong type");
        // we know its a BufferAttribute because it is a BufferGeometry
        this.position = this.bufferGeometry.getAttribute("position");
        this.itemSize = this.position.itemSize;
        if (!this.position) {
            logger.warn("BufferedGeometryAccessor#constructor: BufferGeometry has no position " +
                "attribute");
        }
        if (this.position.array.constructor !== Float32Array) {
            logger.warn("BufferedGeometryAccessor#constructor: BufferGeometry.position: " +
                "unsupported ArrayBuffer");
        }
    }
    /**
     * Get the number of accessible geometries in this buffer.
     *
     * @returns Number of primitives in this geometry.
     */
    getCount() {
        return this.position.count;
    }
    /**
     * Get `renderOrder` of object.
     *
     * @returns `renderOrder` of the object.
     */
    get renderOrder() {
        return this.object.renderOrder;
    }
    setRange(start, end, startCapSize = 0, endCapSize = 0) {
        harp_utils_1.assert(start >= 0);
        harp_utils_1.assert(end >= 0);
        harp_utils_1.assert(start <= end);
        this.start = start;
        this.end = end;
        this.startCapSize = startCapSize;
        this.endCapSize = endCapSize;
    }
    /**
     * Get one or more colors from materials.
     */
    get color() {
        /**
         * TODO: Get color(s) from vertex colors
         */
        const getColor = (material) => {
            const meshMaterial = material;
            if (meshMaterial.type === "MeshBasicMaterial" ||
                meshMaterial.type === "MeshStandardMaterial") {
                return meshMaterial.color;
            }
            else if (meshMaterial.type === "RawShaderMaterial") {
                const rawShaderMaterial = material;
                if (rawShaderMaterial.name === "SolidLineMaterial") {
                    return rawShaderMaterial.uniforms.diffuseColor.value;
                }
                logger.warn("BufferedGeometryAccessor#color: unknown shader material name", rawShaderMaterial.name);
            }
            else {
                logger.warn("BufferedGeometryAccessor#color: unknown material type", meshMaterial.type);
            }
            return undefined;
        };
        if (Array.isArray(this.object.material)) {
            const results = new Array();
            const materials = this.object.material;
            for (const material of materials) {
                results.push(getColor(material));
            }
            return results;
        }
        else {
            return getColor(this.object.material);
        }
    }
}
exports.BufferedGeometryAccessorBase = BufferedGeometryAccessorBase;
/**
 * Abstract base class of an accessor for nonindexed geometry.
 */
class BufferedGeometryAccessor extends BufferedGeometryAccessorBase {
    /**
     * Create an object of type `BufferedGeometryAccessor`
     *
     * @param object - mesh object
     * @param geometryType - type of geometry to be used
     * @param bufferGeometry - which buffer geometry to use
     * @param stride - geometry stride length
     */
    constructor(object, geometryType, bufferGeometry, stride) {
        super(object, geometryType, bufferGeometry);
        this.object = object;
        this.geometryType = geometryType;
        this.bufferGeometry = bufferGeometry;
        this.stride = stride;
    }
    clear() {
        harp_utils_1.assert(this.checkSetUp(), "BufferedGeometryAccessor not setup");
        const positionsArray = this.position.array;
        const start = this.start * this.itemSize;
        const end = this.end * this.itemSize;
        for (let i = start; i < end; i++) {
            positionsArray[i] = 0;
        }
        this.position.needsUpdate = true;
    }
    getVertices() {
        harp_utils_1.assert(this.checkSetUp(), "BufferedGeometryAccessor not setup");
        const start = this.start;
        const end = this.end;
        return this.position.array.subarray(start * this.itemSize, end * this.itemSize);
    }
    checkSetUp() {
        return (this.position !== undefined &&
            this.start !== undefined &&
            this.end !== undefined &&
            this.start >= 0 &&
            this.end <= this.position.count &&
            this.start <= this.end);
    }
}
exports.BufferedGeometryAccessor = BufferedGeometryAccessor;
/**
 * Accessor for nonindexed line geometry.
 */
class BufferedGeometryLineAccessor extends BufferedGeometryAccessor {
    constructor(object, geometryType, bufferGeometry) {
        super(object, geometryType, bufferGeometry, 3);
        this.object = object;
        this.geometryType = geometryType;
        this.bufferGeometry = bufferGeometry;
    }
    isLineAccessor() {
        return true;
    }
    get width() {
        //TODO: There is no implementation of such a line, yet...
        harp_utils_1.assert(this.checkSetUp(), "RoBufferedGeometryLineAccessor not setup");
        return undefined;
    }
}
exports.BufferedGeometryLineAccessor = BufferedGeometryLineAccessor;
/**
 * Accessor for nonindexed unspecified (`Object3D`) geometry.
 */
class BufferedGeometryObject3dAccessor extends BufferedGeometryAccessor {
    constructor(object, geometryType, bufferGeometry) {
        super(object, geometryType, bufferGeometry, 1);
        this.object = object;
        this.geometryType = geometryType;
        this.bufferGeometry = bufferGeometry;
    }
    isObject3dAccessor() {
        return true;
    }
    /** @override */
    getVertices() {
        return super.getVertices();
    }
}
exports.BufferedGeometryObject3dAccessor = BufferedGeometryObject3dAccessor;
/**
 * Abstract base class of indexed geometry.
 */
class IndexedBufferedGeometryAccessor extends BufferedGeometryAccessorBase {
    /**
     * Creates an abstract class `IndexedBufferedGeometryAccessor`.
     *
     * @param object - mesh to be used
     * @param geometryType - type of geometry
     * @param bufferGeometry - geometry used
     * @param start -
     * @param end -
     */
    constructor(object, geometryType, bufferGeometry, start, end) {
        super(object, geometryType, bufferGeometry);
        this.object = object;
        this.geometryType = geometryType;
        this.bufferGeometry = bufferGeometry;
        this.indices =
            this.bufferGeometry.index !== null
                ? this.bufferGeometry.index.array
                : undefined;
        if (!this.indices) {
            logger.warn("IndexedBufferedGeometryAccessor#constructor: BufferGeometry has no " + "index");
            harp_utils_1.assert(!!this.indices);
        }
        else {
            if (!(this.indices instanceof Uint32Array)) {
                logger.warn("IndexedBufferedGeometryAccessor#constructor: BufferGeometry index " +
                    "has wrong type");
                harp_utils_1.assert(this.indices instanceof Uint32Array);
            }
        }
    }
    /**
     * Returns number of primitives, which is not known in this base class, so we return the number
     * of indices.
     *
     * @returns The number of indices in the geometry.
     * @override
     */
    getCount() {
        return this.indices.length;
    }
    checkSetUp() {
        return (!!this.indices &&
            this.start !== undefined &&
            this.end !== undefined &&
            this.start >= 0 &&
            this.end <= this.indices.length &&
            this.start <= this.end);
    }
}
exports.IndexedBufferedGeometryAccessor = IndexedBufferedGeometryAccessor;
/**
 * Accessor for lines in an indexed geometry.
 */
class IndexedBufferedGeometryLineAccessor extends IndexedBufferedGeometryAccessor {
    constructor(object, geometryType, bufferGeometry) {
        super(object, geometryType, bufferGeometry, 3);
        this.object = object;
        this.geometryType = geometryType;
        this.bufferGeometry = bufferGeometry;
    }
    isLineAccessor() {
        return true;
    }
    /**
     * Reconstructs line width from triangulated geometry.
     *
     * @returns Line width.
     */
    get width() {
        harp_utils_1.assert(this.checkSetUp(), "RoIndexedBufferedGeometryLineAccessor not setup");
        if (this.geometryType === harp_datasource_protocol_1.GeometryType.ExtrudedLine) {
            const start = this.start + this.startCapSize;
            const positionArray = this.position.array;
            return harp_lines_1.reconstructLineWidth(positionArray, start);
        }
        return undefined;
    }
    clear() {
        harp_utils_1.assert(this.checkSetUp(), "RoIndexedBufferedGeometryLineAccessor not setup");
        const start = this.start;
        const end = this.end;
        for (let i = start; i < end; i++) {
            this.indices[i] = 0;
        }
        if (this.bufferGeometry.index !== null) {
            this.bufferGeometry.index.needsUpdate = true;
        }
    }
    getVertices() {
        harp_utils_1.assert(this.checkSetUp(), "RoIndexedBufferedGeometryLineAccessor not setup");
        const itemSize = this.itemSize;
        const start = this.start;
        const end = this.end;
        const result = new Float32Array((end - start) * itemSize);
        const positionArray = this.position.array;
        if (itemSize === 2) {
            for (let i = start, j = 0; i < end; i++, j += itemSize) {
                const index = this.indices[i];
                result[j + 0] = positionArray[index * itemSize + 0];
                result[j + 1] = positionArray[index * itemSize + 1];
            }
        }
        if (itemSize === 3) {
            for (let i = start, j = 0; i < end; i++, j += itemSize) {
                const index = this.indices[i];
                result[j + 0] = positionArray[index * itemSize + 0];
                result[j + 1] = positionArray[index * itemSize + 1];
                result[j + 2] = positionArray[index * itemSize + 2];
            }
        }
        else {
            for (let i = start, j = 0; i < end; i++, j++) {
                const index = this.indices[i];
                for (let k = 0; k < itemSize; k++) {
                    result[j * itemSize + k] = positionArray[index * itemSize + k];
                }
            }
        }
        return result;
    }
}
exports.IndexedBufferedGeometryLineAccessor = IndexedBufferedGeometryLineAccessor;
//# sourceMappingURL=TileGeometry.js.map