"use strict";
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.TextCanvasFactory = void 0;
import * as harp_text_canvas_1 from "@here/harp-text-canvas"
import * as harp_utils_1 from "@here/harp-utils"
class TextCanvasFactory {
    /**
     * Creates an instance of text canvas factory.
     * @param m_renderer -
     */
    constructor(m_renderer) {
        this.m_renderer = m_renderer;
        this.m_minGlyphCount = 0; //Min amount of glyphs each [[TextCanvas]] layer can store.
        this.m_maxGlyphCount = 0; //Max amount of glyphs each [[TextCanvas]] layer can store.
    }
    setGlyphCountLimits(min, max) {
        this.m_minGlyphCount = min;
        this.m_maxGlyphCount = max;
    }
    /**
     * Creates text canvas
     * @param fontCatalog - Initial [[FontCatalog]].
     * @param name - Optional name for the TextCavas
     */
    createTextCanvas(fontCatalog, name) {
        harp_utils_1.assert(this.m_maxGlyphCount > 0);
        return new harp_text_canvas_1.TextCanvas({
            renderer: this.m_renderer,
            fontCatalog,
            minGlyphCount: this.m_minGlyphCount,
            maxGlyphCount: this.m_maxGlyphCount,
            name
        });
    }
}
exports.TextCanvasFactory = TextCanvasFactory;
export default exports
//# sourceMappingURL=TextCanvasFactory.js.mapPre