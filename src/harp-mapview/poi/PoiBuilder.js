"use strict";
/*
 * Copyright (C) 2020-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.PoiBuilder = void 0;
import * as harp_datasource_protocol_1 from  "@here/harp-datasource-protocol"
import * as harp_utils_1 from  "@here/harp-utils"
import ColorCache_1 from  "../ColorCache"
const logger = harp_utils_1.LoggerManager.instance.create("PoiBuilder");
function getImageTexture(technique, env) {
    return technique.imageTexture !== undefined
        ? harp_datasource_protocol_1.composeTechniqueTextureName(harp_datasource_protocol_1.getPropertyValue(technique.imageTexture, env), technique)
        : undefined;
}
/**
 * Constructs {@link PoiInfo} objects from {@link @here/harp-datasource-protocol/Technique} and
 * an icon.
 */
class PoiBuilder {
    /**
     * Constructor
     *
     * @param m_env - The {@link @link @here/harp-datasource-protocol#MapEnv} used to evaluate
     * technique properties.
     */
    constructor(m_env) {
        this.m_env = m_env;
    }
    /**
     * Sets a technique that will be used to create PoiInfos on subsequent calls to
     * {@link PoiBuilder.build} until the next call to this method.
     *
     * @param technique - The {@link @here/harp-datasource-protocol/Technique}.
     * @return This builder.
     */
    withTechnique(technique) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        this.m_imageTextureName = getImageTexture(technique, this.m_env);
        this.m_iconMinZoomLevel = (_b = harp_datasource_protocol_1.getPropertyValue((_a = technique.iconMinZoomLevel) !== null && _a !== void 0 ? _a : technique.minZoomLevel, this.m_env)) !== null && _b !== void 0 ? _b : undefined;
        this.m_iconMaxZoomLevel = (_d = harp_datasource_protocol_1.getPropertyValue((_c = technique.iconMaxZoomLevel) !== null && _c !== void 0 ? _c : technique.maxZoomLevel, this.m_env)) !== null && _d !== void 0 ? _d : undefined;
        this.m_textMinZoomLevel = (_f = harp_datasource_protocol_1.getPropertyValue((_e = technique.textMinZoomLevel) !== null && _e !== void 0 ? _e : technique.minZoomLevel, this.m_env)) !== null && _f !== void 0 ? _f : undefined;
        this.m_textMaxZoomLevel = (_h = harp_datasource_protocol_1.getPropertyValue((_g = technique.textMaxZoomLevel) !== null && _g !== void 0 ? _g : technique.maxZoomLevel, this.m_env)) !== null && _h !== void 0 ? _h : undefined;
        this.m_technique = technique;
        return this;
    }
    /**
     * Sets an icon that will be used to create PoiInfos on subsequent calls to
     * {@link PoiBuilder.build} until the next call to this method.
     *
     * @param imageTextureName - The name of the icon image. If undefined, the image defined by the
     * technique set on the last call to {@link PoiBuilder.withTechnique} wil be used.
     * @param shieldGroupIndex - Index to a shield group if the icon belongs to one.
     * @return This builder.
     */
    withIcon(imageTextureName, shieldGroupIndex) {
        if (imageTextureName !== undefined) {
            this.m_imageTextureName = imageTextureName;
        }
        this.m_shieldGroupIndex = shieldGroupIndex;
        return this;
    }
    /**
     * Creates a {@link PoiInfo} for the given {@link TextElement}.
     *
     * @param textElement - The text element the poi info will be attached to.
     * @return The created PoiInfo or undefined if no icon image was set for it.
     */
    build(textElement) {
        var _a, _b, _c, _d, _e;
        harp_utils_1.assert(this.m_technique !== undefined);
        const technique = this.m_technique;
        const env = this.m_env;
        const imageTextureName = this.m_imageTextureName;
        // The POI name to be used is taken from the data, since it will
        // specify the name of the texture to use.
        // The POI name in the technique may override the POI name from the
        // data.
        const poiName = technique.poiTable !== undefined ? (_a = technique.poiName) !== null && _a !== void 0 ? _a : imageTextureName : undefined;
        if (imageTextureName !== undefined && poiName !== undefined) {
            logger.warn("Possible duplicate POI icon definition via imageTextureName and poiTable!");
        }
        if (imageTextureName === undefined && poiName === undefined) {
            textElement.minZoomLevel = (_b = textElement.minZoomLevel) !== null && _b !== void 0 ? _b : this.m_textMinZoomLevel;
            textElement.maxZoomLevel = (_c = textElement.maxZoomLevel) !== null && _c !== void 0 ? _c : this.m_textMaxZoomLevel;
            return undefined;
        }
        const textIsOptional = technique.textIsOptional === true;
        const iconIsOptional = technique.iconIsOptional === true;
        const renderTextDuringMovements = !(technique.renderTextDuringMovements === false);
        const iconMayOverlap = (_d = technique.iconMayOverlap) !== null && _d !== void 0 ? _d : technique.textMayOverlap;
        const iconReserveSpace = (_e = technique.iconReserveSpace) !== null && _e !== void 0 ? _e : technique.textReserveSpace;
        const iconColorRaw = harp_datasource_protocol_1.getPropertyValue(technique.iconColor, env);
        const iconColor = iconColorRaw !== null ? ColorCache_1.ColorCache.instance.getColor(iconColorRaw) : undefined;
        const poiInfo = {
            technique,
            imageTextureName,
            poiTableName: technique.poiTable,
            poiName,
            shieldGroupIndex: this.m_shieldGroupIndex,
            textElement,
            textIsOptional,
            iconIsOptional,
            renderTextDuringMovements,
            mayOverlap: iconMayOverlap,
            reserveSpace: iconReserveSpace,
            iconBrightness: technique.iconBrightness,
            iconColor,
            iconMinZoomLevel: this.m_iconMinZoomLevel,
            iconMaxZoomLevel: this.m_iconMaxZoomLevel,
            textMinZoomLevel: this.m_textMinZoomLevel,
            textMaxZoomLevel: this.m_textMaxZoomLevel
        };
        return poiInfo;
    }
}
exports.PoiBuilder = PoiBuilder;
//# sourceMappingURL=PoiBuilder.js.map

export default exports