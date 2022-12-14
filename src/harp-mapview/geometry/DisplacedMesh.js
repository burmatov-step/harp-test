"use strict";
/*
 * Copyright (C) 2020 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.DisplacedMesh = void 0;
import harp_materials_1 from "@here/harp-materials";
import harp_utils_1 from "@here/harp-utils";
import * as THREE from "three";
import DisplacedBufferAttribute_1 from "./DisplacedBufferAttribute";
import DisplacedBufferGeometry_1 from "./DisplacedBufferGeometry";
function isDisplacementMaterial(material) {
    const isDisplacementFeature = harp_materials_1.hasDisplacementFeature(material);
    harp_utils_1.assert(isDisplacementFeature, "Material does not support displacement maps.");
    return isDisplacementFeature;
}
function isDataTextureMap(map) {
    if (!map) {
        return false;
    }
    const isDataTexture = map instanceof THREE.DataTexture;
    harp_utils_1.assert(isDataTexture, "Material does not support displacement maps.");
    return isDataTexture;
}
/**
 * Mesh with geometry modified by a displacement map. Overrides raycasting behaviour to apply
 * displacement map before intersection test.
 * @internal
 */
class DisplacedMesh extends THREE.Mesh {
    /**
     * Creates an instance of displaced mesh.
     * @param geometry - Original geometry to displace.
     * @param material - Material(s) to be used by the mesh. All must have the same
     *                   displacement map.
     * @param m_getDisplacementRange - Displacement values range getter.
     * @param [m_raycastStrategy] Function that will be used to find ray intersections. If not
     * provided, THREE.Mesh's raycast will be used.
     */
    constructor(geometry, material, m_getDisplacementRange, m_raycastStrategy) {
        super(geometry, material);
        this.m_getDisplacementRange = m_getDisplacementRange;
        this.m_raycastStrategy = m_raycastStrategy;
    }
    static getDisplacedPositionAttribute(geometry, displacementMap) {
        // Reuse same buffer attribute for all meshes since it's only needed during the
        // intersection test.
        if (!DisplacedMesh.displacedPositions) {
            DisplacedMesh.displacedPositions = new DisplacedBufferAttribute_1.DisplacedBufferAttribute(geometry.attributes.position, geometry.attributes.normal, geometry.attributes.uv, displacementMap);
        }
        else {
            DisplacedMesh.displacedPositions.reset(geometry.attributes.position, geometry.attributes.normal, geometry.attributes.uv, displacementMap);
        }
        return DisplacedMesh.displacedPositions;
    }
    // HARP-9585: Override of base class method, however tslint doesn't recognize it as such.
    raycast(raycaster, intersects) {
        // All materials in the object are expected to have the same displacement map.
        const firstMaterial = this.firstMaterial;
        // Use default raycasting implementation if there's no displacement material or if there's
        // no displacement map or its type is not supported.
        if (!isDisplacementMaterial(firstMaterial) ||
            !isDataTextureMap(firstMaterial.displacementMap)) {
            super.raycast(raycaster, intersects);
            return;
        }
        const displacementMap = firstMaterial.displacementMap;
        const displacementRange = Object.assign({}, this.m_getDisplacementRange());
        harp_utils_1.assert(this.geometry instanceof THREE.BufferGeometry, "Unsupported geometry type.");
        const geometry = this.geometry;
        if (this.displacedGeometry) {
            this.displacedGeometry.reset(geometry, displacementMap, displacementRange);
        }
        else {
            this.displacedGeometry = new DisplacedBufferGeometry_1.DisplacedBufferGeometry(geometry, displacementMap, displacementRange, DisplacedMesh.getDisplacedPositionAttribute(geometry, displacementMap));
        }
        // Replace the original geometry by the displaced one only during the intersection test.
        this.geometry = this.displacedGeometry;
        if (this.m_raycastStrategy) {
            this.m_raycastStrategy(this, raycaster, intersects);
        }
        else {
            super.raycast(raycaster, intersects);
        }
        super.geometry = this.displacedGeometry.originalGeometry;
    }
    get firstMaterial() {
        return Array.isArray(this.material) ? this.material[0] : this.material;
    }
}
exports.DisplacedMesh = DisplacedMesh;

export default exports
//# sourceMappingURL=DisplacedMesh.js.map