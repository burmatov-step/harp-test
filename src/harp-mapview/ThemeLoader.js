"use strict";
let exports = {}
exports.ThemeLoader = exports.DEFAULT_MAX_THEME_INTHERITANCE_DEPTH = void 0;
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
import * as  harp_datasource_protocol_1 from "@here/harp-datasource-protocol"
import * as  Theme_1 from "@here/harp-datasource-protocol/lib/Theme"
import * as  harp_utils_1 from "@here/harp-utils"
import SkyCubemapTexture_1 from "./SkyCubemapTexture"
/**
 * @internal
 */
exports.DEFAULT_MAX_THEME_INTHERITANCE_DEPTH = 4;
/**
 * Loads and validates a theme from URL objects.
 */
class ThemeLoader {
    /**
     * Loads a {@link @here/harp-datasource-protocol#Theme} from a
     * remote resource, provided as a URL that points to a
     * JSON-encoded theme.
     *
     * By default, resolves following features of theme:
     *
     *  -  `extends` - loads and merges all inherited themes (see [[resolveBaseTheme]])
     *  -  `ref` - resolves all `ref` instances to their values defined in `definitions` section
     *     of theme (see [[resolveThemeReferences]])
     *
     * Relative URIs of reference resources are resolved to full URL using the document's base URL
     * (see [[resolveUrls]]).
     *
     * Custom URIs (of theme itself and of resources referenced by theme) may be resolved with by
     * providing {@link @here/harp-utils#UriResolver} using {@link ThemeLoadOptions.uriResolver}
     * option.
     *
     * @param theme - {@link @here/harp-datasource-protocol#Theme} instance or theme URL
     *                to the theme.
     * @param options - Optional, a {@link ThemeLoadOptions} objects
     *                  containing any custom settings for
     *                  this load request.
     */
    static async load(theme, options) {
        var _a;
        options = options !== null && options !== void 0 ? options : {};
        if (typeof theme === "string") {
            const uriResolver = options.uriResolver;
            const themeUrl = uriResolver !== undefined ? uriResolver.resolveUri(theme) : theme;
            const response = await fetch(themeUrl, { signal: options.signal });
            if (!response.ok) {
                throw new Error(`ThemeLoader#load: cannot load theme: ${response.statusText}`);
            }
            theme = (await response.json());
            theme.url = themeUrl;
            theme = this.resolveUrls(theme, options);
        }
        else if (theme.url === undefined) {
            // assume that theme url is same as baseUrl
            theme.url = harp_utils_1.getAppBaseUrl();
            theme = this.resolveUrls(theme, options);
        }
        else {
            theme = this.convertFlatTheme(theme);
        }
        if (theme === null || theme === undefined) {
            throw new Error("ThemeLoader#load: loaded resource is not valid JSON");
        }
        ThemeLoader.checkTechniqueSupport(theme);
        const resolveDefinitions = harp_utils_1.getOptionValue(options.resolveDefinitions, false);
        theme = await ThemeLoader.resolveBaseThemes(theme, options);
        if (resolveDefinitions) {
            const contextLoader = new harp_utils_1.ContextLogger((_a = options.logger) !== null && _a !== void 0 ? _a : console, `when processing Theme ${theme.url}:`);
            ThemeLoader.resolveThemeReferences(theme, contextLoader);
        }
        return theme;
    }
    /**
     * Checks if `theme` instance is completely loaded, meaning that `extends` property is resolved.
     *
     * @param theme -
     */
    static isThemeLoaded(theme) {
        // TODO: Remove array check, when FlatTheme is fully supported
        return theme.extends === undefined && !Array.isArray(theme.styles);
    }
    /**
     * @deprecated Please use `ThemeLoader.load`
     *
     * Loads a {@link @here/harp-datasource-protocol#Theme} from a remote resource,
     * provided as a URL that points to a JSON-encoded
     * theme.
     *
     * @param themeUrl - The URL to the theme.
     *
     */
    static async loadAsync(themeUrl) {
        return await ThemeLoader.load(themeUrl);
    }
    /**
     * Resolves all {@link @here/harp-datasource-protocol#Theme}'s relatives URLs
     * to full URL using the {@link @here/harp-datasource-protocol#Theme}'s URL
     * (see: https://www.w3.org/TR/WD-html40-970917/htmlweb.html#h-5.1.2).
     *
     * This method mutates original `theme` instance.
     *
     * @param theme - The {@link @here/harp-datasource-protocol#Theme} to resolve.
     */
    static resolveUrls(theme, options) {
        // Ensure that all resources referenced in theme by relative URIs are in fact relative to
        // theme.
        theme = ThemeLoader.convertFlatTheme(theme);
        if (theme.url === undefined) {
            return theme;
        }
        const childUrlResolver = harp_utils_1.composeUriResolvers(options === null || options === void 0 ? void 0 : options.uriResolver, new harp_utils_1.RelativeUriResolver(theme.url));
        const resolveIncludes = options === undefined || !(options.resolveIncludeUris === false);
        if (theme.extends && resolveIncludes) {
            theme.extends = (Array.isArray(theme.extends) ? theme.extends : [theme.extends]).map(baseTheme => {
                if (typeof baseTheme === "string") {
                    return childUrlResolver.resolveUri(baseTheme);
                }
                else {
                    if (baseTheme.url !== undefined) {
                        return baseTheme;
                    }
                    else {
                        baseTheme.url = theme.url;
                        return this.resolveUrls(baseTheme, options);
                    }
                }
            });
        }
        if (!ThemeLoader.convertFlatTheme(theme)) {
            return theme;
        }
        const resolveResources = options === undefined || !(options.resolveResourceUris === false);
        if (resolveResources) {
            ThemeLoader.resolveResources(theme, childUrlResolver);
        }
        return theme;
    }
    static checkTechniqueSupport(theme) {
        if (theme.styles !== undefined) {
            for (const styleSetName in theme.styles) {
                if (!theme.styles.hasOwnProperty(styleSetName)) {
                    continue;
                }
                for (const style of theme.styles[styleSetName]) {
                    switch (style.technique) {
                        // TODO: Re-enable this once "dashed-line" is deprecated.
                        /* case "dashed-line":
                            console.warn(
                                `Using deprecated "dashed-line" technique.
                                Use "solid-line" technique instead`
                            ); */
                        default:
                            break;
                    }
                }
            }
        }
    }
    /**
     * Expand all `ref` expressions in {@link @here/harp-datasource-protocol#Theme}
     * basing on `definitions`.
     *
     * @remarks
     * This method mutates original `theme` instance.
     */
    static resolveThemeReferences(theme, contextLogger) {
        if (theme.styles !== undefined) {
            for (const styleSetName in theme.styles) {
                if (!theme.styles.hasOwnProperty(styleSetName)) {
                    continue;
                }
                contextLogger.pushAttr("styles");
                contextLogger.pushAttr(styleSetName);
                theme.styles[styleSetName] = ThemeLoader.resolveStyleSet(theme.styles[styleSetName], theme.definitions, contextLogger);
                contextLogger.pop();
                contextLogger.pop();
            }
        }
        return theme;
    }
    /**
     * Expand all `ref` in [[StyleSet]] basing on `definitions`.
     */
    static resolveStyleSet(styleSet, definitions, contextLogger) {
        const result = [];
        for (let index = 0; index < styleSet.length; ++index) {
            const currentStyle = styleSet[index];
            contextLogger.pushIndex(index);
            const resolvedStyle = ThemeLoader.resolveStyle(currentStyle, definitions, contextLogger);
            if (resolvedStyle !== undefined) {
                result.push(resolvedStyle);
            }
            else {
                contextLogger.warn("invalid style, ignored");
            }
            contextLogger.pop();
        }
        return result;
    }
    /**
     * Expand all `ref` in [[Style]] instance basing on `definitions`.
     */
    static resolveStyle(style, definitions, contextLogger) {
        if (Array.isArray(style.when)) {
            contextLogger.pushAttr("when");
            const resolvedWhen = this.resolveExpressionReferences(style.when, definitions, contextLogger);
            contextLogger.pop();
            if (resolvedWhen === undefined) {
                return undefined;
            }
            style.when = resolvedWhen;
        }
        if (style.attr !== undefined) {
            const attr = style.attr;
            contextLogger.pushAttr("attr");
            for (const prop in attr) {
                if (!attr.hasOwnProperty(prop)) {
                    continue;
                }
                const value = attr[prop];
                if (!Array.isArray(value)) {
                    continue; // nothing to do
                }
                contextLogger.pushAttr(prop);
                const resolvedValue = this.resolveExpressionReferences(value, definitions, contextLogger);
                contextLogger.pop();
                if (resolvedValue !== undefined) {
                    attr[prop] = resolvedValue;
                }
                else {
                    delete attr[prop];
                }
            }
            contextLogger.pop();
        }
        return style;
    }
    /**
     * Resolve `[ref, ...]` in expressions.
     *
     * Returns `undefined` some reference was invalid (missing or wrong type).
     */
    static resolveExpressionReferences(value, definitions, contextLogger) {
        let failed = false;
        function resolveInternal(node) {
            if (Theme_1.isJsonExprReference(node)) {
                const defName = node[1];
                const def = definitions && definitions[defName];
                if (def === undefined) {
                    contextLogger.warn(`invalid reference '${defName}' - not found`);
                    failed = true;
                    return undefined;
                }
                if (harp_datasource_protocol_1.isJsonExpr(def)) {
                    return def;
                }
                return Theme_1.getDefinitionValue(def);
            }
            else if (Array.isArray(node)) {
                const result = [...node];
                for (let i = 1; i < result.length; ++i) {
                    result[i] = resolveInternal(result[i]);
                }
                return result;
            }
            else {
                return node;
            }
        }
        const r = resolveInternal(value);
        if (failed) {
            return undefined;
        }
        return r;
    }
    /**
     * Realize `extends` clause by merging `theme` with
     * its base {@link @here/harp-datasource-protocol#Theme}.
     *
     * @param theme - {@link @here/harp-datasource-protocol#Theme} object
     * @param options - Optional, a {@link ThemeLoadOptions} objects
     *                  containing any custom settings for
     *                  this load request.
     */
    static async resolveBaseThemes(theme, options) {
        options = options !== null && options !== void 0 ? options : {};
        if (theme.extends === undefined) {
            return theme;
        }
        const maxInheritanceDepth = harp_utils_1.getOptionValue(options.maxInheritanceDepth, exports.DEFAULT_MAX_THEME_INTHERITANCE_DEPTH);
        if (maxInheritanceDepth <= 0) {
            throw new Error(`maxInheritanceDepth reached when attempting to load base theme`);
        }
        const baseThemes = !Array.isArray(theme.extends) ? [theme.extends] : theme.extends;
        delete theme.extends;
        let baseThemesMerged = {};
        for (const baseTheme of baseThemes) {
            const actualBaseTheme = await ThemeLoader.load(baseTheme, Object.assign(Object.assign({}, options), { resolveDefinitions: false, maxInheritanceDepth: maxInheritanceDepth - 1 }));
            baseThemesMerged = ThemeLoader.mergeThemes(actualBaseTheme, baseThemesMerged);
        }
        return ThemeLoader.mergeThemes(theme, baseThemesMerged);
    }
    static mergeThemes(theme, baseTheme) {
        const definitions = Object.assign(Object.assign({}, baseTheme.definitions), theme.definitions);
        let styles;
        if (baseTheme.styles && theme.styles) {
            const currentStyleSets = Object.keys(baseTheme.styles);
            const incomingStyleSets = Object.keys(theme.styles);
            styles = {};
            currentStyleSets.forEach(styleSetName => {
                const index = incomingStyleSets.indexOf(styleSetName);
                if (index !== -1) {
                    // merge the current and incoming styleset
                    // and add the result to `styles`.
                    const baseStyleSet = baseTheme.styles[styleSetName];
                    const newStyleSet = [];
                    const styleIdMap = new Map();
                    baseStyleSet.forEach(style => {
                        if (typeof style.id === "string") {
                            styleIdMap.set(style.id, newStyleSet.length);
                        }
                        newStyleSet.push(style);
                    });
                    const incomingStyleSet = theme.styles[styleSetName];
                    incomingStyleSet.forEach(style => {
                        if (typeof style.extends === "string" && styleIdMap.has(style.extends)) {
                            // extends the existing style referenced by `style.extends`.
                            const baseStyleIndex = styleIdMap.get(style.extends);
                            const baseStyle = newStyleSet[baseStyleIndex];
                            newStyleSet[baseStyleIndex] = Object.assign(Object.assign({}, baseStyle), style);
                            newStyleSet[baseStyleIndex].extends = undefined;
                            return;
                        }
                        if (typeof style.id === "string" && styleIdMap.has(style.id)) {
                            // overrides the existing style with `id` equals to `style.id`.
                            const styleIndex = styleIdMap.get(style.id);
                            newStyleSet[styleIndex] = style;
                            return;
                        }
                        newStyleSet.push(style);
                    });
                    styles[styleSetName] = newStyleSet;
                    // remove the styleset from the incoming list
                    incomingStyleSets.splice(index, 1);
                }
                else {
                    // copy the existing style set to `styles`.
                    styles[styleSetName] = baseTheme.styles[styleSetName];
                }
            });
            // add the remaining stylesets to styles.
            incomingStyleSets.forEach(p => {
                styles[p] = theme.styles[p];
            });
        }
        else if (baseTheme.styles) {
            styles = Object.assign({}, baseTheme.styles);
        }
        else if (theme.styles) {
            styles = Object.assign({}, theme.styles);
        }
        return Object.assign(Object.assign(Object.assign(Object.assign({}, baseTheme), theme), ThemeLoader.mergeImageTextures(theme, baseTheme)), { definitions,
            styles });
    }
    static mergeImageTextures(theme, baseTheme) {
        const images = Object.assign(Object.assign({}, baseTheme.images), theme.images);
        let imageTextures = [];
        if (!baseTheme.imageTextures && theme.imageTextures) {
            imageTextures = theme.imageTextures;
        }
        else if (baseTheme.imageTextures && !theme.imageTextures) {
            imageTextures = baseTheme.imageTextures;
        }
        else if (baseTheme.imageTextures && theme.imageTextures) {
            imageTextures = theme.imageTextures.slice();
            baseTheme.imageTextures.forEach(val => {
                if (!imageTextures.find(({ name }) => name === val.name)) {
                    imageTextures.push(val);
                }
            });
        }
        return {
            images,
            imageTextures
        };
    }
    static convertFlatTheme(theme) {
        if (Array.isArray(theme.styles)) {
            // Convert the flat theme to a standard theme.
            const styles = {};
            theme.styles.forEach(style => {
                if (harp_datasource_protocol_1.isJsonExpr(style)) {
                    throw new Error("invalid usage of theme reference");
                }
                const styleSetName = style.styleSet;
                if (styleSetName === undefined) {
                    throw new Error("missing reference to style set");
                }
                if (!styles[styleSetName]) {
                    styles[styleSetName] = [];
                }
                styles[styleSetName].push(style);
            });
            theme.styles = styles;
        }
        return theme;
    }
    static resolveResources(theme, childUrlResolver) {
        if (theme.sky && theme.sky.type === "cubemap") {
            for (let i = 0; i < SkyCubemapTexture_1.SKY_CUBEMAP_FACE_COUNT; ++i) {
                const faceUrl = theme.sky[SkyCubemapTexture_1.SkyCubemapFaceId[i]];
                if (faceUrl !== undefined) {
                    theme.sky[SkyCubemapTexture_1.SkyCubemapFaceId[i]] = childUrlResolver.resolveUri(faceUrl);
                }
            }
        }
        if (theme.images) {
            for (const name of Object.keys(theme.images)) {
                const image = theme.images[name];
                image.url = childUrlResolver.resolveUri(image.url);
                if (image.atlas !== undefined) {
                    image.atlas = childUrlResolver.resolveUri(image.atlas);
                }
            }
        }
        if (theme.fontCatalogs) {
            for (const font of theme.fontCatalogs) {
                font.url = childUrlResolver.resolveUri(font.url);
            }
        }
        if (theme.poiTables) {
            for (const poiTable of theme.poiTables) {
                poiTable.url = childUrlResolver.resolveUri(poiTable.url);
            }
        }
        if (theme.styles !== undefined) {
            for (const styleSetName in theme.styles) {
                if (!theme.styles.hasOwnProperty(styleSetName)) {
                    continue;
                }
                const styleSet = theme.styles[styleSetName];
                for (const style of styleSet) {
                    if (!style.attr) {
                        continue;
                    }
                    ["map", "normalMap", "displacementMap", "roughnessMap"].forEach(texturePropertyName => {
                        const textureProperty = style.attr[texturePropertyName];
                        if (textureProperty && typeof textureProperty === "string") {
                            style.attr[texturePropertyName] = childUrlResolver.resolveUri(textureProperty);
                        }
                    });
                }
            }
        }
    }
}
exports.ThemeLoader = ThemeLoader;
export default exports
//# sourceMappingURL=ThemeLoader.js.map