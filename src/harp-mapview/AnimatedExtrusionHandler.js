"use strict";
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.AnimatedExtrusionHandler = exports.AnimatedExtrusionState = void 0;
import * as harp_datasource_protocol_1 from "@here/harp-datasource-protocol";
import * as harp_materials_1 from "@here/harp-materials";
import * as harp_utils_1 from "@here/harp-utils";

/**
 * Animation states for extrusion effect
 */
var AnimatedExtrusionState;
(function (AnimatedExtrusionState) {
    AnimatedExtrusionState[AnimatedExtrusionState["None"] = 0] = "None";
    AnimatedExtrusionState[AnimatedExtrusionState["Started"] = 1] = "Started";
    AnimatedExtrusionState[AnimatedExtrusionState["Finished"] = 2] = "Finished";
})(AnimatedExtrusionState = exports.AnimatedExtrusionState || (exports.AnimatedExtrusionState = {}));
const DEFAULT_EXTRUSION_DURATION = 750; // milliseconds
const DEFAULT_MIN_ZOOM_LEVEL = 1;
/**
 * Handles animated extrusion effect of the buildings in {@link MapView}.
 */
class AnimatedExtrusionHandler {
    /**
     * Creates an {@link AnimatedExtrusionHandler} in {@link MapView}.
     *
     * @param m_mapView - Instance of {@link MapView} on which the animation will run.
     */
    constructor(m_mapView) {
        this.m_mapView = m_mapView;
        /**
         * Animate the extrusion of the buildings if set to `true`.
         */
        this.enabled = true;
        /**
         * Duration of the building's extrusion in milliseconds
         */
        this.duration = DEFAULT_EXTRUSION_DURATION;
        this.m_minZoomLevel = DEFAULT_MIN_ZOOM_LEVEL;
        this.m_forceEnabled = false;
        this.m_dataSourceMap = new Map();
        this.m_state = AnimatedExtrusionState.None;
        this.m_startTime = -1;
    }
    /**
     * Returns whether the extrusion animation is force enabled or not.
     */
    get forceEnabled() {
        return this.m_forceEnabled;
    }
    /**
     * If `forceEnabled` is set to `true` then `animateExtrusion` and `animateExtrusionDuration`
     * values from [[extrudedPolygonTechnique]] will be ignored and
     * `AnimatedExtrusionHandler.enabled` with `AnimatedExtrusionHandler.duration` will be used
     */
    set forceEnabled(force) {
        this.m_forceEnabled = force;
        this.duration = DEFAULT_EXTRUSION_DURATION;
    }
    /**
     * Gets min zoom level at which extruded animation is enabled.
     */
    get minZoomLevel() {
        return this.m_minZoomLevel;
    }
    /**
     * Sets the extrusion animation properties obtained from a given technique.
     * @internal
     * @param technique - The technique where the extrusion animation properties are defined.
     * @param env - The environment used to evaluate technique properties.
     * @returns True if the technique has animation enabled (or animation is forced), false
     * otherwise.
     */
    setAnimationProperties(technique, env) {
        if (!harp_datasource_protocol_1.isExtrudedPolygonTechnique(technique)) {
            return false;
        }
        if (technique.hasOwnProperty("minZoomLevel")) {
            this.m_minZoomLevel = technique.minZoomLevel;
        }
        if (this.forceEnabled) {
            return this.enabled;
        }
        if (technique.animateExtrusionDuration !== undefined) {
            this.duration = technique.animateExtrusionDuration;
        }
        const animateExtrusionValue = harp_datasource_protocol_1.getPropertyValue(technique.animateExtrusion, env);
        if (animateExtrusionValue === null) {
            return this.enabled;
        }
        return typeof animateExtrusionValue === "boolean"
            ? animateExtrusionValue
            : typeof animateExtrusionValue === "number"
                ? animateExtrusionValue !== 0
                : false;
    }
    /**
     * Updates the extrusion animation for every frame.
     * @internal
     */
    update(zoomLevel) {
        const extrusionVisible = this.m_dataSourceMap.size > 0 && zoomLevel >= this.m_minZoomLevel;
        if (this.m_state === AnimatedExtrusionState.None && extrusionVisible) {
            this.m_state = AnimatedExtrusionState.Started;
        }
        else if (this.m_state !== AnimatedExtrusionState.None && !extrusionVisible) {
            this.resetAnimation(true);
        }
        this.animateExtrusion();
    }
    /**
     * Adds a tile to be animated.
     * @internal
     * @param tile - The tile to be animated.
     * @param materials - Extruded materials belonging to the tile.
     */
    add(tile, materials) {
        tile.addDisposeCallback(this.removeTile.bind(this));
        let animated = false;
        if (this.m_state !== AnimatedExtrusionState.None) {
            animated = this.skipAnimation(tile);
            if (animated) {
                // Set extrusion ratio to 1 if the tile skips the animation.
                this.setTileExtrusionRatio(materials, 1);
            }
            else if (this.m_state === AnimatedExtrusionState.Finished) {
                // Otherwise, if animation was finished, restart animation but leave already
                //  animated tiles untouched.
                this.resetAnimation(false);
            }
        }
        this.getOrCreateTileMap(tile.dataSource).set(tile.tileKey.mortonCode(), {
            materials,
            animated
        });
    }
    /**
     * Is `true` if there's any extrusion animation ongoing.
     */
    get isAnimating() {
        return (this.m_state !== AnimatedExtrusionState.Finished &&
            this.m_state !== AnimatedExtrusionState.None);
    }
    getTileMap(dataSource, create = false) {
        return this.m_dataSourceMap.get(dataSource);
    }
    getOrCreateTileMap(dataSource) {
        let tileMap = this.m_dataSourceMap.get(dataSource);
        if (!tileMap) {
            tileMap = new Map();
            this.m_dataSourceMap.set(dataSource, tileMap);
        }
        return tileMap;
    }
    skipAnimation(tile) {
        return this.wasAnyAncestorAnimated(tile) || this.wasAnyDescendantAnimated(tile);
    }
    wasAnyAncestorAnimated(tile) {
        var _a, _b;
        const minLevel = tile.dataSource.getDataZoomLevel(this.m_minZoomLevel);
        const distanceToMinLevel = Math.max(0, tile.tileKey.level - minLevel);
        const levelsUp = Math.min(distanceToMinLevel, this.m_mapView.visibleTileSet.options.quadTreeSearchDistanceUp);
        const tileMap = this.getTileMap(tile.dataSource);
        if (!tileMap) {
            return false;
        }
        let lastTileKey = tile.tileKey;
        for (let deltaUp = 1; deltaUp <= levelsUp; ++deltaUp) {
            lastTileKey = lastTileKey.parent();
            if ((_b = (_a = tileMap.get(lastTileKey.mortonCode())) === null || _a === void 0 ? void 0 : _a.animated) !== null && _b !== void 0 ? _b : false) {
                return true;
            }
        }
        return false;
    }
    wasAnyDescendantAnimated(tile) {
        var _a, _b;
        const distanceToMaxLevel = tile.dataSource.maxDataLevel - tile.tileKey.level;
        const levelsDown = Math.min(distanceToMaxLevel, this.m_mapView.visibleTileSet.options.quadTreeSearchDistanceDown);
        const tileMap = this.getTileMap(tile.dataSource);
        if (!tileMap) {
            return false;
        }
        const tilingScheme = tile.dataSource.getTilingScheme();
        let nextTileKeys = [tile.tileKey];
        let childTileKeys = [];
        for (let deltaDown = 1; deltaDown <= levelsDown; ++deltaDown) {
            childTileKeys.length = 0;
            for (const tileKey of nextTileKeys) {
                for (const childTileKey of tilingScheme.getSubTileKeys(tileKey)) {
                    if ((_b = (_a = tileMap.get(childTileKey.mortonCode())) === null || _a === void 0 ? void 0 : _a.animated) !== null && _b !== void 0 ? _b : false) {
                        return true;
                    }
                    childTileKeys.push(childTileKey);
                }
            }
            // swap
            [nextTileKeys, childTileKeys] = [childTileKeys, nextTileKeys];
        }
        return false;
    }
    removeTile(tile) {
        const tileMap = this.getTileMap(tile.dataSource);
        if (!tileMap) {
            return;
        }
        tileMap.delete(tile.tileKey.mortonCode());
        // Remove tile map if it's empty. That way, counting the number of data sources in the
        // map is enough to know if there's any tile.
        if (tileMap.size === 0) {
            this.m_dataSourceMap.delete(tile.dataSource);
        }
    }
    animateExtrusion() {
        if (this.m_state !== AnimatedExtrusionState.Started) {
            return;
        }
        const currentTime = Date.now();
        if (this.m_startTime < 0) {
            this.m_startTime = currentTime;
        }
        const duration = this.duration;
        const timeProgress = Math.min(currentTime - this.m_startTime, duration);
        const extrusionRatio = harp_utils_1.MathUtils.easeInOutCubic(harp_materials_1.ExtrusionFeatureDefs.DEFAULT_RATIO_MIN, harp_materials_1.ExtrusionFeatureDefs.DEFAULT_RATIO_MAX, timeProgress / duration);
        this.setExtrusionRatio(extrusionRatio);
        if (timeProgress >= duration) {
            this.m_state = AnimatedExtrusionState.Finished;
        }
        this.m_mapView.update();
    }
    resetAnimation(resetTiles) {
        this.m_state = AnimatedExtrusionState.None;
        this.m_startTime = -1;
        if (resetTiles) {
            this.m_dataSourceMap.forEach(tileMap => {
                tileMap.forEach(state => {
                    state.animated = false;
                });
            });
        }
    }
    setExtrusionRatio(value) {
        this.m_dataSourceMap.forEach(tileMap => {
            tileMap.forEach(state => {
                if (!state.animated) {
                    this.setTileExtrusionRatio(state.materials, value);
                    if (value >= 1) {
                        state.animated = true;
                    }
                }
            });
        });
    }
    setTileExtrusionRatio(materials, value) {
        materials.forEach(material => {
            material.extrusionRatio = value;
        });
    }
}
exports.AnimatedExtrusionHandler = AnimatedExtrusionHandler;
export default exports
//# sourceMappingURL=AnimatedExtrusionHandler.js.map