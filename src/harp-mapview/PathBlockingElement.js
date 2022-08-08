"use strict";
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.PathBlockingElement = void 0;
import * as THREE from "three"
/**
 * This path in world coordinates is projected to screen space and blocks all other labels.
 *
 * It could be used for example:
 * - Border rejects labels.
 * - Route blocks street labels from being rendered underneath.
 *
 * Could potentially be expanded in future to have a priority, however for now, this isn't required.
 */
class PathBlockingElement {
    /**
     * Constructs a path from a list of points.
     * Pre allocates the [[screenSpaceLines]] used to render.
     * @param points - Points in world coordinates.
     */
    constructor(points) {
        this.points = points;
        this.screenSpaceLines = new Array(points.length >= 2 ? points.length - 1 : 0);
        for (let i = 0; i < this.screenSpaceLines.length; i++) {
            this.screenSpaceLines[i] = new THREE.Line3(new THREE.Vector3(), new THREE.Vector3());
        }
    }
}
exports.PathBlockingElement = PathBlockingElement;

export default exports
//# sourceMappingURL=PathBlockingElement.js.map