"use strict";
/*
 * Copyright (C) 2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.FixedClipPlanesEvaluator = void 0;
/**
 * Provides the most basic evaluation concept giving fixed values with some constraints.
 */
class FixedClipPlanesEvaluator {
    constructor(minNear = 1, minFarOffset = 10) {
        this.minNear = minNear;
        this.minFarOffset = minFarOffset;
        this.minFar = minNear + minFarOffset;
        this.m_nearPlane = minNear;
        this.m_farPlane = this.minFar;
    }
    get nearPlane() {
        return this.m_nearPlane;
    }
    set nearPlane(fixedNear) {
        this.invalidatePlanes(fixedNear, this.m_farPlane);
    }
    get farPlane() {
        return this.m_farPlane;
    }
    set farPlane(fixedFar) {
        this.invalidatePlanes(this.m_nearPlane, fixedFar);
    }
    set minElevation(elevation) { }
    get minElevation() {
        // This evaluator does not support elevation so its always set to 0.
        return 0;
    }
    set maxElevation(elevation) { }
    get maxElevation() {
        // This evaluator does not support elevation so its always set to 0.
        return 0;
    }
    /** @override */
    evaluateClipPlanes(camera, projection, elevationProvider) {
        // We do not need to perform actual evaluation cause results are precomputed and
        // kept stable until somebody changes the properties.
        const viewRanges = {
            near: this.m_nearPlane,
            far: this.m_farPlane,
            minimum: this.minNear,
            maximum: this.m_farPlane
        };
        return viewRanges;
    }
    invalidatePlanes(near, far) {
        // When clamping prefer to extend far plane at about minimum distance, giving
        // near distance setup priority over far.
        const nearDist = Math.max(this.minNear, near);
        const farDist = Math.max(this.minFar, far, nearDist + this.minFarOffset);
        this.m_nearPlane = nearDist;
        this.m_farPlane = farDist;
    }
}
exports.FixedClipPlanesEvaluator = FixedClipPlanesEvaluator;
export default exports
//# sourceMappingURL=FixedClipPlanesEvaluator.js.map