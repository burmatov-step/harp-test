"use strict";
let exports = {}
exports.CalculationStatus = void 0;
/**
 * Status of the elevation range calculation.
 */
var CalculationStatus;
(function (CalculationStatus) {
    // Calculated approximately. A more precise result may be available later.
    CalculationStatus[CalculationStatus["PendingApproximate"] = 0] = "PendingApproximate";
    // Calculation completed. The result is final, won't improve upon retrying.
    CalculationStatus[CalculationStatus["FinalPrecise"] = 1] = "FinalPrecise";
})(CalculationStatus = exports.CalculationStatus || (exports.CalculationStatus = {}));
//# sourceMappingURL=ElevationRangeSource.js.map

export default exports