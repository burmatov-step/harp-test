"use strict";
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CopyrightElementHandler = void 0;
const harp_utils_1 = require("@here/harp-utils");
const MapView_1 = require("../MapView");
const CopyrightInfo_1 = require("./CopyrightInfo");
/**
 * Helper class that maintains up-to-date {@link MapView} copyright information in DOM element.
 *
 * @example
 *
 *     // HTML snippet
 *     <div id="copyrightNotice" style="position:absolute; right:0; bottom:0; z-index:100"></div>
 *
 *     // JavaScript
 *     const mapView = new MapView({ ... });
 *     CopyrightElementHandler.install("copyrightNotice", mapView);
 */
class CopyrightElementHandler {
    /**
     * Creates a new `CopyrightElementHandler` that updates the DOM element with the copyright info
     * of the given `mapView`.
     *
     * Note: Generally, the static [[install]] method can be used to create and attach a new
     * `CopyrightElementHandler` to a {@link MapView}
     *
     * @param element - HTML DOM element or a HTML DOM element id
     * @param mapView - optional, [[attach]] to this {@link MapView} instance
     */
    constructor(element, mapView) {
        this.m_defaults = new Map();
        this.m_mapViews = [];
        /**
         * Update copyright info text in controlled HTML element.
         */
        this.update = () => {
            var _a;
            const mergedCopyrightInfo = this.m_mapViews
                .map(mapView => mapView.copyrightInfo)
                .reduce(CopyrightInfo_1.CopyrightInfo.mergeArrays, (_a = this.staticInfo) !== null && _a !== void 0 ? _a : []);
            // Conditionally hiding of element with copyright information.
            // If nothing to show we schould to avoid empty white rectangle in right bottom corner.
            if (mergedCopyrightInfo.length === 0) {
                this.m_element.style.display = "none";
                return;
            }
            else {
                this.m_element.style.display = "block";
            }
            if (this.m_defaults.size !== 0) {
                for (const sourceInfo of mergedCopyrightInfo) {
                    const defaults = this.m_defaults.get(sourceInfo.id);
                    if (defaults !== undefined) {
                        sourceInfo.year = harp_utils_1.getOptionValue(sourceInfo.year, defaults.year);
                        sourceInfo.label = harp_utils_1.getOptionValue(sourceInfo.label, defaults.label);
                        sourceInfo.link = harp_utils_1.getOptionValue(sourceInfo.link, defaults.link);
                    }
                }
            }
            const deduped = CopyrightInfo_1.CopyrightInfo.mergeArrays(mergedCopyrightInfo);
            this.m_element.innerHTML = CopyrightInfo_1.CopyrightInfo.formatAsHtml(deduped);
        };
        if (typeof element === "string") {
            const htmlElement = document.getElementById(element);
            if (!htmlElement) {
                throw new Error(`CopyrightElementHandler: unable to find DOM element #${element}`);
            }
            this.m_element = htmlElement;
        }
        else {
            this.m_element = element;
        }
        if (mapView !== undefined) {
            this.attach(mapView);
        }
    }
    /**
     * Install {@link CopyrightElementHandler} on DOM element and - optionally -
     * attach to a {@link MapView} instance.
     *
     * @param element - HTML DOM element or a HTML DOM element id
     * @param mapView -, optional, [[attach]] to this {@link MapView}
     */
    static install(element, mapView) {
        return new CopyrightElementHandler(element, mapView);
    }
    /**
     * Destroys this object by removing all event listeners from the attached {@link MapView}s.
     */
    destroy() {
        for (const mapView of this.m_mapViews) {
            mapView.removeEventListener(MapView_1.MapViewEventNames.CopyrightChanged, this.update);
        }
    }
    /**
     * Attaches this {@link CopyrightInfo} updates from {@link MapView} instance.
     */
    attach(mapView) {
        this.m_mapViews.push(mapView);
        mapView.addEventListener(MapView_1.MapViewEventNames.CopyrightChanged, this.update);
        this.update();
        return this;
    }
    /**
     * Stop following {@link CopyrightInfo} updates from {@link MapView} instance.
     */
    detach(mapView) {
        mapView.removeEventListener(MapView_1.MapViewEventNames.CopyrightChanged, this.update);
        this.m_mapViews = this.m_mapViews.filter(item => item !== mapView);
        this.update();
        return this;
    }
    /**
     * Set {@link CopyrightInfo} defaults to be used in case
     * {@link DataSource} does not provide deatailed
     * copyright information.
     *
     * @remarks
     * The defaults will applied to all undefined `year`, `label` and `link` values in the copyright
     * information retrieved from {@link MapView}.
     */
    setDefaults(defaults) {
        this.m_defaults.clear();
        if (defaults !== undefined) {
            for (const item of defaults) {
                this.m_defaults.set(item.id, item);
            }
        }
        return this;
    }
    /**
     * Sets the [[staticInfo]] property.
     *
     * A `CopyrightElementHandler` always displays a deduplicated sum of static copyright info and
     * copyright information obtained from attached {@link MapView}s.
     *
     * This information is used when {@link DataSource}
     * instances of given {@link MapView} do not provide
     * copyright information.
     */
    setStaticCopyightInfo(staticInfo) {
        this.staticInfo = staticInfo;
        return this;
    }
}
exports.CopyrightElementHandler = CopyrightElementHandler;
//# sourceMappingURL=CopyrightElementHandler.js.map