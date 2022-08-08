"use strict";
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.isLineMarkerElementState = exports.TextElementState = void 0;
import * as harp_text_canvas_1 from "@here/harp-text-canvas"
import * as harp_utils_1 from "@here/harp-utils"
import LayoutState_1 from "./LayoutState"
import RenderState_1 from "./RenderState"
import TextElementType_1 from "./TextElementType"
/**
 * `TextElementState` keeps the current state of a text element while it's being rendered.
 */
class TextElementState {
    /**
     *
     * @param element - TextElement this state represents
     * @param positionIndex - Optional index for TextElements of type LineMarker.
     */
    constructor(element, positionIndex) {
        this.element = element;
        this.m_lineMarkerIndex = positionIndex;
    }
    get initialized() {
        return this.m_textRenderState !== undefined || this.m_iconRenderState !== undefined;
    }
    /**
     * @returns `true` if any component of the element is visible, `false` otherwise.
     */
    get visible() {
        if (this.m_textRenderState !== undefined && this.m_textRenderState.isVisible()) {
            return true;
        }
        const iconRenderState = this.iconRenderState;
        if (iconRenderState !== undefined && iconRenderState.isVisible()) {
            return true;
        }
        return false;
    }
    /**
     * Return the last text placement used.
     *
     * If the text wasn't yet rendered or have no alternative placements it will fallback to
     * style/theme based placement.
     *
     * @returns [[TextPlacement]] object containing vertical/horizontal align.
     */
    get textPlacement() {
        const themeLayout = this.element.layoutStyle;
        const stateLayout = this.m_textLayoutState;
        // Would be good to test for persistence when getting state layout, but with this
        // most of the isolated placement unit tests will fail.
        const lastPlacement = stateLayout !== undefined
            ? stateLayout.textPlacement
            : {
                h: harp_text_canvas_1.hPlacementFromAlignment(themeLayout.horizontalAlignment),
                v: harp_text_canvas_1.vPlacementFromAlignment(themeLayout.verticalAlignment)
            };
        return lastPlacement;
    }
    /**
     * Set text placement to be used.
     *
     * This may be base text anchor placement as defined by style or alternative placement.
     *
     * @param placement - The new [[TextPlacement]] to be used.
     */
    set textPlacement(placement) {
        if (this.m_textLayoutState === undefined && this.isBaseTextPlacement(placement) === true) {
            // Do nothing, layout state is not required cause we leave the base placement.
            return;
        }
        if (this.m_textLayoutState === undefined) {
            // State is not yet defined, but we have placement to store, either alternative or
            // not yet specified in the context of layoutStyle.
            this.m_textLayoutState = new LayoutState_1.LayoutState(placement);
        }
        else {
            this.m_textLayoutState.textPlacement = placement;
        }
    }
    /**
     * Returns information if the text placement provided is the base one defined in style (theme).
     *
     * @param placement - The [[TextPlacement]] to check.
     * @returns [[true]] if the placement provided is exactly the same as in theme base layout,
     * [[false]] if it differs from the basic layout provided in style or
     * [[undefined]] if the layout style is not yet defined so it is hard to say.
     */
    isBaseTextPlacement(placement) {
        const themeLayout = this.element.layoutStyle;
        if (themeLayout !== undefined) {
            return (harp_text_canvas_1.hAlignFromPlacement(placement.h) === themeLayout.horizontalAlignment &&
                harp_text_canvas_1.vAlignFromPlacement(placement.v) === themeLayout.verticalAlignment);
        }
        return undefined;
    }
    /**
     * Resets the element to an initialized state.
     */
    reset() {
        if (this.m_textRenderState !== undefined) {
            this.m_textRenderState.reset();
        }
        if (this.m_textLayoutState !== undefined) {
            if (this.element.layoutStyle !== undefined) {
                this.m_textLayoutState.reset(this.element.layoutStyle);
            }
            else {
                this.m_textLayoutState = undefined;
            }
        }
        if (this.iconRenderState) {
            this.m_iconRenderState.reset();
        }
        this.m_viewDistance = undefined;
        this.element.textBufferObject = undefined;
        this.element.bounds = undefined;
    }
    /**
     * Replaces given text element, inheriting its current state.
     * The predecessor text element state is erased.
     * @param predecessor - Text element state to be replaced.
     */
    replace(predecessor) {
        this.m_textRenderState = predecessor.m_textRenderState;
        this.m_textLayoutState = predecessor.m_textLayoutState;
        this.m_iconRenderState = predecessor.m_iconRenderState;
        predecessor.m_textRenderState = undefined;
        predecessor.m_textLayoutState = undefined;
        predecessor.m_iconRenderState = undefined;
        if (this.element.glyphs === undefined) {
            // Use the predecessor glyphs and case array until proper ones are computed.
            this.element.glyphs = predecessor.element.glyphs;
            this.element.glyphCaseArray = predecessor.element.glyphCaseArray;
        }
        this.element.bounds = undefined;
        this.element.textBufferObject = undefined;
    }
    /**
     * Returns the last computed distance of the text element to the camera.
     * @returns Distance to camera.
     */
    get viewDistance() {
        return this.m_viewDistance;
    }
    /**
     * Updates the text element state.
     * @param viewDistance - The new view distance to set. If `undefined`, element is considered to
     * be out of view.
     */
    update(viewDistance) {
        if (!this.initialized && viewDistance !== undefined) {
            this.initializeRenderStates();
        }
        this.setViewDistance(viewDistance);
    }
    /**
     * Sets the distance of the element to the current view center.
     * @param viewDistance - The new view distance to set. If `undefined`, element is considered to
     * be out of view.
     */
    setViewDistance(viewDistance) {
        this.m_viewDistance = viewDistance;
    }
    /**
     * Return the last distance that has been computed for sorting during placement. This may not be
     * the actual distance if the camera is moving, as the distance is computed only during
     * placement. If the property `alwaysOnTop` is true, the value returned is always `0`.
     *
     * @returns 0 or negative distance to camera.
     */
    get renderDistance() {
        return this.element.alwaysOnTop === true
            ? 0
            : this.m_viewDistance !== undefined
                ? -this.m_viewDistance
                : 0;
    }
    /**
     * @returns The text render state.
     */
    get textRenderState() {
        return this.m_textRenderState;
    }
    /**
     * Returns the icon render state for the case where the text element has only one icon.
     * @returns The icon render state if the text element has a single icon, otherwise undefined.
     */
    get iconRenderState() {
        return this.m_iconRenderState;
    }
    /**
     * Returns the index into the path of the TextElement if the TextElement is of type LineMarker,
     * `undefined` otherwise.
     */
    get lineMarkerIndex() {
        return this.m_lineMarkerIndex;
    }
    /**
     * Returns the position of the TextElement. If this TextElementState belongs to a TextElement
     * of type LineMarker, it returns the position of the marker at the references index in the
     * path of the TextElement.
     */
    get position() {
        return this.element.path !== undefined && this.m_lineMarkerIndex !== undefined
            ? this.element.path[this.m_lineMarkerIndex]
            : this.element.position;
    }
    /**
     * Updates the fading state to the specified time.
     * @param time - The current time.
     * @param disableFading - If `True` there will be no fading transitions, i.e., state will go
     * directly from FadedIn to FadedOut and vice versa.
     */
    updateFading(time, disableFading) {
        if (this.m_textRenderState !== undefined) {
            this.m_textRenderState.updateFading(time, disableFading);
        }
        if (this.iconRenderState !== undefined) {
            this.iconRenderState.updateFading(time, disableFading);
        }
    }
    /**
     * Initialize text and icon render states
     */
    initializeRenderStates() {
        var _a;
        harp_utils_1.assert(this.m_textRenderState === undefined);
        harp_utils_1.assert(this.m_textLayoutState === undefined);
        harp_utils_1.assert(this.m_iconRenderState === undefined);
        const { textFadeTime } = this.element;
        this.m_textRenderState = new RenderState_1.RenderState(textFadeTime);
        if (this.element.type === TextElementType_1.TextElementType.PoiLabel ||
            this.element.type === TextElementType_1.TextElementType.LineMarker) {
            // If there's no fade time for icon, use same as text to keep fading of text and icon
            // in sync.
            const techniqueIconFadeTime = (_a = this.element.poiInfo) === null || _a === void 0 ? void 0 : _a.technique.iconFadeTime;
            const iconFadeTime = techniqueIconFadeTime !== undefined ? techniqueIconFadeTime * 1000 : textFadeTime;
            this.m_iconRenderState = new RenderState_1.RenderState(iconFadeTime);
        }
    }
}
exports.TextElementState = TextElementState;
/**
 * Test if the TextElement this {@link TextElementState} refers to is of type LineMarker.
 * @param state - Text element state to test.
 */
function isLineMarkerElementState(state) {
    return state.m_lineMarkerIndex !== undefined;
}
exports.isLineMarkerElementState = isLineMarkerElementState;
export default exports
//# sourceMappingURL=TextElementState.js.map