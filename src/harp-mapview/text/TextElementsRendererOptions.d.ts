export interface TextElementsRendererOptions {
    /**
     * The path to the font catalog file.
     */
    fontCatalog?: string;
    /**
     * Optional initial number of glyphs (characters) for labels. In situations with limited,
     * available memory, decreasing this number may be beneficial.
     *
     * @default [[MIN_GLYPH_COUNT]]
     */
    minNumGlyphs?: number;
    /**
     * Optional limit of number of glyphs (characters) for labels. In situations with limited,
     * available memory, decreasing this number may be beneficial.
     *
     * @default [[MAX_GLYPH_COUNT]]
     */
    maxNumGlyphs?: number;
    /**
     * Limits the number of {@link DataSource} labels visible, such as road names and POIs.
     * On small devices, you can reduce this number to to increase performance.
     * @default `undefined` (no limit).
     */
    maxNumVisibleLabels?: number;
    /**
     * The maximum distance for {@link TextElement} to be rendered, expressed as a fraction of
     * the distance between the near and far plane [0, 1.0].
     * @default [[DEFAULT_MAX_DISTANCE_RATIO_FOR_LABELS]].
     */
    maxDistanceRatioForTextLabels?: number;
    /**
     * The maximum distance for {@link TextElement} with icons to be rendered,
     * expressed as a fraction of the distance
     * between the near and far plane [0, 1.0].
     * @default [[DEFAULT_MAX_DISTANCE_RATIO_FOR_LABELS]].
     */
    maxDistanceRatioForPoiLabels?: number;
    /**
     * The minimum scaling factor that may be applied to {@link TextElement}s due to their distance.
     * If not defined the default value specified in {@link TextElementsRenderer} will be used.
     * @default [[DEFAULT_LABEL_DISTANCE_SCALE_MIN]].
     */
    labelDistanceScaleMin?: number;
    /**
     * The maximum scaling factor that may be applied to {@link TextElement}s due to their distance.
     * If not defined the default value specified in {@link TextElementsRenderer} will be used.
     * @default [[DEFAULT_LABEL_DISTANCE_SCALE_MAX]].
     */
    labelDistanceScaleMax?: number;
    /**
     * Disable all fading animations for debugging and performance measurement.
     * @default `false`
     */
    disableFading?: boolean;
    /**
     * Enable that new labels are delayed until movement is finished
     * @default `true`
     */
    delayLabelsUntilMovementFinished?: boolean;
    /**
     * If `true`, a replacement glyph ("?") is rendered for every missing glyph.
     * @default `false`
     */
    showReplacementGlyphs?: boolean;
    /**
     * The maximum distance to the screen border as a fraction of screen size [0..1].
     * @default [[DEFAULT_MAX_DISTANCE_TO_BORDER]].
     */
    maxPoiDistanceToBorder?: number;
    /**
     * An optional canvas element that renders 2D collision debug information.
     */
    collisionDebugCanvas?: HTMLCanvasElement;
}
/**
 * Initializes undefined text renderer options to default values.
 * @param options - The options to be initialized.
 */
export declare function initializeDefaultOptions(options: TextElementsRendererOptions): void;
//# sourceMappingURL=TextElementsRendererOptions.d.ts.map