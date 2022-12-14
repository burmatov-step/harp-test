"use strict";
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.CopyrightInfo = void 0;
import * as harp_utils_1 from "@here/harp-utils"
var CopyrightInfo;
(function (CopyrightInfo) {
    /**
     * Merge {@link CopyrightInfo} arrays, removing duplicates.
     *
     * `id` and `label` are considered keys in deduplication algorithm.
     *
     * @param sources - non-duplicate elements from this array are added to `target`
     * @returns merge of all copyright infos in `sources`
     */
    function mergeArrays(a, b) {
        const result = [];
        for (const source of [a, b]) {
            if (source === undefined) {
                continue;
            }
            for (const sourceInfo of source) {
                const existingInfo = result.find(findItem => findItem.id === sourceInfo.id ||
                    (findItem.label !== undefined && findItem.label === sourceInfo.label));
                if (existingInfo === undefined) {
                    result.push(Object.assign({}, sourceInfo));
                }
                else {
                    existingInfo.year = harp_utils_1.MathUtils.max2(sourceInfo.year, existingInfo.year);
                    existingInfo.label = harp_utils_1.getOptionValue(sourceInfo.label, existingInfo.label);
                    existingInfo.link = harp_utils_1.getOptionValue(sourceInfo.link, existingInfo.link);
                }
            }
        }
        return result;
    }
    CopyrightInfo.mergeArrays = mergeArrays;
    /**
     * Format copyright information to a HTML string that can be displayed in the UI.
     *
     * * Empty list returns empty string.
     * * Entries with empty (but defined) labels are skipped.
     *
     * @param copyrightInfo - Array of copyrights to format.
     */
    function formatAsHtml(copyrightInfo) {
        if (copyrightInfo.length === 0) {
            return "";
        }
        const filtered = copyrightInfo.filter(entry => entry.label !== "");
        if (filtered.length === 0) {
            return "";
        }
        return ("?? " +
            filtered
                .map(entry => {
                var _a;
                const label = (_a = entry.label) !== null && _a !== void 0 ? _a : entry.id;
                const text = entry.year !== undefined ? `${entry.year} ${label}` : label;
                const link = entry.link;
                return link
                    ? `<a href="${link}" target="_blank" rel="noreferrer noopener">${text}</a>`
                    : `${text}`;
            })
                .join(", "));
    }
    CopyrightInfo.formatAsHtml = formatAsHtml;
})(CopyrightInfo = exports.CopyrightInfo || (exports.CopyrightInfo = {}));
//# sourceMappingURL=CopyrightInfo.js.map
export default exports