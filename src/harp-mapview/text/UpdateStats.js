"use strict";
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.UpdateStats = void 0;
import Placement_1 from "./Placement"
class UpdateStats {
    constructor(m_logger) {
        this.m_logger = m_logger;
        this.tiles = 0;
        this.totalGroups = 0;
        this.newGroups = 0;
        this.totalLabels = 0;
        this.results = new Array(Placement_1.PrePlacementResult.Count);
        this.results.fill(0);
    }
    clear() {
        this.tiles = 0;
        this.totalGroups = 0;
        this.newGroups = 0;
        this.totalLabels = 0;
        this.results.fill(0);
    }
    log() {
        this.m_logger.debug("Tiles", this.tiles);
        this.m_logger.debug("Total groups", this.totalGroups);
        this.m_logger.debug("New groups", this.newGroups);
        this.m_logger.debug("Total labels", this.totalLabels);
        this.m_logger.debug("Placed labels", this.results[Placement_1.PrePlacementResult.Ok]);
        this.m_logger.debug("Invisible", this.results[Placement_1.PrePlacementResult.Invisible]);
        this.m_logger.debug("Poi not ready", this.results[Placement_1.PrePlacementResult.NotReady]);
        this.m_logger.debug("Too far", this.results[Placement_1.PrePlacementResult.TooFar]);
        this.m_logger.debug("Duplicate", this.results[Placement_1.PrePlacementResult.Duplicate]);
    }
}
exports.UpdateStats = UpdateStats;
//# sourceMappingURL=UpdateStats.js.map
export default exports