"use strict";
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.ConcurrentTilerFacade = void 0;
import ConcurrentWorkerSet_1 from "./ConcurrentWorkerSet";
import WorkerBasedTiler_1 from "./WorkerBasedTiler";
/**
 * Default concurrent tiler helper.
 *
 * A convenient singleton that maintains a separate [[ConcurrentWorkerSet]] for each bundle
 * requested. Provides easy access to {@link WorkerBasedTiler}s for data sources.
 */
class ConcurrentTilerFacade {
    /**
     * Returns a {@link WorkerBasedTiler} instance.
     *
     * @param tilerServiceType - The name of the tiler service type.
     * @param scriptUrl - The optional URL with the workers' script.
     * @param workerCount - The number of web workers to use.
     * @param workerConnectionTimeout - Timeout in seconds to connect to the web worker.
     */
    static getTiler(tilerServiceType, scriptUrl, workerCount, workerConnectionTimeout) {
        const workerSet = this.getWorkerSet(scriptUrl, workerCount, workerConnectionTimeout);
        return new WorkerBasedTiler_1.WorkerBasedTiler(workerSet, tilerServiceType);
    }
    /**
     * Returns a [[ConcurrentWorkerSet]] instance based on the script URL specified.
     *
     * @param scriptUrl - The optional URL with the workers' script. If not specified,
     * the function uses [[defaultScriptUrl]] instead.
     * @param workerCount - The number of web workers to use.
     * @param workerConnectionTimeout - Timeout in seconds to connect to the web worker.
     */
    static getWorkerSet(scriptUrl, workerCount, workerConnectionTimeout) {
        if (scriptUrl === undefined) {
            scriptUrl = this.defaultScriptUrl;
        }
        let workerSet = this.workerSets[scriptUrl];
        if (workerSet === undefined) {
            const workerConnectionTimeoutInMs = workerConnectionTimeout !== undefined ? workerConnectionTimeout * 1000 : undefined;
            workerSet = new ConcurrentWorkerSet_1.ConcurrentWorkerSet({
                scriptUrl,
                workerCount: workerCount !== null && workerCount !== void 0 ? workerCount : this.defaultWorkerCount,
                workerConnectionTimeout: workerConnectionTimeoutInMs
            });
            this.workerSets[scriptUrl] = workerSet;
        }
        return workerSet;
    }
    /**
     * Destroys a [[ConcurrentWorkerSet]] instance.
     *
     * @param scriptUrl - The worker script URL that was used to create the [[ConcurrentWorkerSet]].
     */
    static destroyWorkerSet(scriptUrl) {
        const workerSet = this.workerSets[scriptUrl];
        if (workerSet !== undefined) {
            workerSet.destroy();
            delete this.workerSets[scriptUrl];
        }
    }
    /**
     * Destroys all managed [[ConcurrentWorkerSet]]s.
     */
    static destroy() {
        Object.keys(this.workerSets).forEach(name => {
            this.workerSets[name].destroy();
        });
        this.workerSets = {};
    }
    /**
     * Destroys this [[ConcurrentTilerFacade]] if all of the [[ConcurrentWorkerSet]]s are
     * terminated.
     */
    static destroyIfTerminated() {
        let allWorkerSetsTerminated = true;
        Object.keys(this.workerSets).forEach(name => {
            if (!this.workerSets[name].terminated) {
                allWorkerSetsTerminated = false;
            }
        });
        if (allWorkerSetsTerminated) {
            ConcurrentTilerFacade.destroy();
        }
    }
}
exports.ConcurrentTilerFacade = ConcurrentTilerFacade;
/**
 * The URL containing a script to fall back (default) to when looking for worker sets
 * and tilers.
 */
ConcurrentTilerFacade.defaultScriptUrl = "./decoder.bundle.js";
/**
 * The default number of workers.
 */
ConcurrentTilerFacade.defaultWorkerCount = 1;
/**
 * The [[ConcurrentWorkerSet]] instances which are stored by the script URL.
 */
ConcurrentTilerFacade.workerSets = {};
//# sourceMappingURL=ConcurrentTilerFacade.js.map

export default exports