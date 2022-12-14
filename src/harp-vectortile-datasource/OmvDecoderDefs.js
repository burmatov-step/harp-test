"use strict";
let exports = {}
exports.GEOJSON_TILER_SERVICE_TYPE = exports.VECTOR_TILE_DECODER_SERVICE_TYPE = exports.OmvGeometryType = exports.OmvFilterString = exports.FeatureModifierId = void 0;
/**
 * Feature Modifier ids to choose which OmvFeatureModifer should be used in OmvDecoder.
 */
var FeatureModifierId;
(function (FeatureModifierId) {
    /**
     * Generic feature modifier used when no other modifiers are defined.
     *
     * @note You do not need to specify it in [[OmvDataSourceParameters]] as it is added by default
     * if no other feature modifier is used.
     */
    FeatureModifierId[FeatureModifierId["default"] = 0] = "default";
})(FeatureModifierId = exports.FeatureModifierId || (exports.FeatureModifierId = {}));
/**
 * Adding the match condition type and the matching function to the namespace of `OmvFilterString`.
 */
var OmvFilterString;
(function (OmvFilterString) {
    /**
     * Match condition.
     */
    let StringMatch;
    (function (StringMatch) {
        /** Matches any. */
        StringMatch[StringMatch["Any"] = 0] = "Any";
        /** Exact match. */
        StringMatch[StringMatch["Match"] = 1] = "Match";
        /** Matches if a test string starts with a filter string. */
        StringMatch[StringMatch["StartsWith"] = 2] = "StartsWith";
        /** Matches if a test string contains a filter string. */
        StringMatch[StringMatch["Contains"] = 3] = "Contains";
        /** Matches if a test string ends with a filter string. */
        StringMatch[StringMatch["EndsWith"] = 4] = "EndsWith";
    })(StringMatch = OmvFilterString.StringMatch || (OmvFilterString.StringMatch = {}));
    /**
     * Check for a string against a filter.
     *
     * @param str - The string to check against a filter.
     * @param filterString - The filter containing the match condition.
     * @returns `true` if the match condition is satisfied.
     *
     * @internal
     */
    function matchString(str, filterString) {
        switch (filterString.match) {
            case OmvFilterString.StringMatch.Any:
                return true;
            case OmvFilterString.StringMatch.Match:
                return str === filterString.value;
            case OmvFilterString.StringMatch.StartsWith:
                return filterString.value.startsWith(str);
            case OmvFilterString.StringMatch.EndsWith:
                return filterString.value.endsWith(str);
            default:
                return str.includes(filterString.value);
        }
    }
    OmvFilterString.matchString = matchString;
})(OmvFilterString = exports.OmvFilterString || (exports.OmvFilterString = {}));
var OmvGeometryType;
(function (OmvGeometryType) {
    OmvGeometryType[OmvGeometryType["UNKNOWN"] = 0] = "UNKNOWN";
    OmvGeometryType[OmvGeometryType["POINT"] = 1] = "POINT";
    OmvGeometryType[OmvGeometryType["LINESTRING"] = 2] = "LINESTRING";
    OmvGeometryType[OmvGeometryType["POLYGON"] = 3] = "POLYGON";
})(OmvGeometryType = exports.OmvGeometryType || (exports.OmvGeometryType = {}));
/**
 * Vector tile decoder service type id.
 *
 * @remarks
 * Used for requesting decoder services using `WorkerServiceManager`.
 *
 * @internal
 */
exports.VECTOR_TILE_DECODER_SERVICE_TYPE = "vector-tile-decoder";
/**
 * GeoJson tiler service type id.
 *
 * @remarks
 * Used for requesting tiler services using `WorkerServiceManager`.
 *
 * @internal
 */
exports.GEOJSON_TILER_SERVICE_TYPE = "geojson-tiler";
//# sourceMappingURL=OmvDecoderDefs.js.map
export default exports