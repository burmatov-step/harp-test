"use strict";
let exports = {}
exports.PlacementStats = void 0;
class PlacementStats {
    constructor(m_logger) {
        this.m_logger = m_logger;
        this.totalGroups = 0;
        this.resortedGroups = 0;
        this.total = 0;
        this.uninitialized = 0;
        this.tooFar = 0;
        this.numNotVisible = 0;
        this.numPathTooSmall = 0;
        this.numCannotAdd = 0;
        this.numRenderedPoiIcons = 0;
        this.numRenderedPoiTexts = 0;
        this.numPoiTextsInvisible = 0;
        this.numRenderedTextElements = 0;
    }
    clear() {
        this.totalGroups = 0;
        this.resortedGroups = 0;
        this.total = 0;
        this.uninitialized = 0;
        this.tooFar = 0;
        this.numNotVisible = 0;
        this.numPathTooSmall = 0;
        this.numCannotAdd = 0;
        this.numRenderedPoiIcons = 0;
        this.numRenderedPoiTexts = 0;
        this.numPoiTextsInvisible = 0;
        this.numRenderedTextElements = 0;
    }
    log() {
        const numNotRendered = this.uninitialized +
            this.numPoiTextsInvisible +
            this.tooFar +
            this.numNotVisible +
            this.numCannotAdd;
        this.m_logger.debug("Total groups", this.totalGroups);
        this.m_logger.debug("Resorted groups", this.resortedGroups);
        this.m_logger.debug("Total labels", this.total);
        this.m_logger.debug("Rendered labels", this.numRenderedTextElements);
        this.m_logger.debug("Rejected labels", numNotRendered);
        this.m_logger.debug("Unitialized labels", this.uninitialized);
        this.m_logger.debug("Rendered poi icons", this.numRenderedPoiIcons);
        this.m_logger.debug("Rendered poi texts", this.numRenderedPoiTexts);
        this.m_logger.debug("Poi text invisible", this.numPoiTextsInvisible);
        this.m_logger.debug("Too far", this.tooFar);
        this.m_logger.debug("Not visible", this.numNotVisible);
        this.m_logger.debug("Path too small", this.numPathTooSmall);
        this.m_logger.debug("Rejected, max glyphs reached", this.numCannotAdd);
    }
}
exports.PlacementStats = PlacementStats;
export default exports
//# sourceMappingURL=PlacementStats.js.map