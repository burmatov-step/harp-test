"use strict";
/*
 * Copyright (C) 2018-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.PickingRaycaster = void 0;
import * as THREE from "three"
import MapObjectAdapter_1 from "./MapObjectAdapter"
function intersectObject(object, raycaster, intersects, recursive) {
    if (object.layers.test(raycaster.layers) && object.visible) {
        const mapObjectAdapter = MapObjectAdapter_1.MapObjectAdapter.get(object);
        if (!mapObjectAdapter || mapObjectAdapter.isPickable()) {
            object.raycast(raycaster, intersects);
        }
    }
    if (recursive === true) {
        for (const child of object.children) {
            intersectObject(child, raycaster, intersects, true);
        }
    }
}
/**
 * Raycasting points is not supported as necessary in Three.js. This class extends a
 * [[THREE.Raycaster]] and adds the width / height of the canvas to allow picking of screen space
 * geometry.
 *
 * @internal
 */
class PickingRaycaster extends THREE.Raycaster {
    /**
     * Constructor.
     *
     * @param canvasSize - the canvas width and height.
     */
    constructor(canvasSize) {
        super();
        this.canvasSize = canvasSize;
    }
    // HARP-9585: Override of base class method, however tslint doesn't recognize overrides of
    // three.js classes.
    intersectObject(object, recursive, optionalTarget) {
        const intersects = optionalTarget !== null && optionalTarget !== void 0 ? optionalTarget : [];
        intersectObject(object, this, intersects, recursive);
        return intersects;
    }
    // HARP-9585: Override of base class method, however tslint doesn't recognize overrides of
    // three.js classes.
    intersectObjects(objects, recursive, optionalTarget) {
        const intersects = optionalTarget !== null && optionalTarget !== void 0 ? optionalTarget : [];
        for (const object of objects) {
            intersectObject(object, this, intersects, recursive);
        }
        return intersects;
    }
}
exports.PickingRaycaster = PickingRaycaster;
export default exports
//# sourceMappingURL=PickingRaycaster.js.map