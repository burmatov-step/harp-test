import { Env, IndexedTechniqueParams, LineMarkerTechnique, MapEnv, PoiTechnique } from "@here/harp-datasource-protocol";
import { PoiInfo, TextElement } from "../text/TextElement";
/**
 * Constructs {@link PoiInfo} objects from {@link @here/harp-datasource-protocol/Technique} and
 * an icon.
 */
export declare class PoiBuilder {
    private readonly m_env;
    private m_iconMinZoomLevel?;
    private m_iconMaxZoomLevel?;
    private m_textMinZoomLevel?;
    private m_textMaxZoomLevel?;
    private m_technique?;
    private m_imageTextureName?;
    private m_shieldGroupIndex?;
    /**
     * Constructor
     *
     * @param m_env - The {@link @link @here/harp-datasource-protocol#MapEnv} used to evaluate
     * technique properties.
     */
    constructor(m_env: MapEnv | Env);
    /**
     * Sets a technique that will be used to create PoiInfos on subsequent calls to
     * {@link PoiBuilder.build} until the next call to this method.
     *
     * @param technique - The {@link @here/harp-datasource-protocol/Technique}.
     * @return This builder.
     */
    withTechnique(technique: (PoiTechnique | LineMarkerTechnique) & IndexedTechniqueParams): this;
    /**
     * Sets an icon that will be used to create PoiInfos on subsequent calls to
     * {@link PoiBuilder.build} until the next call to this method.
     *
     * @param imageTextureName - The name of the icon image. If undefined, the image defined by the
     * technique set on the last call to {@link PoiBuilder.withTechnique} wil be used.
     * @param shieldGroupIndex - Index to a shield group if the icon belongs to one.
     * @return This builder.
     */
    withIcon(imageTextureName?: string, shieldGroupIndex?: number): this;
    /**
     * Creates a {@link PoiInfo} for the given {@link TextElement}.
     *
     * @param textElement - The text element the poi info will be attached to.
     * @return The created PoiInfo or undefined if no icon image was set for it.
     */
    build(textElement: TextElement): PoiInfo | undefined;
}
//# sourceMappingURL=PoiBuilder.d.ts.map