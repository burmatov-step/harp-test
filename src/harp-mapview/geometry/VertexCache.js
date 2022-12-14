"use strict";
/*
 * Copyright (C) 2020 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.VertexCache = void 0;
import harp_utils_1 from "@here/harp-utils"
// Offsets for the fields stored in cache for each vertex.
var Field;
(function (Field) {
    Field[Field["VertexId"] = 0] = "VertexId";
    Field[Field["OlderIdx"] = 1] = "OlderIdx";
    Field[Field["NewerIdx"] = 2] = "NewerIdx";
    Field[Field["X"] = 3] = "X";
    Field[Field["Y"] = 4] = "Y";
    Field[Field["Z"] = 5] = "Z";
    Field[Field["Count"] = 6] = "Count";
})(Field || (Field = {}));
const Invalid = -1;
/**
 * Compact vertex LRU Cache for on the fly temporary mesh transformations.
 * @internal
 */
class VertexCache {
    /**
     * Creates a new cache with the specified maximum size.
     * @param maxVertexCount - The maximum number of vertices the cache will store.
     */
    constructor(maxVertexCount) {
        this.maxVertexCount = maxVertexCount;
        this.m_cache = []; // Stores all fields for every cached vertex (see Field).
        this.m_vertexCount = 0;
        this.m_oldestIdx = 0;
        this.m_newestIdx = 0;
        this.m_cache.length = this.maxVertexCount * Field.Count;
        this.clear();
    }
    /**
     * Clears the vertex cache.
     */
    clear() {
        this.m_cache.fill(Invalid);
        this.m_vertexCount = 0;
    }
    /**
     * Gets a vertex from cache.
     * @param vertexId - The id of the vertex to get.
     * @param vertex - The vertex coordinates will be set here if found.
     * @returns whether the vertex was found on cache.
     */
    get(vertexId, vertex) {
        const vertexIdx = this.find(vertexId);
        if (vertexIdx === undefined) {
            return false;
        }
        this.promoteEntry(vertexIdx);
        this.getVertex(vertexIdx, vertex);
        return true;
    }
    /**
     * Sets a vertex in cache. It's assumed there's no vertex with the same id already in cache.
     * @param vertexId - The vertex id.
     * @param vertex - The vertex coordinates.
     */
    set(vertexId, vertex) {
        let vertexIdx = Invalid;
        if (this.m_vertexCount < this.maxVertexCount) {
            vertexIdx = this.m_vertexCount * Field.Count;
            this.m_vertexCount++;
        }
        else {
            vertexIdx = this.m_oldestIdx;
        }
        if (this.m_vertexCount === 1) {
            this.m_oldestIdx = this.m_newestIdx = vertexIdx;
        }
        else {
            this.promoteEntry(vertexIdx);
        }
        this.setVertex(vertexIdx, vertexId, vertex);
    }
    find(vertexId) {
        const size = this.m_cache.length;
        for (let i = 0; i < size; i += Field.Count) {
            if (this.m_cache[i] === vertexId) {
                return i;
            }
        }
        return undefined;
    }
    promoteEntry(vertexIdx) {
        if (vertexIdx === this.m_newestIdx) {
            return;
        } // already newest, nothing to do
        // re-link newer and older items
        const newerIdx = this.getNewerIdx(vertexIdx);
        const olderIdx = this.getOlderIdx(vertexIdx);
        if (newerIdx !== Invalid) {
            harp_utils_1.assert(this.getOlderIdx(newerIdx) === vertexIdx);
            this.setOlderIdx(newerIdx, olderIdx);
        }
        if (olderIdx !== Invalid) {
            harp_utils_1.assert(this.getNewerIdx(olderIdx) === vertexIdx);
            this.setNewerIdx(olderIdx, newerIdx);
        }
        if (vertexIdx === this.m_oldestIdx) {
            this.m_oldestIdx = newerIdx;
        }
        // re-link ourselves
        this.setNewerIdx(vertexIdx, Invalid);
        this.setOlderIdx(vertexIdx, this.m_newestIdx);
        // finally, set ourselves as the newest entry
        harp_utils_1.assert(this.m_newestIdx !== Invalid);
        harp_utils_1.assert(this.getNewerIdx(this.m_newestIdx) === Invalid);
        this.setNewerIdx(this.m_newestIdx, vertexIdx);
        this.m_newestIdx = vertexIdx;
    }
    getOlderIdx(vertexIdx) {
        return this.m_cache[vertexIdx + Field.OlderIdx];
    }
    setOlderIdx(vertexIdx, olderIdx) {
        this.m_cache[vertexIdx + Field.OlderIdx] = olderIdx;
    }
    getNewerIdx(vertexIdx) {
        return this.m_cache[vertexIdx + Field.NewerIdx];
    }
    setNewerIdx(vertexIdx, newerIdx) {
        this.m_cache[vertexIdx + Field.NewerIdx] = newerIdx;
    }
    getVertex(vertexIdx, vertex) {
        vertex.x = this.m_cache[vertexIdx + Field.X];
        vertex.y = this.m_cache[vertexIdx + Field.Y];
        vertex.z = this.m_cache[vertexIdx + Field.Z];
    }
    setVertex(vertexIdx, vertexId, vertex) {
        this.m_cache[vertexIdx] = vertexId;
        this.m_cache[vertexIdx + Field.X] = vertex.x;
        this.m_cache[vertexIdx + Field.Y] = vertex.y;
        this.m_cache[vertexIdx + Field.Z] = vertex.z;
    }
}
exports.VertexCache = VertexCache;
export default exports
//# sourceMappingURL=VertexCache.js.map