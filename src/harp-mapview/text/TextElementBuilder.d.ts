import { AttributeMap, Env, IndexedTechniqueParams, LineMarkerTechnique, MapEnv, PoiTechnique, TextTechnique } from "@here/harp-datasource-protocol";
import { TextElement } from "./TextElement";
import { TileTextStyleCache } from "./TileTextStyleCache";
/**
 * Constructs {@link TextElement} objects from {@link @here/harp-datasource-protocol/Technique},
 * text, coordinates and optional icon.
 */
export declare class TextElementBuilder {
    private readonly m_env;
    private readonly m_styleCache;
    private readonly m_baseRenderOrder;
    private m_priority?;
    private m_fadeNear?;
    private m_fadeFar?;
    private m_minZoomLevel?;
    private m_maxZoomLevel?;
    private m_distanceScale;
    private m_mayOverlap?;
    private m_reserveSpace?;
    private m_renderStyle?;
    private m_layoutStype?;
    private m_technique?;
    private m_renderOrder;
    private m_xOffset?;
    private m_yOffset?;
    private m_poiBuilder?;
    private m_alwaysOnTop?;
    static readonly RENDER_ORDER_UP_BOUND = 10000000;
    readonly renderOrderUpBound: number;
    /**
     * Aligns a {@link TextElement}'s minZoomLevel and maxZoomLevel with values set in
     * {@link PoiInfo}.
     * @remarks Selects the smaller/larger one of the two min/max values for icon and text, because
     * the TextElement is a container for both.
     * @param textElement - The {@link TextElement} whose zoom level ranges will be aligned.
     */
    static alignZoomLevelRanges(textElement: TextElement): void;
    /**
     * Combines two render order numbers into a single one.
     * @param baseRenderOrder - The most significative part of the render order.
     * @param offset - The least significative part of the render order. It must be within the
     * interval (-RENDER_ORDER_UP_BOUND, RENDER_ORDER_UP_BOUND).
     * @return The combined render order.
     */
    static composeRenderOrder(baseRenderOrder: number, offset: number): number;
    /**
     * Constructor
     *
     * @param m_env - The {@link @link @here/harp-datasource-protocol#MapEnv} used to evaluate
     * technique properties.
     * @param m_styleCache - To cache instances of {@link @here/harp-text-canvas/TextRenderStyle}
     * and {@link @here/harp-text-canvas/TextLayoutStyle}.
     */
    constructor(m_env: MapEnv | Env, m_styleCache: TileTextStyleCache, m_baseRenderOrder: number);
    /**
     * Sets a technique that will be used to create text elements on subsequent calls to
     * {@link TextElementBuilder.build} until the next call to this method.
     *
     * @param technique - The {@link @here/harp-datasource-protocol/Technique}.
     * @return This builder.
     */
    withTechnique(technique: (PoiTechnique | LineMarkerTechnique | TextTechnique) & IndexedTechniqueParams): this;
    /**
     * Sets an icon that will be used to create text elements on subsequent calls to
     * {@link TextElementBuilder.build} until the next call to this method.
     *
     * @param imageTextureName - The name of the icon image.
     * @param shieldGroupIndex - Index to the shield group.
     * @return This builder.
     */
    withIcon(imageTextureName?: string, shieldGroupIndex?: number): this;
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
    build(text: string, points: THREE.Vector3 | THREE.Vector3[], tileOffset: number, dataSourceName: string, dataSourceOrder: number, attributes?: AttributeMap, pathLengthSqr?: number, offsetDirection?: number): TextElement;
    private withTextTechnique;
    private withPoiTechnique;
    private isValidRenderOrder;
}
//# sourceMappingURL=TextElementBuilder.d.ts.map