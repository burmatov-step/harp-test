"use strict";
let exports = {}
exports.BoundsGenerator = void 0;
/*
 * Copyright (C) 2020-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
import harp_geoutils_1 from "@here/harp-geoutils";
import PlaneViewBounds_1 from "./PlaneViewBounds";
import SphereViewBounds_1 from "./SphereViewBounds";
/**
 * Generates Bounds for a camera view and a projection
 *
 * @internal
 */
class BoundsGenerator {
    constructor(m_view) {
        this.m_view = m_view;
        this.createViewBounds();
    }
    /**
     * Generates a {@link @here/harp-geoutils#GeoPolygon} covering the visible map.
     * The coordinates are sorted to ccw winding, so a polygon could be drawn with them.
     * @returns The GeoPolygon with the view bounds or undefined if world is not in view.
     */
    generate() {
        if (this.m_view.projection !== this.m_viewBounds.projection) {
            this.createViewBounds();
        }
        return this.m_viewBounds.generate();
    }
    createViewBounds() {
        this.m_viewBounds =
            this.m_view.projection.type === harp_geoutils_1.ProjectionType.Planar
                ? new PlaneViewBounds_1.PlaneViewBounds(this.m_view.camera, this.m_view.projection, this.m_view)
                : new SphereViewBounds_1.SphereViewBounds(this.m_view.camera, this.m_view.projection);
    }
}
exports.BoundsGenerator = BoundsGenerator;
export default exports
//# sourceMappingURL=BoundsGenerator.js.map