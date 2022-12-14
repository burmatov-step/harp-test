"use strict";
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.RenderState = exports.DEFAULT_FADE_TIME = exports.FadingState = void 0;
import * as harp_utils_1 from "@here/harp-utils"
import * as THREE from "three"
/**
 * State of fading.
 */
var FadingState;
(function (FadingState) {
    FadingState[FadingState["Undefined"] = 0] = "Undefined";
    FadingState[FadingState["FadingIn"] = 1] = "FadingIn";
    FadingState[FadingState["FadedIn"] = 2] = "FadedIn";
    FadingState[FadingState["FadingOut"] = -1] = "FadingOut";
    FadingState[FadingState["FadedOut"] = -2] = "FadedOut";
})(FadingState = exports.FadingState || (exports.FadingState = {}));
/**
 * Time to fade in/fade out the labels in milliseconds.
 */
exports.DEFAULT_FADE_TIME = 800;
/**
 * State of rendering of the icon and text part of the `TextElement`. Mainly for fading the elements
 * in and out, to compute the opacity.
 *
 * @hidden
 */
class RenderState {
    /**
     * Create a `RenderState`.
     *
     * @param fadeTime - The duration of the fading in milliseconds.
     */
    constructor(fadeTime = exports.DEFAULT_FADE_TIME) {
        this.fadeTime = fadeTime;
        /**
         * Current fading value [0..1]
         */
        this.value = 0.0;
        /**
         * Timestamp the fading started.
         */
        this.startTime = 0;
        /**
         * Computed opacity depending on value.
         */
        this.opacity = 0.0;
        this.m_state = FadingState.Undefined;
    }
    /**
     * Reset existing `RenderState` to appear like a fresh state.
     */
    reset() {
        this.m_state = FadingState.Undefined;
        this.value = 0.0;
        this.startTime = 0.0;
        this.opacity = 0.0;
    }
    /**
     * @returns `true` if element state is `FadingState.Undefined`.
     */
    isUndefined() {
        return this.m_state === FadingState.Undefined;
    }
    /**
     * @returns `true` if element is either fading in or fading out.
     */
    isFading() {
        const fading = this.m_state === FadingState.FadingIn || this.m_state === FadingState.FadingOut;
        return fading;
    }
    /**
     * @returns `true` if element is fading in.
     */
    isFadingIn() {
        const fadingIn = this.m_state === FadingState.FadingIn;
        return fadingIn;
    }
    /**
     * @returns `true` if element is fading out.
     */
    isFadingOut() {
        const fadingOut = this.m_state === FadingState.FadingOut;
        return fadingOut;
    }
    /**
     * @returns `true` if element is done with fading in.
     */
    isFadedIn() {
        const fadedIn = this.m_state === FadingState.FadedIn;
        return fadedIn;
    }
    /**
     * @returns `true` if element is done with fading out.
     */
    isFadedOut() {
        const fadedOut = this.m_state === FadingState.FadedOut;
        return fadedOut;
    }
    /**
     * @returns `true` if state is neither faded out nor undefined and the opacity is larger
     * than 0.
     */
    isVisible() {
        return (this.m_state !== FadingState.FadedOut &&
            this.m_state !== FadingState.Undefined &&
            this.opacity > 0);
    }
    /**
     * Updates the state to [[FadingState.FadingIn]].
     * If previous state is [[FadingState.FadingIn]] or [[FadingState.FadedIn]] it remains
     * unchanged.
     *
     * @param time - Current time.
     * @param disableFading - Optional flag to disable fading.
     */
    startFadeIn(time, disableFading) {
        if (this.m_state === FadingState.FadingIn || this.m_state === FadingState.FadedIn) {
            return;
        }
        if (disableFading === true) {
            this.value = 1;
            this.opacity = 1;
            this.m_state = FadingState.FadedIn;
            this.startTime = time;
            return;
        }
        if (this.m_state === FadingState.FadingOut) {
            // The fadeout is not complete: compute the virtual fadingStartTime in the past, to get
            // a correct end time:
            this.value = 1.0 - this.value;
            this.startTime = time - this.value * this.fadeTime;
        }
        else {
            this.startTime = time;
            this.value = 0.0;
            this.opacity = 0;
        }
        this.m_state = FadingState.FadingIn;
    }
    /**
     * Updates the state to [[FadingState.FadingOut]].
     * If previous state is [[FadingState.FadingOut]], [[FadingState.FadedOut]] or
     * [[FadingState.Undefined]] it remains unchanged.
     *
     * @param time - Current time.
     */
    startFadeOut(time) {
        if (this.m_state === FadingState.FadingOut ||
            this.m_state === FadingState.FadedOut ||
            this.m_state === FadingState.Undefined) {
            return;
        }
        if (this.m_state === FadingState.FadingIn) {
            // The fade-in is not complete: compute the virtual fadingStartTime in the past, to get
            // a correct end time:
            this.startTime = time - this.value * this.fadeTime;
            this.value = 1.0 - this.value;
        }
        else {
            this.startTime = time;
            this.value = 0.0;
            this.opacity = 1;
        }
        this.m_state = FadingState.FadingOut;
    }
    /**
     * Updates opacity to current time, changing the state to [[FadingState.FadedOut]] or
     * [[FadingState.FadedIn]] when the opacity becomes 0 or 1 respectively.
     * It does nothing if [[isFading]] !== `true`.
     *
     * @param time - Current time.
     * @param disableFading - `true` if fading is disabled, `false` otherwise.
     */
    updateFading(time, disableFading) {
        if (this.m_state !== FadingState.FadingIn && this.m_state !== FadingState.FadingOut) {
            return;
        }
        if (this.startTime === 0) {
            this.startTime = time;
        }
        const fadingTime = time - this.startTime;
        const startValue = this.m_state === FadingState.FadingIn ? 0 : 1;
        const endValue = this.m_state === FadingState.FadingIn ? 1 : 0;
        if (disableFading || fadingTime >= this.fadeTime) {
            this.value = 1.0;
            this.opacity = endValue;
            this.m_state =
                this.m_state === FadingState.FadingIn ? FadingState.FadedIn : FadingState.FadedOut;
        }
        else {
            // TODO: HARP-7648. Do this once for all labels (calculate the last frame value
            // increment).
            this.value = fadingTime / this.fadeTime;
            this.opacity = THREE.MathUtils.clamp(harp_utils_1.MathUtils.smootherStep(startValue, endValue, this.value), 0, 1);
            harp_utils_1.assert(this.isFading());
        }
    }
}
exports.RenderState = RenderState;
export default exports
//# sourceMappingURL=RenderState.js.map