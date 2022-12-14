import { FontCatalog, TextCanvas } from "@here/harp-text-canvas";
export declare class TextCanvasFactory {
    private readonly m_renderer;
    private m_minGlyphCount;
    private m_maxGlyphCount;
    /**
     * Creates an instance of text canvas factory.
     * @param m_renderer -
     */
    constructor(m_renderer: THREE.WebGLRenderer);
    setGlyphCountLimits(min: number, max: number): void;
    /**
     * Creates text canvas
     * @param fontCatalog - Initial [[FontCatalog]].
     * @param name - Optional name for the TextCavas
     */
    createTextCanvas(fontCatalog: FontCatalog, name?: string): TextCanvas;
}
//# sourceMappingURL=TextCanvasFactory.d.ts.map