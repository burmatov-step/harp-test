"use strict";
let exports = {}
exports.TextStyleCache = void 0;
/*
 * Copyright (C) 2018-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
import * as harp_datasource_protocol_1 from "@here/harp-datasource-protocol"
import * as harp_text_canvas_1 from "@here/harp-text-canvas"
import * as harp_utils_1 from "@here/harp-utils"
import ColorCache_1 from "../ColorCache"
import DecodedTileHelpers_1 from "../DecodedTileHelpers"
import TextElementsRenderer_1 from "./TextElementsRenderer"
const logger = harp_utils_1.LoggerManager.instance.create("TextStyleCache");
const defaultTextRenderStyle = new harp_text_canvas_1.TextRenderStyle({
    fontSize: {
        unit: harp_text_canvas_1.FontUnit.Pixel,
        size: 32,
        backgroundSize: 8
    },
    color: ColorCache_1.ColorCache.instance.getColor("#6d7477"),
    opacity: 1.0,
    backgroundColor: ColorCache_1.ColorCache.instance.getColor("#f7fbfd"),
    backgroundOpacity: 0.5
});
// By default text layout provides no options for placement, but single alignment.
const defaultTextLayoutStyle = new harp_text_canvas_1.TextLayoutStyle({
    verticalAlignment: harp_text_canvas_1.VerticalAlignment.Center,
    horizontalAlignment: harp_text_canvas_1.HorizontalAlignment.Center,
    placements: []
});
const DEFAULT_STYLE_NAME = "default";
class TextStyleCache {
    constructor() {
        this.m_textStyles = new Map();
        this.m_defaultStyle = {
            name: DEFAULT_STYLE_NAME,
            fontCatalog: undefined,
            renderParams: defaultTextRenderStyle.params,
            layoutParams: defaultTextLayoutStyle.params
        };
        this.updateDefaultTextStyle();
    }
    updateTextStyles(textStyleDefinitions, defaultTextStyleDefinition) {
        this.m_textStyles.clear();
        textStyleDefinitions === null || textStyleDefinitions === void 0 ? void 0 : textStyleDefinitions.forEach(element => {
            this.m_textStyles.set(element.name, this.createTextElementStyle(element, element.name));
        });
        this.updateDefaultTextStyle(defaultTextStyleDefinition, textStyleDefinitions);
    }
    updateTextCanvases(textCanvases) {
        // Initialize default text style.
        this.initializeTextCanvas(this.m_defaultStyle, textCanvases);
        for (const [, style] of this.m_textStyles) {
            this.initializeTextCanvas(style, textCanvases);
        }
    }
    /**
     * Retrieves a {@link TextElementStyle} for {@link @here/harp-datasource-protocol#Theme}'s
     * [[TextStyle]] id.
     */
    getTextElementStyle(styleId) {
        let result;
        if (styleId === undefined) {
            result = this.m_defaultStyle;
        }
        else {
            result = this.m_textStyles.get(styleId);
            if (result === undefined) {
                result = this.m_defaultStyle;
            }
        }
        return result;
    }
    /**
     * Gets the appropriate {@link @here/harp-text-canvas#TextRenderStyle}
     * to use for a label. Depends heavily on the label's
     * [[Technique]] and the current zoomLevel.
     */
    createRenderStyle(tile, technique) {
        const mapView = tile.mapView;
        const zoomLevel = mapView.zoomLevel;
        const discreteZoomLevel = Math.floor(zoomLevel);
        // Environment with $zoom forced to integer to achieve stable interpolated values.
        const discreteZoomEnv = new harp_datasource_protocol_1.MapEnv({ $zoom: discreteZoomLevel }, mapView.env);
        const defaultRenderParams = this.m_defaultStyle.renderParams;
        // Sets opacity to 1.0 if default and technique attribute are undefined.
        const defaultOpacity = harp_utils_1.getOptionValue(defaultRenderParams.opacity, 1.0);
        // Interpolate opacity but only on discreet zoom levels (step interpolation).
        let opacity = harp_datasource_protocol_1.getPropertyValue(harp_utils_1.getOptionValue(technique.opacity, defaultOpacity), discreteZoomEnv);
        let color;
        // Store color (RGB) in cache and multiply opacity value with the color alpha channel.
        if (technique.color !== undefined) {
            let hexColor = DecodedTileHelpers_1.evaluateColorProperty(technique.color, discreteZoomEnv);
            if (hexColor !== undefined) {
                if (harp_datasource_protocol_1.ColorUtils.hasAlphaInHex(hexColor)) {
                    const alpha = harp_datasource_protocol_1.ColorUtils.getAlphaFromHex(hexColor);
                    opacity = opacity * alpha;
                    hexColor = harp_datasource_protocol_1.ColorUtils.removeAlphaFromHex(hexColor);
                }
                color = ColorCache_1.ColorCache.instance.getColor(hexColor);
            }
        }
        // Sets background size to 0.0 if default and technique attribute is undefined.
        const defaultBackgroundSize = harp_utils_1.getOptionValue(defaultRenderParams.fontSize.backgroundSize, 0);
        const backgroundSize = harp_datasource_protocol_1.getPropertyValue(harp_utils_1.getOptionValue(technique.backgroundSize, defaultBackgroundSize), discreteZoomEnv);
        const hasBackgroundDefined = technique.backgroundColor !== undefined &&
            technique.backgroundSize !== undefined &&
            backgroundSize > 0;
        // Sets background opacity to 1.0 if default and technique value is undefined while
        // background size and color is specified, otherwise set value in default render
        // params or 0.0 if neither set. Makes label opaque when backgroundColor and
        // backgroundSize are set.
        const defaultBackgroundOpacity = harp_utils_1.getOptionValue(defaultRenderParams.backgroundOpacity, 0.0);
        let backgroundOpacity = harp_datasource_protocol_1.getPropertyValue(harp_utils_1.getOptionValue(technique.backgroundOpacity, hasBackgroundDefined ? 1.0 : defaultBackgroundOpacity), discreteZoomEnv);
        let backgroundColor;
        // Store background color (RGB) in cache and multiply backgroundOpacity by its alpha.
        if (technique.backgroundColor !== undefined) {
            let hexBgColor = DecodedTileHelpers_1.evaluateColorProperty(technique.backgroundColor, discreteZoomEnv);
            if (hexBgColor !== undefined) {
                if (harp_datasource_protocol_1.ColorUtils.hasAlphaInHex(hexBgColor)) {
                    const alpha = harp_datasource_protocol_1.ColorUtils.getAlphaFromHex(hexBgColor);
                    backgroundOpacity = backgroundOpacity * alpha;
                    hexBgColor = harp_datasource_protocol_1.ColorUtils.removeAlphaFromHex(hexBgColor);
                }
                backgroundColor = ColorCache_1.ColorCache.instance.getColor(hexBgColor);
            }
        }
        const renderParams = {
            fontName: harp_utils_1.getOptionValue(technique.fontName, defaultRenderParams.fontName),
            fontSize: {
                unit: harp_text_canvas_1.FontUnit.Pixel,
                size: harp_datasource_protocol_1.getPropertyValue(harp_utils_1.getOptionValue(technique.size, defaultRenderParams.fontSize.size), discreteZoomEnv),
                backgroundSize
            },
            fontStyle: technique.fontStyle === "Regular" ||
                technique.fontStyle === "Bold" ||
                technique.fontStyle === "Italic" ||
                technique.fontStyle === "BoldItalic"
                ? harp_text_canvas_1.FontStyle[technique.fontStyle]
                : defaultRenderParams.fontStyle,
            fontVariant: technique.fontVariant === "Regular" ||
                technique.fontVariant === "AllCaps" ||
                technique.fontVariant === "SmallCaps"
                ? harp_text_canvas_1.FontVariant[technique.fontVariant]
                : defaultRenderParams.fontVariant,
            rotation: harp_utils_1.getOptionValue(technique.rotation, defaultRenderParams.rotation),
            color: harp_utils_1.getOptionValue(color, harp_utils_1.getOptionValue(defaultRenderParams.color, harp_text_canvas_1.DefaultTextStyle.DEFAULT_COLOR)),
            backgroundColor: harp_utils_1.getOptionValue(backgroundColor, harp_utils_1.getOptionValue(defaultRenderParams.backgroundColor, harp_text_canvas_1.DefaultTextStyle.DEFAULT_BACKGROUND_COLOR)),
            opacity,
            backgroundOpacity
        };
        const themeRenderParams = this.getTextElementStyle(technique.style).renderParams;
        const renderStyle = new harp_text_canvas_1.TextRenderStyle(Object.assign(Object.assign({}, themeRenderParams), renderParams));
        return renderStyle;
    }
    /**
     * Create the appropriate {@link @here/harp-text-canvas#TextLayoutStyle}
     * to use for a label. Depends heavily on the label's
     * [[Technique]] and the current zoomLevel.
     *
     * @param tile - The {@link Tile} to process.
     * @param technique - Label's technique.
     */
    createLayoutStyle(tile, technique) {
        var _a, _b, _c, _d, _e, _f;
        const mapView = tile.mapView;
        const floorZoomLevel = Math.floor(tile.mapView.zoomLevel);
        const discreteZoomEnv = new harp_datasource_protocol_1.MapEnv({ $zoom: floorZoomLevel }, mapView.env);
        const defaultLayoutParams = this.m_defaultStyle.layoutParams;
        const hAlignment = harp_datasource_protocol_1.getPropertyValue(technique.hAlignment, discreteZoomEnv);
        const vAlignment = harp_datasource_protocol_1.getPropertyValue(technique.vAlignment, discreteZoomEnv);
        // Text alternative placements are currently supported only for PoiTechnique.
        const textPlacements = harp_datasource_protocol_1.isPoiTechnique(technique)
            ? harp_datasource_protocol_1.getPropertyValue(technique.placements, discreteZoomEnv)
            : null;
        const { horizontalAlignment, verticalAlignment, placements } = parseAlignmentAndPlacements(hAlignment, vAlignment, textPlacements);
        const wrapping = harp_datasource_protocol_1.getPropertyValue(technique.wrappingMode, discreteZoomEnv);
        const wrappingMode = wrapping === "None" || wrapping === "Character" || wrapping === "Word"
            ? harp_text_canvas_1.WrappingMode[wrapping]
            : defaultLayoutParams.wrappingMode;
        const layoutParams = {
            tracking: (_a = harp_datasource_protocol_1.getPropertyValue(technique.tracking, discreteZoomEnv)) !== null && _a !== void 0 ? _a : defaultLayoutParams.tracking,
            leading: (_b = harp_datasource_protocol_1.getPropertyValue(technique.leading, discreteZoomEnv)) !== null && _b !== void 0 ? _b : defaultLayoutParams.leading,
            maxLines: (_c = harp_datasource_protocol_1.getPropertyValue(technique.maxLines, discreteZoomEnv)) !== null && _c !== void 0 ? _c : defaultLayoutParams.maxLines,
            lineWidth: (_d = harp_datasource_protocol_1.getPropertyValue(technique.lineWidth, discreteZoomEnv)) !== null && _d !== void 0 ? _d : defaultLayoutParams.lineWidth,
            canvasRotation: (_e = harp_datasource_protocol_1.getPropertyValue(technique.canvasRotation, discreteZoomEnv)) !== null && _e !== void 0 ? _e : defaultLayoutParams.canvasRotation,
            lineRotation: (_f = harp_datasource_protocol_1.getPropertyValue(technique.lineRotation, discreteZoomEnv)) !== null && _f !== void 0 ? _f : defaultLayoutParams.lineRotation,
            wrappingMode,
            horizontalAlignment,
            verticalAlignment,
            placements
        };
        const themeLayoutParams = this.getTextElementStyle(technique.style);
        const layoutStyle = new harp_text_canvas_1.TextLayoutStyle(Object.assign(Object.assign({}, themeLayoutParams), layoutParams));
        return layoutStyle;
    }
    updateDefaultTextStyle(defaultTextStyleDefinition, textStyleDefinitions) {
        var _a, _b;
        this.m_defaultStyle.fontCatalog = undefined;
        const style = (_b = (_a = textStyleDefinitions === null || textStyleDefinitions === void 0 ? void 0 : textStyleDefinitions.find(definition => {
            return definition.name === DEFAULT_STYLE_NAME;
        })) !== null && _a !== void 0 ? _a : defaultTextStyleDefinition) !== null && _b !== void 0 ? _b : textStyleDefinitions === null || textStyleDefinitions === void 0 ? void 0 : textStyleDefinitions[0];
        if (style) {
            this.m_defaultStyle = this.createTextElementStyle(style, DEFAULT_STYLE_NAME);
        }
        this.m_defaultStyle.textCanvas = undefined;
    }
    initializeTextCanvas(style, textCanvases) {
        var _a;
        if (style.textCanvas) {
            return;
        }
        if (style.fontCatalog !== undefined) {
            const styledTextCanvas = textCanvases.get(style.fontCatalog);
            style.textCanvas = styledTextCanvas;
            if (textCanvases.has(style.fontCatalog) && !styledTextCanvas) {
                logger.info(`fontCatalog(${style.fontCatalog}), not yet loaded`);
                return;
            }
        }
        // specified canvas not found
        if (style.textCanvas === undefined) {
            if (style.fontCatalog !== undefined &&
                style.fontCatalog !== TextElementsRenderer_1.DEFAULT_FONT_CATALOG_NAME) {
                logger.warn(`FontCatalog '${style.fontCatalog}' set in TextStyle
                     '${style.name}' not found`);
            }
            // find another canvas to use then
            let alternativeTextCanvas = textCanvases.get(TextElementsRenderer_1.DEFAULT_FONT_CATALOG_NAME);
            if (!alternativeTextCanvas && textCanvases.size > 0) {
                for (const [, canvas] of textCanvases) {
                    if (canvas) {
                        alternativeTextCanvas = canvas;
                        break;
                    }
                }
            }
            // if an alternative canvas is found, use it
            if (alternativeTextCanvas) {
                style.textCanvas = alternativeTextCanvas;
                if (style.fontCatalog !== undefined) {
                    logger.info(`fontCatalog: '${style.fontCatalog}' not found,
                      using default fontCatalog(${(_a = style.textCanvas) === null || _a === void 0 ? void 0 : _a.name}).`);
                }
            }
        }
    }
    createTextElementStyle(style, styleName) {
        var _a;
        const { horizontalAlignment, verticalAlignment, placements } = parseAlignmentAndPlacements(style.hAlignment, style.vAlignment, style.placements);
        return {
            name: styleName,
            fontCatalog: harp_utils_1.getOptionValue(style.fontCatalogName, this.m_defaultStyle.fontCatalog),
            renderParams: {
                fontName: style.fontName,
                fontSize: {
                    unit: harp_text_canvas_1.FontUnit.Pixel,
                    size: 32,
                    backgroundSize: (_a = style.backgroundSize) !== null && _a !== void 0 ? _a : 8
                },
                fontStyle: style.fontStyle === "Regular" ||
                    style.fontStyle === "Bold" ||
                    style.fontStyle === "Italic" ||
                    style.fontStyle === "BoldItalic"
                    ? harp_text_canvas_1.FontStyle[style.fontStyle]
                    : undefined,
                fontVariant: style.fontVariant === "Regular" ||
                    style.fontVariant === "AllCaps" ||
                    style.fontVariant === "SmallCaps"
                    ? harp_text_canvas_1.FontVariant[style.fontVariant]
                    : undefined,
                rotation: style.rotation,
                color: style.color !== undefined
                    ? ColorCache_1.ColorCache.instance.getColor(style.color)
                    : undefined,
                backgroundColor: style.backgroundColor !== undefined
                    ? ColorCache_1.ColorCache.instance.getColor(style.backgroundColor)
                    : undefined,
                opacity: style.opacity,
                backgroundOpacity: style.backgroundOpacity
            },
            layoutParams: {
                tracking: style.tracking,
                leading: style.leading,
                maxLines: style.maxLines,
                lineWidth: style.lineWidth,
                canvasRotation: style.canvasRotation,
                lineRotation: style.lineRotation,
                wrappingMode: style.wrappingMode === "None" ||
                    style.wrappingMode === "Character" ||
                    style.wrappingMode === "Word"
                    ? harp_text_canvas_1.WrappingMode[style.wrappingMode]
                    : harp_text_canvas_1.WrappingMode.Word,
                verticalAlignment,
                horizontalAlignment,
                placements
            }
        };
    }
}
exports.TextStyleCache = TextStyleCache;
function parseAlignmentAndPlacements(hAlignment, vAlignment, placementsTokens) {
    // Currently supported only for PoiTechnique.
    const placements = placementsTokens
        ? parseTechniquePlacements(placementsTokens)
        : undefined;
    return harp_text_canvas_1.resolvePlacementAndAlignment(parseTechniqueHAlignValue(hAlignment), parseTechniqueVAlignValue(vAlignment), placements);
}
function parseTechniqueHAlignValue(hAlignment) {
    return hAlignment === "Left" || hAlignment === "Center" || hAlignment === "Right"
        ? harp_text_canvas_1.HorizontalAlignment[hAlignment]
        : defaultTextLayoutStyle.horizontalAlignment;
}
function parseTechniqueVAlignValue(vAlignment) {
    return vAlignment === "Above" || vAlignment === "Center" || vAlignment === "Below"
        ? harp_text_canvas_1.VerticalAlignment[vAlignment]
        : defaultTextLayoutStyle.verticalAlignment;
}
function parseTechniquePlacements(placementsString) {
    // Parse placement properties if available.
    const placements = [];
    const placementsTokens = placementsString
        ? placementsString.toUpperCase().replace(" ", "").split(",")
        : [];
    placementsTokens.forEach(p => {
        const val = parseTechniquePlacementValue(p);
        if (val !== undefined) {
            placements.push(val);
        }
    });
    return placements;
}
function parseTechniquePlacementValue(p) {
    // May be only literal of single or two characters.
    if (p.length < 1 || p.length > 2) {
        return undefined;
    }
    // If no value is specified for vertical/horizontal placement it is by default center.
    const textPlacement = {
        h: harp_text_canvas_1.HorizontalPlacement.Center,
        v: harp_text_canvas_1.VerticalPlacement.Center
    };
    // Firstly try to find vertical placement.
    let modifier = p.charAt(0);
    let found = true;
    switch (modifier) {
        // Top / north
        case harp_datasource_protocol_1.PlacementToken.Top:
        case harp_datasource_protocol_1.PlacementToken.North:
            textPlacement.v = harp_text_canvas_1.VerticalPlacement.Top;
            break;
        // Bottom / south
        case harp_datasource_protocol_1.PlacementToken.Bottom:
        case harp_datasource_protocol_1.PlacementToken.South:
            textPlacement.v = harp_text_canvas_1.VerticalPlacement.Bottom;
            break;
        default:
            found = false;
            if (p.length === 2) {
                // For 2 characters tag both vertical/horizontal should be defined.
                return undefined;
            }
    }
    if (found && p.length === 1) {
        return textPlacement;
    }
    modifier = p.length === 1 ? p.charAt(0) : p.charAt(1);
    switch (modifier) {
        // Right / east
        case harp_datasource_protocol_1.PlacementToken.Right:
        case harp_datasource_protocol_1.PlacementToken.East:
            textPlacement.h = harp_text_canvas_1.HorizontalPlacement.Right;
            break;
        // Left / west
        case harp_datasource_protocol_1.PlacementToken.Left:
        case harp_datasource_protocol_1.PlacementToken.West:
            textPlacement.h = harp_text_canvas_1.HorizontalPlacement.Left;
            break;
        default:
            // Either for single character or multi-char tag, we must surrender.
            return undefined;
    }
    return textPlacement;
}
//# sourceMappingURL=TextStyleCache.js.map

export default exports