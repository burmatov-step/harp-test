"use strict";
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CopyrightCoverageProvider = void 0;
const harp_utils_1 = require("@here/harp-utils");
const RBush = require("rbush");
/**
 * Base class to provide copyrights based on copyright coverage information, defined by geographical
 * bounding boxes and relevant zoom level ranges.
 */
class CopyrightCoverageProvider {
    constructor() {
        /** Logger instance. */
        this.logger = harp_utils_1.LoggerManager.instance.create("CopyrightCoverageProvider");
    }
    /** @inheritdoc */
    getTree() {
        if (this.m_cachedTreePromise !== undefined) {
            return this.m_cachedTreePromise;
        }
        this.m_cachedTreePromise = this.getCopyrightCoverageData()
            .then(coverageInfo => this.initRBush(coverageInfo))
            .catch(error => {
            this.logger.error(error);
            return new RBush();
        });
        return this.m_cachedTreePromise;
    }
    /** @inheritdoc */
    async getCopyrights(geoBox, level) {
        const tree = await this.getTree();
        const result = [];
        const matchingEntries = tree.search({
            minX: geoBox.west,
            minY: geoBox.south,
            maxX: geoBox.east,
            maxY: geoBox.north
        });
        for (const entry of matchingEntries) {
            const minLevel = harp_utils_1.getOptionValue(entry.minLevel, 0);
            const maxLevel = harp_utils_1.getOptionValue(entry.maxLevel, Infinity);
            if (level >= minLevel && level <= maxLevel) {
                if (result.find(item => item.id === entry.label) === undefined) {
                    result.push({ id: entry.label });
                }
            }
        }
        return result;
    }
    /**
     * Initializes RBush.
     *
     * @param entries - Entries for tree.
     * @returns RBush instance.
     */
    initRBush(entries) {
        const tree = new RBush();
        if (!entries) {
            this.logger.warn("No copyright coverage data provided");
            return tree;
        }
        for (const entry of entries) {
            const { minLevel, maxLevel, label, alt } = entry;
            if (!entry.boxes) {
                tree.insert({
                    minX: -180,
                    minY: -90,
                    maxX: 180,
                    maxY: 180,
                    minLevel,
                    maxLevel,
                    label,
                    alt
                });
            }
            else {
                for (const box of entry.boxes) {
                    const [minY, minX, maxY, maxX] = box;
                    tree.insert({
                        minX,
                        minY,
                        maxX,
                        maxY,
                        minLevel,
                        maxLevel,
                        label,
                        alt
                    });
                }
            }
        }
        return tree;
    }
}
exports.CopyrightCoverageProvider = CopyrightCoverageProvider;
//# sourceMappingURL=CopyrightCoverageProvider.js.map