"use strict";
/*
 * Copyright (C) 2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.MAX_FOV_RAD = exports.MIN_FOV_RAD = exports.MAX_FOV_DEG = exports.MIN_FOV_DEG = exports.DEFAULT_FOV_CALCULATION = void 0;
import * as THREE from "three"
exports.DEFAULT_FOV_CALCULATION = { type: "dynamic", fov: 40 };
exports.MIN_FOV_DEG = 10;
exports.MAX_FOV_DEG = 140;
exports.MIN_FOV_RAD = THREE.MathUtils.degToRad(exports.MIN_FOV_DEG);
exports.MAX_FOV_RAD = THREE.MathUtils.degToRad(exports.MAX_FOV_DEG);

export default exports
//# sourceMappingURL=FovCalculation.js.map