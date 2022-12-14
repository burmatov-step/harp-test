"use strict";
let exports = {}
exports.TileGeometryLoader = exports.TileGeometryLoaderState = void 0;
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
import * as harp_datasource_protocol_1 from "@here/harp-datasource-protocol";
import * as harp_utils_1 from "@here/harp-utils";
import MapView_1 from "../MapView";
import Statistics_1 from "../Statistics";
import TileGeometryCreator_1 from "./TileGeometryCreator";

function addDiscardedTileToStats(tile) {
    const stats = Statistics_1.PerformanceStatistics.instance;
    if (stats.enabled) {
        const name = tile.dataSource.name;
        const level = tile.tileKey.level;
        const col = tile.tileKey.column;
        const row = tile.tileKey.row;
        const reason = tile.disposed ? `disposed` : `invisible`;
        stats.currentFrame.addMessage(`Decoded tile: ${name} # lvl=${level} col=${col} row=${row} DISCARDED - ${reason}`);
    }
}
/**
 * The state the {@link TileGeometryLoader}.
 */
var TileGeometryLoaderState;
(function (TileGeometryLoaderState) {
    TileGeometryLoaderState[TileGeometryLoaderState["Initialized"] = 0] = "Initialized";
    TileGeometryLoaderState[TileGeometryLoaderState["CreationQueued"] = 1] = "CreationQueued";
    TileGeometryLoaderState[TileGeometryLoaderState["CreatingGeometry"] = 2] = "CreatingGeometry";
    TileGeometryLoaderState[TileGeometryLoaderState["Finished"] = 3] = "Finished";
    TileGeometryLoaderState[TileGeometryLoaderState["Canceled"] = 4] = "Canceled";
    TileGeometryLoaderState[TileGeometryLoaderState["Disposed"] = 5] = "Disposed";
})(TileGeometryLoaderState = exports.TileGeometryLoaderState || (exports.TileGeometryLoaderState = {}));
/**
 * Loads the geometry for its {@link Tile}. Loads all geometry in a single step.
 * @internal
 */
