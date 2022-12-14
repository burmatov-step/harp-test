"use strict";
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.SimplePath = exports.PathParam = exports.SimpleLineCurve = void 0;
import * as THREE from "three"
/**
 * @hidden
 */
class SimpleLineCurve extends THREE.LineCurve {
    constructor(v1, v2) {
        super(v1, v2);
    }
    getLengths() {
        if (this.m_lengths === undefined) {
            this.m_lengths = [0, this.v2.distanceTo(this.v1)];
        }
        return this.m_lengths;
    }
}
exports.SimpleLineCurve = SimpleLineCurve;
/**
 * @hidden
 */
class PathParam {
    constructor(path, index, t) {
        this.path = path;
        this.index = index;
        this.t = t;
    }
    get curve() {
        return this.path.curves[this.index];
    }
    get point() {
        if (this.m_point === undefined) {
            this.m_point = this.curve.getPoint(this.t);
        }
        return this.m_point;
    }
}
exports.PathParam = PathParam;
/**
 * @hidden
 */
class SimplePath extends THREE.Path {
    constructor() {
        super();
    }
    getLengths() {
        if (this.m_cache) {
            return this.m_cache;
        }
        let sum = 0;
        const lengths = new Array();
        lengths.push(0);
        this.curves.forEach(curve => {
            const lineCurve = curve;
            sum += lineCurve.v1.distanceTo(lineCurve.v2);
            lengths.push(sum);
        });
        this.m_cache = lengths;
        return lengths;
    }
    getParamAt(t) {
        const distance = t * this.getLength();
        const curveLengths = this.getCurveLengths();
        for (let index = 0; index < curveLengths.length; ++index) {
            if (curveLengths[index] < distance) {
                continue;
            }
            const diff = curveLengths[index] - distance;
            const curve = this.curves[index];
            const segmentLength = curve.getLength();
            const u = segmentLength === 0 ? 0 : 1 - diff / segmentLength;
            return new PathParam(this, index, u);
        }
        return null;
    }
}
exports.SimplePath = SimplePath;
export default exports
//# sourceMappingURL=SimplePath.js.map