"use strict";
/*
 * Copyright (C) 2020 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.DisplacedBufferAttribute = void 0;
import harp_utils_1 from "@here/harp-utils"
import * as THREE from "three"
import VertexCache_1 from "./VertexCache"
/**
 * @internal
 * BufferAttribute decorator that displaces on the fly the coordinates in a given attribute using a
 * specified displacement map.
 */
class DisplacedBufferAttribute extends THREE.BufferAttribute {
    /**
     * Creates an instance of displaced buffer attribute.
     * @param originalAttribute - The buffer attribute to be displaced
     *                            (e.g. the position attribute).
     * @param m_normals - The normals along which the coordinates will be displaced.
     * @param m_uvs - The uv coordinates to be used to sample the displacement map.
     * @param displacementMap - A texture with the displacement values in 32bit floats.
     */
    constructor(originalAttribute, m_normals, m_uvs, displacementMap) {
        super(originalAttribute.array, originalAttribute.itemSize, originalAttribute.normalized);
        this.originalAttribute = originalAttribute;
        this.m_normals = m_normals;
        this.m_uvs = m_uvs;
        this.m_textureWidth = 0;
        this.m_textureHeight = 0;
        this.m_cache = new VertexCache_1.VertexCache(DisplacedBufferAttribute.MAX_CACHE_SIZE);
        this.m_lastPos = new THREE.Vector3();
        this.m_tmpNormal = new THREE.Vector3();
        this.resetTexture(displacementMap);
    }
    /**
     * Resets the displaced buffer attribute to use new buffer attributes or displacement map.
     * @param originalAttribute - The buffer attribute to be displaced
     *                            (e.g. the position attribute).
     * @param normals - The normals along which the coordinates will be displaced.
     * @param uvs -  The uv coordinates to be used to sample the displacement map.
     * @param displacementMap - A texture with the displacement values in 32bit floats.
     */
    reset(originalAttribute, normals, uvs, displacementMap) {
        this.array = originalAttribute.array;
        this.itemSize = originalAttribute.itemSize;
        this.count = this.array.length / this.itemSize;
        this.normalized = originalAttribute.normalized;
        this.originalAttribute = originalAttribute;
        this.m_normals = normals;
        this.m_uvs = uvs;
        this.m_cache.clear();
        this.m_lastBufferIndex = undefined;
        this.resetTexture(displacementMap);
    }
    // HARP-9585: These getters are overrides of the base class ones, however tslint doesn't
    // recognize them as such.
    getX(index) {
        return this.getDisplacedCoordinate(index).x;
    }
    getY(index) {
        return this.getDisplacedCoordinate(index).y;
    }
    getZ(index) {
        return this.getDisplacedCoordinate(index).z;
    }
    resetTexture(displacementMap) {
        this.m_texture = new Float32Array(displacementMap.image.data.buffer);
        this.m_textureWidth = displacementMap.image.width;
        this.m_textureHeight = displacementMap.image.height;
    }
    getDisplacedCoordinate(bufferIndex) {
        if (bufferIndex === this.m_lastBufferIndex) {
            return this.m_lastPos;
        }
        this.m_lastBufferIndex = bufferIndex;
        if (this.m_cache.get(bufferIndex, this.m_lastPos)) {
            return this.m_lastPos;
        }
        this.displacePosition(bufferIndex);
        this.m_cache.set(bufferIndex, this.m_lastPos);
        return this.m_lastPos;
    }
    displacePosition(bufferIndex) {
        this.m_lastPos.fromBufferAttribute(this.originalAttribute, bufferIndex);
        const normals = this.m_normals;
        this.m_tmpNormal.fromBufferAttribute(normals, bufferIndex);
        const uvs = this.m_uvs;
        const u = THREE.MathUtils.clamp(uvs.getX(bufferIndex), 0, 1);
        const v = THREE.MathUtils.clamp(uvs.getY(bufferIndex), 0, 1);
        const displacement = harp_utils_1.sampleBilinear(this.m_texture, this.m_textureWidth, this.m_textureHeight, u, v);
        this.m_lastPos.add(this.m_tmpNormal.multiplyScalar(displacement));
    }
}
exports.DisplacedBufferAttribute = DisplacedBufferAttribute;
DisplacedBufferAttribute.MAX_CACHE_SIZE = 6;

export default exports
//# sourceMappingURL=DisplacedBufferAttribute.js.map