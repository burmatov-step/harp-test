"use strict";
/*
 * Copyright (C) 2020-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.TextElementBuilder = void 0;
import * as harp_datasource_protocol_1 from "@here/harp-datasource-protocol"
import * as harp_text_canvas_1 from "@here/harp-text-canvas"
import * as harp_utils_1 from "@here/harp-utils"
import PoiBuilder_1 from "../poi/PoiBuilder"
import TextElement_1 from "./TextElement"
import TextElementsRenderer_1 from "./TextElementsRenderer"
const logger = harp_utils_1.LoggerManager.instance.create("TextElementBuilder");
/**
 * Constructs {@link TextElement} objects from {@link @here/harp-datasource-protocol/Technique},
 * text, coordinates and optional icon.
 */
class TextElementBuilder {
    /**
     * Constructor
     *
     * @param m_env - The {@link @link @here/harp-datasource-protocol#MapEnv} used to evaluate
     * technique properties.
     * @param m_styleCache - To cache instances of {@link @here/harp-text-canvas/TextRenderStyle}
     * and {@link @here/harp-text-canvas/TextLayoutStyle}.
     */
    constructor(m_env, m_styleCache, m_baseRenderOrder) {
        this.m_env = m_env;
        this.m_styleCache = m_styleCache;
        this.m_baseRenderOrder = m_baseRenderOrder;
        this.m_distanceScale = TextElementsRenderer_1.DEFAULT_TEXT_DISTANCE_SCALE;
        this.m_renderOrder = m_baseRenderOrder;
        if (Number.isInteger(m_baseRenderOrder)) {
            this.renderOrderUpBound = TextElementBuilder.RENDER_ORDER_UP_BOUND;
        }
        else {
            // If base render order is not an integer, lower render order upper bound to leave room
            // for the decimal places.
            const absBaseRenderOrder = Math.abs(m_baseRenderOrder);
            this.renderOrderUpBound =
                (absBaseRenderOrder - Math.floor(absBaseRenderOrder)) *
                    TextElementBuilder.RENDER_ORDER_UP_BOUND;
        }
        if (!this.isValidRenderOrder(m_baseRenderOrder)) {
            logger.warn(`Large base render order (${m_baseRenderOrder}) might cause precision issues.`);
        }
    }
    /**
     * Aligns a {@link TextElement}'s minZoomLevel and maxZoomLevel with values set in
     * {@link PoiInfo}.
     * @remarks Selects the smaller/larger one of the two min/max values for icon and text, because
     * the TextElement is a container for both.
     * @param textElement - The {@link TextElement} whose zoom level ranges will be aligned.
     */
    static alignZoomLevelRanges(textElement) {
        var _a, _b;
        if (!textElement.poiInfo) {
            return;
        }
        const poiInfo = textElement.poiInfo;
        textElement.minZoomLevel = (_a = textElement.minZoomLevel) !== null && _a !== void 0 ? _a : harp_utils_1.MathUtils.min2(poiInfo.iconMinZoomLevel, poiInfo.textMinZoomLevel);
        textElement.maxZoomLevel = (_b = textElement.maxZoomLevel) !== null && _b !== void 0 ? _b : harp_utils_1.MathUtils.max2(poiInfo.iconMaxZoomLevel, poiInfo.textMaxZoomLevel);
    }
    /**
     * Combines two render order numbers into a single one.
     * @param baseRenderOrder - The most significative part of the render order.
     * @param offset - The least significative part of the render order. It must be within the
     * interval (-RENDER_ORDER_UP_BOUND, RENDER_ORDER_UP_BOUND).
     * @return The combined render order.
     */
    static composeRenderOrder(baseRenderOrder, offset) {
        return baseRenderOrder * TextElementBuilder.RENDER_ORDER_UP_BOUND + offset;
    }
    /**
     * Sets a technique that will be used to create text elements on subsequent calls to
     * {@link TextElementBuilder.build} until the next call to this method.
     *
     * @param technique - The {@link @here/harp-datasource-protocol/Technique}.
     * @return This builder.
     */
    withTechnique(technique) {
        var _a, _b, _c, _d, _e, _f, _g;
        this.m_technique = technique;
        // Make sorting stable.
        this.m_priority = (_a = harp_datasource_protocol_1.getPropertyValue(technique.priority, this.m_env)) !== null && _a !== void 0 ? _a : 0;
        this.m_fadeNear = (_b = harp_datasource_protocol_1.getPropertyValue(technique.fadeNear, this.m_env)) !== null && _b !== void 0 ? _b : undefined;
        this.m_fadeFar = (_c = harp_datasource_protocol_1.getPropertyValue(technique.fadeFar, this.m_env)) !== null && _c !== void 0 ? _c : undefined;
        this.m_minZoomLevel = (_d = harp_datasource_protocol_1.getPropertyValue(technique.minZoomLevel, this.m_env)) !== null && _d !== void 0 ? _d : undefined;
        this.m_maxZoomLevel = (_e = harp_datasource_protocol_1.getPropertyValue(technique.maxZoomLevel, this.m_env)) !== null && _e !== void 0 ? _e : undefined;
        this.m_distanceScale = (_f = technique.distanceScale) !== null && _f !== void 0 ? _f : TextElementsRenderer_1.DEFAULT_TEXT_DISTANCE_SCALE;
        this.m_renderStyle = this.m_styleCache.getRenderStyle(technique);
        this.m_layoutStype = this.m_styleCache.getLayoutStyle(technique);
        this.m_xOffset = harp_datasource_protocol_1.getPropertyValue(technique.xOffset, this.m_env);
        this.m_yOffset = harp_datasource_protocol_1.getPropertyValue(technique.yOffset, this.m_env);
        const techniqueRenderOrder = (_g = harp_datasource_protocol_1.getPropertyValue(technique.renderOrder, this.m_env)) !== null && _g !== void 0 ? _g : 0;
        if (!this.isValidRenderOrder(techniqueRenderOrder)) {
            const msg = `Unsupported large render order (${techniqueRenderOrder})`;
            logger.error(msg);
            harp_utils_1.assert(false, msg);
        }
        this.m_renderOrder = TextElementBuilder.composeRenderOrder(this.m_baseRenderOrder, techniqueRenderOrder);
        if (harp_datasource_protocol_1.isTextTechnique(technique)) {
            this.withTextTechnique(technique);
        }
        else {
            this.withPoiTechnique(technique);
        }
        return this;
    }
    /**
     * Sets an icon that will be used to create text elements on subsequent calls to
     * {@link TextElementBuilder.build} until the next call to this method.
     *
     * @param imageTextureName - The name of the icon image.
     * @param shieldGroupIndex - Index to the shield group.
     * @return This builder.
     */
    withIcon(imageTextureName, shieldGroupIndex) {
        harp_utils_1.assert(this.m_poiBuilder !== undefined);
        this.m_poiBuilder.withIcon(imageTextureName, shieldGroupIndex);
        return this;
    }
    /**
     * Creates a {@link TextElement} with the given properties.
     *
     * @param text - The text to be displayed.
     * @param points - The position(s) for the text element.
     * @param tileOffset - The TextElement's tile offset, see {@link Tile.offset}.
     * @param dataSourceName - The name of the data source.
     * @param attributes - TextElement attribute map.
     * @param pathLengthSqr - Precomputed path length squared for path labels.
     * @return The created text element.
     */
    build(text, points, tileOffset, dataSourceName, dataSourceOrder, attributes, pathLengthSqr, offsetDirection) {
        var _a;
        const featureId = harp_datasource_protocol_1.getFeatureId(attributes);
        harp_utils_1.assert(this.m_technique !== undefined);
        harp_utils_1.assert(this.m_renderStyle !== undefined);
        harp_utils_1.assert(this.m_layoutStype !== undefined);
        const technique = this.m_technique;
        const renderStyle = this.m_renderStyle;
        const layoutStyle = this.m_layoutStype;
        const textElement = new TextElement_1.TextElement(harp_text_canvas_1.ContextualArabicConverter.instance.convert(text), points, renderStyle, layoutStyle, this.m_priority, this.m_xOffset, this.m_yOffset, featureId, technique.style, this.m_fadeNear, this.m_fadeFar, tileOffset, offsetDirection, dataSourceName, dataSourceOrder);
        textElement.minZoomLevel = this.m_minZoomLevel;
        textElement.maxZoomLevel = this.m_maxZoomLevel;
        textElement.distanceScale = this.m_distanceScale;
        textElement.mayOverlap = this.m_mayOverlap;
        textElement.reserveSpace = this.m_reserveSpace;
        textElement.kind = technique.kind;
        // Get the userData for text element picking.
        textElement.userData = attributes;
        textElement.textFadeTime =
            technique.textFadeTime !== undefined ? technique.textFadeTime * 1000 : undefined;
        textElement.pathLengthSqr = pathLengthSqr;
        textElement.alwaysOnTop = this.m_alwaysOnTop;
        textElement.renderOrder = this.m_renderOrder;
        textElement.poiInfo = (_a = this.m_poiBuilder) === null || _a === void 0 ? void 0 : _a.build(textElement);
        TextElementBuilder.alignZoomLevelRanges(textElement);
        return textElement;
    }
    withTextTechnique(technique) {
        this.m_mayOverlap = technique.mayOverlap === true;
        this.m_reserveSpace = technique.reserveSpace !== false;
        this.m_poiBuilder = undefined;
    }
    withPoiTechnique(technique) {
        this.m_mayOverlap = technique.textMayOverlap === true;
        this.m_reserveSpace = technique.textReserveSpace !== false;
        this.m_alwaysOnTop = technique.alwaysOnTop === true;
        if (!this.m_poiBuilder) {
            this.m_poiBuilder = new PoiBuilder_1.PoiBuilder(this.m_env);
        }
        this.m_poiBuilder.withTechnique(technique);
    }
    isValidRenderOrder(renderOrder) {
        return Math.abs(renderOrder) < this.renderOrderUpBound;
    }
}
exports.TextElementBuilder = TextElementBuilder;
// Upper bound for render order values coming from a technique. The lowest upper bound
// (`renderOrderUpBound`) will be smaller if `baseRenderOrder` is not an integer.
TextElementBuilder.RENDER_ORDER_UP_BOUND = 1e7;
//# sourceMappingURL=TextElementBuilder.js.map

export default exports