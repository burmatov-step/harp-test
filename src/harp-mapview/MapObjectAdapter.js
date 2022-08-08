"use strict";
let exports = {}
exports.MapObjectAdapter = void 0;
/*
 * Copyright (C) 2020-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
import * as harp_datasource_protocol_1 from "@here/harp-datasource-protocol"
import MapMaterialAdapter_1 from "./MapMaterialAdapter"
/**
 * @hidden
 *
 * {@link MapView} specific data assigned to `THREE.Object3D` instance in installed in `userData`.
 *
 * `MapObjectAdapter` is registered in `usedData.mapAdapter` property of `THREE.Object3D`.
 */
class MapObjectAdapter {
    constructor(object, params) {
        var _a;
        this.m_lastUpdateFrameNumber = -1;
        this.m_notCompletlyTransparent = true;
        this.object = object;
        this.technique = params.technique;
        this.kind = params.kind;
        this.dataSource = params.dataSource;
        this.m_pickability = (_a = params.pickability) !== null && _a !== void 0 ? _a : harp_datasource_protocol_1.Pickability.onlyVisible;
        this.m_notCompletlyTransparent = this.getObjectMaterials().some(material => material.opacity > 0);
        this.level = params.level;
    }
    /**
     * Resolve `MapObjectAdapter` associated with `object`.
     */
    static get(object) {
        var _a;
        return ((_a = object.userData) === null || _a === void 0 ? void 0 : _a.mapAdapter) instanceof MapObjectAdapter
            ? object.userData.mapAdapter
            : undefined;
    }
    static install(objData) {
        if (!objData.object.userData) {
            objData.object.userData = {};
        }
        return (objData.object.userData.mapAdapter = objData);
    }
    static create(object, params) {
        return MapObjectAdapter.install(new MapObjectAdapter(object, params));
    }
    static ensureUpdated(object, context) {
        var _a, _b;
        return (_b = (_a = MapObjectAdapter.get(object)) === null || _a === void 0 ? void 0 : _a.ensureUpdated(context)) !== null && _b !== void 0 ? _b : false;
    }
    /**
     * Serialize contents.
     *
     * `THREE.Object3d.userData` is serialized during `clone`/`toJSON`, so we need to ensure that
     * we emit only "data" set of this object.
     */
    toJSON() {
        return { kind: this.kind, technique: this.technique };
    }
    /**
     * Ensure that underlying object is updated to current state of {@link MapView}.
     *
     * Updates object and attachments like materials to current state by evaluating scene dependent
     * expressions.
     *
     * Executes updates only once per frame basing on [[MapView.frameNumber]].
     *
     * Delegates updates of materials to [[MapMaterialAdapter.ensureUpdated]].
     *
     * @returns `true` if object performed some kind of update, `false` if no update was needed.
     */
    ensureUpdated(context) {
        if (this.m_lastUpdateFrameNumber === context.frameNumber) {
            return false;
        }
        this.m_lastUpdateFrameNumber = context.frameNumber;
        return this.updateMaterials(context);
    }
    /**
     * Whether underlying `THREE.Object3D` is actually visible in scene.
     */
    isVisible() {
        return this.object.visible && this.m_notCompletlyTransparent;
    }
    /**
     * Whether underlying `THREE.Object3D` should be pickable by {@link PickHandler}.
     */
    isPickable() {
        // An object is pickable only if it's visible and Pickabilty.onlyVisible or
        //  Pickabililty.all set.
        return ((this.pickability === harp_datasource_protocol_1.Pickability.onlyVisible && this.isVisible()) ||
            this.m_pickability === harp_datasource_protocol_1.Pickability.all);
    }
    get pickability() {
        return this.m_pickability;
    }
    updateMaterials(context) {
        let somethingChanged = false;
        const materials = this.getObjectMaterials();
        for (const material of materials) {
            const changed = MapMaterialAdapter_1.MapMaterialAdapter.ensureUpdated(material, context);
            somethingChanged = somethingChanged || changed;
        }
        if (somethingChanged) {
            this.m_notCompletlyTransparent = materials.some(material => material.opacity > 0);
        }
        return somethingChanged;
    }
    getObjectMaterials() {
        const object = this.object;
        return Array.isArray(object.material)
            ? object.material
            : object.material !== undefined
                ? [object.material]
                : [];
    }
}
exports.MapObjectAdapter = MapObjectAdapter;
export default exports
//# sourceMappingURL=MapObjectAdapter.js.map