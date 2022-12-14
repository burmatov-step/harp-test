import "@here/harp-fetch";
import { FlatTheme, Theme } from "@here/harp-datasource-protocol/lib/Theme";
import { ISimpleChannel, UriResolver } from "@here/harp-utils";
/**
 * @internal
 */
export declare const DEFAULT_MAX_THEME_INTHERITANCE_DEPTH = 4;
/**
 * Options to customize {@link @here/harp-datasource-protocol#Theme} loading process.
 *
 * @see {@link ThemeLoader.load}
 */
export interface ThemeLoadOptions {
    /**
     * Whether to resolve `ref` expressions in `definition` and `styles` elements.
     *
     * @default `false`, as datasources resolve definitions in [[StyleSetEvaluator]].
     */
    resolveDefinitions?: boolean;
    /**
     * Resolve the URIs to resources like fonts, icons, ...
     * If true, [[uriResolver]] will be used to resolve the URI
     * @default true
     */
    resolveResourceUris?: boolean;
    /**
     * Resolve the URIs of inherited themes (using `extends` feature).
     * If true, [[uriResolver]] will be used to resolve the URI
     * @default true
     */
    resolveIncludeUris?: boolean;
    /**
     * An `AbortSignal` object instance; allows you to communicate with a loading process
     * (including fetch requests) request and abort it if desired via an `AbortController`.
     *
     * Modeled after Web APIs `fetch`s `init.signal`.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch
     * @see https://developer.mozilla.org/en-US/docs/Web/API/AbortController
     */
    signal?: AbortSignal;
    /**
     * Maximum recursion depth when resolving base themes
     * through [{@link @here/harp-datasource-protocol#Theme}s `extends` property.
     *
     * @default [[DEFAULT_MAX_THEME_INTHERITANCE_DEPTH]]
     */
    maxInheritanceDepth?: number;
    /**
     * Custom logging channel on which diagnostics and warnings will be reported.
     *
     * If not specified, {@link ThemeLoader.load} will log to `console`.
     */
    logger?: ISimpleChannel;
    /**
     * Resolve asset `URI`s referenced in `Theme` assets using this resolver.
     */
    uriResolver?: UriResolver;
}
/**
 * Loads and validates a theme from URL objects.
 */
export declare class ThemeLoader {
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
    static load(theme: string | Theme | FlatTheme, options?: ThemeLoadOptions): Promise<Theme>;
    /**
     * Checks if `theme` instance is completely loaded, meaning that `extends` property is resolved.
     *
     * @param theme -
     */
    static isThemeLoaded(theme: Theme | FlatTheme): boolean;
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
    static loadAsync(themeUrl: string): Promise<Theme>;
    /**
     * Resolves all {@link @here/harp-datasource-protocol#Theme}'s relatives URLs
     * to full URL using the {@link @here/harp-datasource-protocol#Theme}'s URL
     * (see: https://www.w3.org/TR/WD-html40-970917/htmlweb.html#h-5.1.2).
     *
     * This method mutates original `theme` instance.
     *
     * @param theme - The {@link @here/harp-datasource-protocol#Theme} to resolve.
     */
    private static resolveUrls;
    private static checkTechniqueSupport;
    /**
     * Expand all `ref` expressions in {@link @here/harp-datasource-protocol#Theme}
     * basing on `definitions`.
     *
     * @remarks
     * This method mutates original `theme` instance.
     */
    private static resolveThemeReferences;
    /**
     * Expand all `ref` in [[StyleSet]] basing on `definitions`.
     */
    private static resolveStyleSet;
    /**
     * Expand all `ref` in [[Style]] instance basing on `definitions`.
     */
    private static resolveStyle;
    /**
     * Resolve `[ref, ...]` in expressions.
     *
     * Returns `undefined` some reference was invalid (missing or wrong type).
     */
    private static resolveExpressionReferences;
    /**
     * Realize `extends` clause by merging `theme` with
     * its base {@link @here/harp-datasource-protocol#Theme}.
     *
     * @param theme - {@link @here/harp-datasource-protocol#Theme} object
     * @param options - Optional, a {@link ThemeLoadOptions} objects
     *                  containing any custom settings for
     *                  this load request.
     */
    private static resolveBaseThemes;
    private static mergeThemes;
    private static mergeImageTextures;
    private static convertFlatTheme;
    private static resolveResources;
}
//# sourceMappingURL=ThemeLoader.d.ts.map