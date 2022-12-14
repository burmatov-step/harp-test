"use strict";
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.TextElement = exports.LoadingState = exports.poiIsRenderable = void 0;
import * as harp_text_canvas_1 from "@here/harp-text-canvas"
import * as THREE from "three"
import TextElementType_1 from "./TextElementType"
/**
 * Return 'true' if the POI has been successfully prepared for rendering.
 *
 * @param poiInfo - PoiInfo containing information for rendering the POI icon.
 * @internal
 */
function poiIsRenderable(poiInfo) {
    return poiInfo.buffer !== undefined;
}
exports.poiIsRenderable = poiIsRenderable;
/**
 * State of loading.
 */
var LoadingState;
(function (LoadingState) {
    LoadingState[LoadingState["Requested"] = 0] = "Requested";
    LoadingState[LoadingState["Loaded"] = 1] = "Loaded";
    LoadingState[LoadingState["Initialized"] = 2] = "Initialized";
})(LoadingState = exports.LoadingState || (exports.LoadingState = {}));
/**
 * `TextElement` is used to create 2D text elements (for example, labels).
 * @internal
 */
class TextElement {
    /**
     * Creates a new `TextElement`.
     *
     * @param text - The text to display.
     * @param points - The position or a list of points for a curved text, both in world space.
     * @param renderParams - `TextElement` text rendering parameters.
     * @param layoutParams - `TextElement` text layout parameters.
     * @param priority - The priority of the `TextElement. Elements with the highest priority get
     *              placed first, elements with priority of `0` are placed last, elements with a
     *              negative value are always rendered, ignoring priorities and allowing overrides.
     * @param xOffset - Optional X offset of this `TextElement` in screen coordinates.
     * @param yOffset - Optional Y offset of this `TextElement` in screen coordinates.
     * @param featureId - Optional string to identify feature (originated from {@link DataSource}).
     *                  Number ids are deprecated in favor of strings.
     * @param fadeNear - Distance to the camera (0.0 = camera position, 1.0 = farPlane) at which the
     *              label starts fading out (opacity decreases).
     * @param fadeFar - Distance to the camera (0.0 = camera position, 1.0 = farPlane) at which the
     *              label becomes transparent. A value of <= 0.0 disables fading.
     * @param offsetDirection - Direction represented as an angle in degrees clockwise from north to
     * offset the icon in world space.
     */
    constructor(text, points, renderParams, layoutParams, priority = 0, xOffset = 0, yOffset = 0, featureId, style, fadeNear, fadeFar, tileOffset, offsetDirection, dataSourceName, dataSourceOrder) {
        this.text = text;
        this.points = points;
        this.renderParams = renderParams;
        this.layoutParams = layoutParams;
        this.priority = priority;
        this.xOffset = xOffset;
        this.yOffset = yOffset;
        this.featureId = featureId;
        this.style = style;
        this.fadeNear = fadeNear;
        this.fadeFar = fadeFar;
        this.tileOffset = tileOffset;
        this.offsetDirection = offsetDirection;
        this.dataSourceName = dataSourceName;
        this.dataSourceOrder = dataSourceOrder;
        /**
         * Determines visibility. If set to `false`, it will not be rendered.
         */
        this.visible = true;
        /**
         * Scaling factor of text. Defaults to 0.5, reducing the size ot 50% in the distance.
         */
        this.distanceScale = 0.5;
        /**
         * If specified, determines the render order between `TextElement`s. The number different
         * renderOrders should be as small as possible, because every specific `renderOrder` may result
         * in one or more draw calls.
         *
         * TextElements with the same integer `renderOrder` will be rendered in the same batch.
         *
         * The `renderOrder` of `TextElement`s are only relative to other `TextElement`s, and not other
         * map elements.
         *
         * A `TextElement` with a higher `renderOrder` will be rendered after a `TextElement` with a
         * lower `renderOrder`.
         */
        this.renderOrder = 0;
        /**
         * If set to `true` the geometry has been already overlaid on elevation.
         */
        this.elevated = false;
        if (renderParams instanceof harp_text_canvas_1.TextRenderStyle) {
            this.renderStyle = renderParams;
        }
        if (layoutParams instanceof harp_text_canvas_1.TextLayoutStyle) {
            this.layoutStyle = layoutParams;
        }
        this.type =
            points instanceof THREE.Vector3 ? TextElementType_1.TextElementType.PoiLabel : TextElementType_1.TextElementType.PathLabel;
    }
    /**
     * The text element position or the first point of the path used to render a curved text, both
     * in world space.
     */
    get position() {
        if (this.points instanceof Array) {
            const p = this.points[0];
            return p;
        }
        return this.points;
    }
    /**
     * The list of points in world space used to render the text along a path or `undefined`.
     */
    get path() {
        if (this.points instanceof Array) {
            return this.points;
        }
        return undefined;
    }
    /**
     * If `true`, `TextElement` is allowed to overlap other labels or icons of lower priority.
     *
     * @default `false`
     */
    get textMayOverlap() {
        return this.mayOverlap === true;
    }
    set textMayOverlap(mayOverlap) {
        this.mayOverlap = mayOverlap;
    }
    /**
     * If `true`, `TextElement` will reserve screen space, other markers of lower priority will not
     * be able to overlap.
     *
     * @default `true`
     */
    get textReservesSpace() {
        return this.reserveSpace !== false;
    }
    set textReservesSpace(reserveSpace) {
        this.reserveSpace = reserveSpace;
    }
    /**
     * Contains additional information about icon to be rendered along with text.
     */
    get poiInfo() {
        return this.m_poiInfo;
    }
    set poiInfo(poiInfo) {
        this.m_poiInfo = poiInfo;
        if (poiInfo !== undefined) {
            if (this.path !== undefined) {
                this.type = TextElementType_1.TextElementType.LineMarker;
            }
            const poiRenderOrder = this.renderOrder !== undefined ? this.renderOrder : 0;
            poiInfo.renderOrder = poiRenderOrder;
        }
    }
    /**
     * @returns The style used to render this text element, undefined if not set yet.
     */
    get renderStyle() {
        return this.m_renderStyle;
    }
    /**
     * Sets style used for text rendering.
     * @param style - The style to use.
     */
    set renderStyle(style) {
        this.m_renderStyle = style;
    }
    /**
     * @returns The style used to layout this text element, undefined if not set yet.
     */
    get layoutStyle() {
        return this.m_layoutStyle;
    }
    /**
     * Sets the style used for text layout.
     * @param style - The style to use.
     */
    set layoutStyle(style) {
        this.m_layoutStyle = style;
    }
    /**
     * @returns Whether this text element has a valid feature id.
     */
    hasFeatureId() {
        if (this.featureId === undefined) {
            return false;
        }
        if (typeof this.featureId === "number") {
            return this.featureId !== 0;
        }
        return this.featureId.length > 0;
    }
    /**
     * Disposes of any allocated resources.
     */
    dispose() {
        var _a;
        const poiBuffer = (_a = this.poiInfo) === null || _a === void 0 ? void 0 : _a.buffer;
        if (poiBuffer) {
            poiBuffer.decreaseRefCount();
        }
    }
}
exports.TextElement = TextElement;
/**
 * Text elements with this priority are placed on screen before any others.
 */
TextElement.HIGHEST_PRIORITY = Number.MAX_SAFE_INTEGER;

export default exports
//# sourceMappingURL=TextElement.js.map