class TileGeometryLoader {
    constructor(m_tile, m_taskQueue) {
        this.m_tile = m_tile;
        this.m_taskQueue = m_taskQueue;
        this.m_priority = 0;
        this.m_state = TileGeometryLoaderState.Initialized;
        this.m_finishedPromise = new Promise((resolve, reject) => {
            this.m_resolveFinishedPromise = resolve;
            this.m_rejectFinishedPromise = reject;
        });
    }
    /**
     * Make sure that all technique have their geometryKind set, either from the theme or their
     * default value.
     *
     * Also gather set of the [[GeometryKind]]s found in the techniques and return it.
     *
     * @param {DecodedTile} decodedTile
     * @returns {GeometryKindSet} The set of kinds used in the decodeTile.
     */
    static prepareAvailableGeometryKinds(decodedTile) {
        const foundSet = new harp_datasource_protocol_1.GeometryKindSet();
        for (const technique of decodedTile.techniques) {
            const geometryKind = TileGeometryLoader.compileGeometryKind(technique);
            if (geometryKind instanceof Set) {
                for (const kind of geometryKind) {
                    foundSet.add(kind);
                }
            }
            else {
                foundSet.add(geometryKind);
            }
        }
        return foundSet;
    }
    /**
     * Make sure that the technique has its geometryKind set, either from the theme or their default
     * value.
     *
     * @param {Technique} technique
     */
    static compileGeometryKind(technique) {
        let geometryKind = technique.kind;
        // Set default kind based on technique.
        if (geometryKind === undefined) {
            if (harp_datasource_protocol_1.isFillTechnique(technique)) {
                geometryKind = harp_datasource_protocol_1.GeometryKind.Area;
            }
            else if (harp_datasource_protocol_1.isLineTechnique(technique) ||
                harp_datasource_protocol_1.isSolidLineTechnique(technique) ||
                harp_datasource_protocol_1.isSegmentsTechnique(technique) ||
                harp_datasource_protocol_1.isExtrudedLineTechnique(technique)) {
                geometryKind = harp_datasource_protocol_1.GeometryKind.Line;
            }
            else if (harp_datasource_protocol_1.isExtrudedPolygonTechnique(technique)) {
                geometryKind = harp_datasource_protocol_1.GeometryKind.Building;
            }
            else if (harp_datasource_protocol_1.isPoiTechnique(technique) ||
                harp_datasource_protocol_1.isLineMarkerTechnique(technique) ||
                harp_datasource_protocol_1.isTextTechnique(technique)) {
                geometryKind = harp_datasource_protocol_1.GeometryKind.Label;
            }
            else {
                geometryKind = harp_datasource_protocol_1.GeometryKind.All;
            }
            technique.kind = geometryKind;
        }
        else if (Array.isArray(geometryKind)) {
            geometryKind = technique.kind = new harp_datasource_protocol_1.GeometryKindSet(geometryKind);
        }
        return geometryKind;
    }
    set priority(value) {
        this.m_priority = value;
    }
    //This is not a getter as it need to be bound to this for the taskqueue
    getPriority() {
        return this.m_priority;
    }
    /**
     * The {@link Tile} this `TileGeometryLoader` is managing.
     */
    get tile() {
        return this.m_tile;
    }
    /**
     * `True` if a decoded Tile is set
     */
    get hasDecodedTile() {
        return this.m_decodedTile !== undefined;
    }
    /**
     * `True` if all geometry of the `Tile` has been loaded and the loading process is finished.
     */
    get isFinished() {
        return this.m_state === TileGeometryLoaderState.Finished;
    }
    /**
     * `True` if loader is finished, canceled or disposed.
     */
    get isSettled() {
        return this.isFinished || this.isCanceled || this.isDisposed;
    }
    /**
     * Returns a promise resolved when this `TileGeometryLoader` is in
     * `TileGeometryLoaderState.Finished` state, or rejected when it's in
     * `TileGeometryLoaderState.Cancelled` or `TileGeometryLoaderState.Disposed` states.
     */
    waitFinished() {
        return this.m_finishedPromise;
    }
    /**
     * Set the {@link @here/harp-datasource-protocol#DecodedTile} of the tile.
     *
     * @remarks
     * Is called after the decoded tile has been loaded, and
     * prepares its content for later processing in the 'updateXXX' methods.
     *
     * @param {DecodedTile} decodedTile The decoded tile with the flat geometry data belonging to
     *      this tile.
     * @returns {DecodedTile} The processed decoded tile.
     */
    setDecodedTile(decodedTile) {
        this.m_decodedTile = decodedTile;
        if (this.hasDecodedTile) {
            this.m_availableGeometryKinds = TileGeometryLoader.prepareAvailableGeometryKinds(this.m_decodedTile);
        }
        return this.m_decodedTile;
    }
    /**
     * The kinds of geometry stored in this {@link Tile}.
     */
    get availableGeometryKinds() {
        return this.m_availableGeometryKinds;
    }
    /**
     * Start with or continue with loading geometry. Called repeatedly until `isFinished` is `true`.
     */
    update(enabledKinds, disabledKinds) {
        const tile = this.tile;
        // Geometry kinds have changed but some is already created, so reset
        if (this.tile.hasGeometry && !this.compareGeometryKinds(enabledKinds, disabledKinds)) {
            this.reset();
        }
        // First time this tile is handled, or reset has been requested.
        if ((this.m_state === TileGeometryLoaderState.Initialized ||
            this.m_state === TileGeometryLoaderState.Canceled) &&
            tile.decodedTile !== undefined) {
            if (this.m_state === TileGeometryLoaderState.Initialized) {
                TileGeometryCreator_1.TileGeometryCreator.instance.processTechniques(tile, enabledKinds, disabledKinds);
                this.setGeometryKinds(enabledKinds, disabledKinds);
                this.setDecodedTile(tile.decodedTile);
            }
            this.queueGeometryCreation(enabledKinds, disabledKinds);
        }
    }
    /**
     * Cancel geometry loading.
     */
    cancel() {
        var _a;
        addDiscardedTileToStats(this.tile);
        this.m_state = TileGeometryLoaderState.Canceled;
        (_a = this.m_rejectFinishedPromise) === null || _a === void 0 ? void 0 : _a.call(this);
    }
    /**
     * Dispose of any resources.
     */
    dispose() {
        var _a;
        addDiscardedTileToStats(this.tile);
        this.clear();
        this.m_state = TileGeometryLoaderState.Disposed;
        (_a = this.m_rejectFinishedPromise) === null || _a === void 0 ? void 0 : _a.call(this);
    }
    /**
     * Reset the loader to its initial state and cancels any asynchronous work.
     * @remarks
     * This method prepares the loader to reload new geometry. Since the loader does not transition
     * to a final state, the promise returned by {@link TileGeometryLoader.waitFinished} is not
     * settled.
     */
    reset() {
        this.clear();
        if (this.isSettled) {
            this.m_finishedPromise = new Promise((resolve, reject) => {
                this.m_resolveFinishedPromise = resolve;
                this.m_rejectFinishedPromise = reject;
            });
        }
        this.m_state = TileGeometryLoaderState.Initialized;
    }
    /**
     * Finish geometry loading.
     */
    finish() {
        var _a;
        this.m_decodedTile = undefined;
        this.m_state = TileGeometryLoaderState.Finished;
        (_a = this.m_resolveFinishedPromise) === null || _a === void 0 ? void 0 : _a.call(this);
    }
    clear() {
        var _a, _b, _c;
        (_a = this.m_availableGeometryKinds) === null || _a === void 0 ? void 0 : _a.clear();
        (_b = this.m_enabledKinds) === null || _b === void 0 ? void 0 : _b.clear();
        (_c = this.m_disabledKinds) === null || _c === void 0 ? void 0 : _c.clear();
        this.m_decodedTile = undefined;
    }
    queueGeometryCreation(enabledKinds, disabledKinds) {
        if (this.m_state === TileGeometryLoaderState.CreationQueued) {
            return;
        }
        this.m_taskQueue.add({
            execute: this.createGeometry.bind(this, enabledKinds, disabledKinds),
            group: MapView_1.TileTaskGroups.CREATE,
            getPriority: this.getPriority.bind(this),
            isExpired: () => {
                return this.m_state !== TileGeometryLoaderState.CreationQueued;
            },
            estimatedProcessTime: () => {
                var _a, _b;
                //TODO: this seems to be close in many cases, but take some measures to confirm
                return ((_b = (_a = this.tile.decodedTile) === null || _a === void 0 ? void 0 : _a.decodeTime) !== null && _b !== void 0 ? _b : 30) / 6;
            }
        });
        this.m_state = TileGeometryLoaderState.CreationQueued;
    }
    async createGeometry(enabledKinds, disabledKinds) {
        if (this.m_state === TileGeometryLoaderState.CreatingGeometry) {
            return;
        }
        this.m_state = TileGeometryLoaderState.CreatingGeometry;
        const tile = this.tile;
        const decodedTile = this.m_decodedTile;
        // Just a sanity check that satisfies compiler check below.
        if (decodedTile === undefined) {
            this.finish();
            return;
        }
        const stats = Statistics_1.PerformanceStatistics.instance;
        let now = 0;
        if (stats.enabled) {
            now = harp_utils_1.PerformanceTimer.now();
        }
        const geometryCreator = TileGeometryCreator_1.TileGeometryCreator.instance;
        tile.clear();
        // Set up techniques which should be processed.
        geometryCreator.initDecodedTile(decodedTile, enabledKinds, disabledKinds);
        await geometryCreator.createAllGeometries(tile, decodedTile);
        if (stats.enabled) {
            this.addStats(stats, now);
        }
        this.finish();
        tile.dataSource.requestUpdate();
    }
    addStats(stats, now) {
        const tile = this.tile;
        const decodedTile = this.m_decodedTile;
        if (decodedTile === undefined) {
            return;
        }
        const geometryCreationTime = harp_utils_1.PerformanceTimer.now() - now;
        const currentFrame = stats.currentFrame;
        // Account for the geometry creation in the current frame.
        currentFrame.addValue("render.fullFrameTime", geometryCreationTime);
        currentFrame.addValue("render.geometryCreationTime", geometryCreationTime);
        currentFrame.addValue("geometry.geometryCreationTime", geometryCreationTime);
        currentFrame.addValue("geometryCount.numGeometries", decodedTile.geometries.length);
        currentFrame.addValue("geometryCount.numTechniques", decodedTile.techniques.length);
        currentFrame.addValue("geometryCount.numPoiGeometries", decodedTile.poiGeometries !== undefined ? decodedTile.poiGeometries.length : 0);
        currentFrame.addValue("geometryCount.numTextGeometries", decodedTile.textGeometries !== undefined ? decodedTile.textGeometries.length : 0);
        currentFrame.addValue("geometryCount.numTextPathGeometries", decodedTile.textPathGeometries !== undefined ? decodedTile.textPathGeometries.length : 0);
        currentFrame.addValue("geometryCount.numPathGeometries", decodedTile.pathGeometries !== undefined ? decodedTile.pathGeometries.length : 0);
        currentFrame.addMessage(
        // tslint:disable-next-line: max-line-length
        `Decoded tile: ${tile.dataSource.name} # lvl=${tile.tileKey.level} col=${tile.tileKey.column} row=${tile.tileKey.row}`);
    }
    /**
     * Stores geometry kinds used to load decoded tile geometry.
     *
     * This values are stored to detect geometry kind changes during loading.
     *
     * @param enabledKinds - Set of geometry kinds to be displayed or undefined.
     * @param disabledKinds - Set of geometry kinds that won't be rendered.
     */
    setGeometryKinds(enabledKinds, disabledKinds) {
        var _a, _b;
        if (enabledKinds !== undefined) {
            this.m_enabledKinds = Object.assign((_a = this.m_enabledKinds) !== null && _a !== void 0 ? _a : new harp_datasource_protocol_1.GeometryKindSet(), enabledKinds);
        }
        if (disabledKinds !== undefined) {
            this.m_disabledKinds = Object.assign((_b = this.m_disabledKinds) !== null && _b !== void 0 ? _b : new harp_datasource_protocol_1.GeometryKindSet(), disabledKinds);
        }
    }
    /**
     * Compare enabled and disabled geometry kinds with currently set.
     *
     * Method compares input sets with recently used geometry kinds in performance wise
     * manner, taking special care of undefined and zero size sets.
     *
     * @param enabledKinds - Set of geometry kinds to be displayed or undefined.
     * @param disabledKinds - Set of geometry kinds that won't be rendered.
     * @return `true` only if sets are logically equal, meaning that undefined and empty sets
     * may result in same geometry (techniques kind) beeing rendered.
     */
    compareGeometryKinds(enabledKinds, disabledKinds) {
        const enabledSame = this.m_enabledKinds === enabledKinds;
        const disabledSame = this.m_disabledKinds === disabledKinds;
        // Same references, no need to compare.
        if (enabledSame && disabledSame) {
            return true;
        }
        const enabledEmpty = (this.m_enabledKinds === undefined || this.m_enabledKinds.size === 0) &&
            (enabledKinds === undefined || enabledKinds.size === 0);
        const disabledEmpty = (this.m_disabledKinds === undefined || this.m_disabledKinds.size === 0) &&
            (disabledKinds === undefined || disabledKinds.size === 0);
        // We deal only with empty, the same or undefined sets - fast return, no need to compare.
        if ((enabledEmpty && disabledEmpty) ||
            (enabledSame && disabledEmpty) ||
            (disabledSame && enabledEmpty)) {
            return true;
        }
        // It is enough that one the the sets are different, try to spot difference otherwise
        // return true. Compare only non-empty sets.
        if (!enabledEmpty) {
            // If one set undefined then other must be non-empty, for sure different.
            if (enabledKinds === undefined || this.m_enabledKinds === undefined) {
                return false;
            }
            // Both defined and non-empty, compare the sets.
            else if (!enabledKinds.has(this.m_enabledKinds)) {
                return false;
            }
        }
        if (!disabledEmpty) {
            // One set defined and non-empty other undefined, for sure different.
            if (disabledKinds === undefined || this.m_disabledKinds === undefined) {
                return false;
            }
            // Both defined and non-empty, compare the sets.
            else if (!disabledKinds.has(this.m_disabledKinds)) {
                return false;
            }
        }
        // No difference found.
        return true;
    }
    /**
     * `True` if TileGeometryLoader was canceled
     */
    get isCanceled() {
        return this.m_state === TileGeometryLoaderState.Canceled;
    }
    /**
     * `True` if TileGeometryLoader was disposed
     */
    get isDisposed() {
        return this.m_state === TileGeometryLoaderState.Disposed;
    }
}
exports.TileGeometryLoader = TileGeometryLoader;
export default exports
//# sourceMappingURL=TileGeometryLoader.js.map