"use strict";
/*
 * Copyright (C) 2020-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.LayoutState = void 0;
import harp_text_canvas_1 from "@here/harp-text-canvas"
/**
 * Layout state of the text part of the `TextElement`.
 *
 * Used mainly for multi-anchor placement algorithm.
 * @hidden
 */
class LayoutState {
    constructor(placement) {
        this.m_hAlign = harp_text_canvas_1.DefaultTextStyle.DEFAULT_HORIZONTAL_ALIGNMENT;
        this.m_vAlign = harp_text_canvas_1.DefaultTextStyle.DEFAULT_VERTICAL_ALIGNMENT;
        this.textPlacement = placement;
    }
    /**
     * Set layout based on theme style defined and optional text placement.
     *
     * @param placement - The optional new anchor placement.
     */
    set textPlacement(placement) {
        this.m_hAlign = harp_text_canvas_1.hAlignFromPlacement(placement.h);
        this.m_vAlign = harp_text_canvas_1.vAlignFromPlacement(placement.v);
    }
    /**
     * Acquire current placement setup.
     *
     * Function returns alternative or base placement depending on layout state.
     *
     * @returns The current anchor placement.
     */
    get textPlacement() {
        return {
            h: harp_text_canvas_1.hPlacementFromAlignment(this.m_hAlign),
            v: harp_text_canvas_1.vPlacementFromAlignment(this.m_vAlign)
        };
    }
    /**
     * Reset existing `LayoutState` to contain values from style/theme layout.
     */
    reset(layoutStyle) {
        this.m_hAlign = layoutStyle.horizontalAlignment;
        this.m_vAlign = layoutStyle.verticalAlignment;
    }
    get horizontalAlignment() {
        return this.m_hAlign;
    }
    get verticalAlignment() {
        return this.m_vAlign;
    }
}
exports.LayoutState = LayoutState;
export default exports
//# sourceMappingURL=LayoutState.js.map