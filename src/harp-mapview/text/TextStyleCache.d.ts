import { LineMarkerTechnique, PoiTechnique, TextStyleDefinition, TextTechnique } from "@here/harp-datasource-protocol";
import { TextCanvas, TextLayoutParameters, TextLayoutStyle, TextRenderParameters, TextRenderStyle } from "@here/harp-text-canvas";
import { Tile } from "../Tile";
import { TextCanvases } from "./TextElementsRenderer";
/**
 * {@link TextElementsRenderer} representation of a
 * {@link @here/harp-datasource-protocol#Theme}'s TextStyle.
 */
export interface TextElementStyle {
    name: string;
    fontCatalog?: string;
    renderParams: TextRenderParameters;
    layoutParams: TextLayoutParameters;
    textCanvas?: TextCanvas;
}
export declare class TextStyleCache {
    private readonly m_textStyles;
    private m_defaultStyle;
    constructor();
    updateTextStyles(textStyleDefinitions?: TextStyleDefinition[], defaultTextStyleDefinition?: TextStyleDefinition): void;
    updateTextCanvases(textCanvases: TextCanvases): void;
    /**
     * Retrieves a {@link TextElementStyle} for {@link @here/harp-datasource-protocol#Theme}'s
     * [[TextStyle]] id.
     */
    getTextElementStyle(styleId?: string): TextElementStyle;
    /**
     * Gets the appropriate {@link @here/harp-text-canvas#TextRenderStyle}
     * to use for a label. Depends heavily on the label's
     * [[Technique]] and the current zoomLevel.
     */
    createRenderStyle(tile: Tile, technique: TextTechnique | PoiTechnique | LineMarkerTechnique): TextRenderStyle;
    /**
     * Create the appropriate {@link @here/harp-text-canvas#TextLayoutStyle}
     * to use for a label. Depends heavily on the label's
     * [[Technique]] and the current zoomLevel.
     *
     * @param tile - The {@link Tile} to process.
     * @param technique - Label's technique.
     */
    createLayoutStyle(tile: Tile, technique: TextTechnique | PoiTechnique | LineMarkerTechnique): TextLayoutStyle;
    private updateDefaultTextStyle;
    private initializeTextCanvas;
    private createTextElementStyle;
}
//# sourceMappingURL=TextStyleCache.d.ts.map