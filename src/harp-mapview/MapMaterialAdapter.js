"use strict";
/*
 * Copyright (C) 2020-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.MapMaterialAdapter = void 0;
import * as harp_datasource_protocol_1 from "@here/harp-datasource-protocol"
import * as harp_materials_1 from "@here/harp-materials"
import * as THREE from "three"
import DecodedTileHelpers_1 from "./DecodedTileHelpers"
function isTextureProperty(propertyName) {
    return harp_datasource_protocol_1.TEXTURE_PROPERTY_KEYS.includes(propertyName);
}
/**
 * @hidden
 *
 * {@link MapView} specific data assigned to `THREE.Material` instance in installed in `userData`.
 *
 * [[MapMaterialAdapter]] is registered in `usedData.mapAdapter` property of `THREE.Material`.
 */
class MapMaterialAdapter {
    constructor(material, styledProperties) {
        this.m_lastUpdateFrameNumber = -1;
        this.tmpColor = new THREE.Color();
        this.material = material;
        this.styledProperties = styledProperties;
        this.currentStyledProperties = {};
        this.m_dynamicProperties = [];
        for (const propName in styledProperties) {
            if (!styledProperties.hasOwnProperty(propName)) {
                continue;
            }
            const propDefinition = styledProperties[propName];
            if (harp_datasource_protocol_1.Expr.isExpr(propDefinition) || typeof propDefinition === "function") {
                this.m_dynamicProperties.push([propName, propDefinition]);
            }
            else {
                this.currentStyledProperties[propName] = propDefinition;
            }
        }
        this.setupStaticProperties();
    }
    /**
     * Resolve `MapMaterialAdapter` associated with `material`.
     */
    static get(material) {
        var _a;
        const mapAdapter = (_a = material.userData) === null || _a === void 0 ? void 0 : _a.mapAdapter;
        if (mapAdapter instanceof MapMaterialAdapter) {
            return mapAdapter;
        }
        else if (mapAdapter !== undefined) {
            // NOTE: we can rebuild MapMaterialAdapter here if userData.mapAdapter contains
            // stylesed etc, this can be done to rebuild previously saved scene
            return undefined;
        }
        else {
            return undefined;
        }
    }
    static install(objData) {
        if (!objData.material.userData) {
            objData.material.userData = {};
        }
        return (objData.material.userData.mapAdapter = objData);
    }
    static create(material, styledProperties) {
        return MapMaterialAdapter.install(new MapMaterialAdapter(material, styledProperties));
    }
    static ensureUpdated(material, context) {
        var _a, _b;
        return (_b = (_a = MapMaterialAdapter.get(material)) === null || _a === void 0 ? void 0 : _a.ensureUpdated(context)) !== null && _b !== void 0 ? _b : false;
    }
    /**
     * Serialize contents.
     *
     * `THREE.Material.userData` is serialized during `clone`/`toJSON`, so we need to ensure that
     * we emit only "data" set of this object.
     */
    toJSON() {
        return { styledProperties: this.styledProperties };
    }
    /**
     * Ensure that underlying object is updated to current state of {@link MapView}.
     *
     * Updates dynamically styled properties of material by evaluating scene dependent expressions.
     *
     * Executes updates only once per frame basing on [[MapView.frameNumber]].
     *
     * @returns `true` if object performed some kind of update, `false` if no update was needed.
     */
    ensureUpdated(context) {
        if (this.m_lastUpdateFrameNumber === context.frameNumber) {
            return false;
        }
        this.m_lastUpdateFrameNumber = context.frameNumber;
        return this.updateDynamicProperties(context);
    }
    /**
     * Applies static properties to target material.
     */
    setupStaticProperties() {
        var _a, _b;
        let updateBaseColor = false;
        for (const propName in this.styledProperties) {
            if (!this.styledProperties.hasOwnProperty(propName)) {
                continue;
            }
            const currentValue = this.currentStyledProperties[propName];
            if (currentValue === undefined || currentValue === null) {
                continue;
            }
            if (propName === "color" || propName === "opacity") {
                updateBaseColor = true;
            }
            else if (!isTextureProperty(propName)) {
                // Static textures are already set in the material during tile construction.
                this.applyMaterialGenericProp(propName, currentValue);
            }
        }
        if (updateBaseColor) {
            const color = (_a = this.currentStyledProperties.color) !== null && _a !== void 0 ? _a : 0xff0000;
            const opacity = (_b = this.currentStyledProperties.opacity) !== null && _b !== void 0 ? _b : 1;
            this.applyMaterialBaseColor(color, opacity);
        }
    }
    /**
     * Applies static properties to target material.
     */
    updateDynamicProperties(context) {
        var _a, _b;
        let somethingChanged = false;
        if (this.m_dynamicProperties.length > 0) {
            let updateBaseColor = false;
            for (const [propName, propDefinition] of this.m_dynamicProperties) {
                const newValue = harp_datasource_protocol_1.Expr.isExpr(propDefinition)
                    ? harp_datasource_protocol_1.getPropertyValue(propDefinition, context.env)
                    : propDefinition(context);
                if (newValue === this.currentStyledProperties[propName]) {
                    continue;
                }
                this.currentStyledProperties[propName] = newValue;
                // `color` and `opacity` are special properties to support RGBA
                if (propName === "color" || propName === "opacity") {
                    updateBaseColor = true;
                }
                else if (isTextureProperty(propName)) {
                    this.applyMaterialTextureProp(propName, newValue);
                    somethingChanged = true;
                }
                else {
                    this.applyMaterialGenericProp(propName, newValue);
                    somethingChanged = true;
                }
            }
            if (updateBaseColor) {
                const color = (_a = this.currentStyledProperties.color) !== null && _a !== void 0 ? _a : 0xff0000;
                const opacity = (_b = this.currentStyledProperties.opacity) !== null && _b !== void 0 ? _b : 1;
                this.applyMaterialBaseColor(color, opacity);
                somethingChanged = true;
            }
        }
        return somethingChanged;
    }
    applyMaterialTextureProp(propName, value) {
        const m = this.material;
        // Wait until the texture is loaded for the first time on tile creation, that way,
        // the old texture properties can be copied to the new texture.
        if (!m[propName] || value === null) {
            return;
        }
        const oldTexture = m[propName];
        let newTexture;
        if (typeof value === "string") {
            newTexture = new THREE.TextureLoader().load(value, (texture) => {
                m[propName] = texture;
            });
        }
        else if (typeof value === "object") {
            const element = value;
            const isImage = element.nodeName === "IMG";
            const isCanvas = element.nodeName === "CANVAS";
            if (isImage || isCanvas) {
                newTexture = new THREE.CanvasTexture(element);
                if (isImage && !element.complete) {
                    const onLoad = () => {
                        m[propName] = newTexture;
                        element.removeEventListener("load", onLoad);
                    };
                    element.addEventListener("load", onLoad);
                }
                else {
                    m[propName] = newTexture;
                }
            }
        }
        if (newTexture) {
            newTexture.wrapS = oldTexture.wrapS;
            newTexture.wrapT = oldTexture.wrapT;
            newTexture.magFilter = oldTexture.magFilter;
            newTexture.minFilter = oldTexture.minFilter;
            newTexture.flipY = oldTexture.flipY;
            newTexture.repeat = oldTexture.repeat;
        }
    }
    applyMaterialGenericProp(propName, value) {
        const m = this.material;
        if (m[propName] instanceof THREE.Color) {
            let colorValue = value;
            if (typeof colorValue !== "number") {
                const parsed = DecodedTileHelpers_1.evaluateColorProperty(colorValue);
                if (parsed === undefined) {
                    return;
                }
                colorValue = parsed;
            }
            const rgbValue = harp_datasource_protocol_1.ColorUtils.removeAlphaFromHex(colorValue);
            this.tmpColor.set(rgbValue);
            // We set the value, i.e. using =, as opposed to setting the color directly using set
            // because the material may be a custom material with a setter.
            value = this.tmpColor;
        }
        m[propName] = value;
    }
    applyMaterialBaseColor(color, opacity) {
        if (typeof color !== "number") {
            const parsed = DecodedTileHelpers_1.evaluateColorProperty(color);
            if (parsed === undefined) {
                return;
            }
            color = parsed;
        }
        const { r, g, b, a } = harp_datasource_protocol_1.ColorUtils.getRgbaFromHex(color !== null && color !== void 0 ? color : 0xff0000);
        const actualOpacity = a * THREE.MathUtils.clamp(opacity !== null && opacity !== void 0 ? opacity : 1, 0, 1);
        if (this.material instanceof harp_materials_1.RawShaderMaterial) {
            this.material.setOpacity(actualOpacity);
        }
        else {
            this.material.opacity = actualOpacity;
        }
        this.material.color.setRGB(r, g, b);
        const opaque = actualOpacity >= 1.0;
        if (!opaque) {
            harp_materials_1.enableBlending(this.material);
        }
        else {
            harp_materials_1.disableBlending(this.material);
        }
    }
}
exports.MapMaterialAdapter = MapMaterialAdapter;
export default exports
//# sourceMappingURL=MapMaterialAdapter.js.map