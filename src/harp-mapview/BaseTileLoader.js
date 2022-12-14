"use strict";
/*
 * Copyright (C) 2020-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.BaseTileLoader = void 0;
import harp_utils_1 from "@here/harp-utils";
import ITileLoader_1 from "./ITileLoader";
const logger = harp_utils_1.LoggerManager.instance.create("BaseTileLoader");
/**
 * @internal
 * Base class for tile loaders that provides state handling, request abortion and a load promise.
 */
class BaseTileLoader {
    /**
     * Set up loading of a single [[Tile]].
     *
     * @param dataSource - The [[DataSource]] the tile belongs to.
     * @param tileKey - The quadtree address of a [[Tile]].
     */
    constructor(dataSource, tileKey) {
        this.dataSource = dataSource;
        this.tileKey = tileKey;
        this.state = ITileLoader_1.TileLoaderState.Initialized;
        this.m_priority = 0;
        /**
         * The abort controller notifying the [[DataProvider]] to cancel loading.
         */
        this.loadAbortController = new AbortController();
    }
    /**
     * @override
     */
    get priority() {
        return this.m_priority;
    }
    /**
     * @override
     */
    set priority(value) {
        this.m_priority = value;
    }
    /**
     * @override
     */
    loadAndDecode() {
        switch (this.state) {
            case ITileLoader_1.TileLoaderState.Loading:
            case ITileLoader_1.TileLoaderState.Loaded:
            case ITileLoader_1.TileLoaderState.Decoding:
                // tile is already loading
                return this.donePromise;
            case ITileLoader_1.TileLoaderState.Ready:
            case ITileLoader_1.TileLoaderState.Failed:
            case ITileLoader_1.TileLoaderState.Initialized:
            case ITileLoader_1.TileLoaderState.Canceled:
                // restart loading
                this.load();
                return this.donePromise;
        }
    }
    /**
     * @override
     */
    waitSettled() {
        if (!this.donePromise) {
            return Promise.resolve(this.state);
        }
        return this.donePromise;
    }
    /**
     * @override
     */
    cancel() {
        if (this.state === ITileLoader_1.TileLoaderState.Loading) {
            this.loadAbortController.abort();
            this.loadAbortController = new AbortController();
        }
        this.cancelImpl();
        this.onDone(ITileLoader_1.TileLoaderState.Canceled);
    }
    /**
     * @override
     */
    get isFinished() {
        return (this.state === ITileLoader_1.TileLoaderState.Ready ||
            this.state === ITileLoader_1.TileLoaderState.Canceled ||
            this.state === ITileLoader_1.TileLoaderState.Failed);
    }
    /**
     * Called on load cancelation, may be overriden to extend behaviour.
     */
    cancelImpl() { }
    /**
     * Start loading. Only call if loading did not start yet.
     */
    load() {
        this.loadImpl(this.loadAbortController.signal, this.onDone.bind(this), this.onError.bind(this));
        if (this.donePromise === undefined) {
            this.donePromise = new Promise((resolve, reject) => {
                this.resolveDonePromise = resolve;
                this.rejectedDonePromise = reject;
            });
        }
        this.state = ITileLoader_1.TileLoaderState.Loading;
    }
    /**
     * Called when loading and decoding has finished successfully. Resolves loading promise if the
     * state is Ready, otherwise it rejects the promise with the supplied state.
     *
     * @param doneState - The latest state of loading.
     */
    onDone(doneState) {
        if (this.resolveDonePromise && doneState === ITileLoader_1.TileLoaderState.Ready) {
            this.resolveDonePromise(doneState);
        }
        else if (this.rejectedDonePromise) {
            this.rejectedDonePromise(doneState);
        }
        this.resolveDonePromise = undefined;
        this.rejectedDonePromise = undefined;
        this.donePromise = undefined;
        this.state = doneState;
    }
    /**
     * Called when loading or decoding has finished with an error.
     *
     * @param error - Error object describing the failing.
     */
    onError(error) {
        if (this.state === ITileLoader_1.TileLoaderState.Canceled) {
            // If we're canceled, we should simply ignore any state transitions and errors from
            // underlying load/decode ops.
            return;
        }
        const dataSource = this.dataSource;
        logger.error(`[${dataSource.name}]: failed to load tile ${this.tileKey.mortonCode()}`, error);
        this.error = error;
        this.onDone(ITileLoader_1.TileLoaderState.Failed);
    }
}
exports.BaseTileLoader = BaseTileLoader;

export default exports
//# sourceMappingURL=BaseTileLoader.js.map