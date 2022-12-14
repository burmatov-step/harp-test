"use strict";
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.WorkerBasedTiler = void 0;
import harp_datasource_protocol_1 from "@here/harp-datasource-protocol"
/**
 * Identifier of next tiler worker-service. Used to ensure uniqueness of service ids of tilers
 * dedicated to different datasources.
 */
let nextUniqueServiceId = 0;
/**
 * Tiler based on [[ConcurrentWorkerSet]].
 *
 * Tiles payloads using workers running in separate contexts (also known as `WebWorkers`):
 * - connection establishment,
 * - sends tile requests,
 * - configuration.
 */
class WorkerBasedTiler {
    /**
     * Creates a new `WorkerBasedTiler`.
     *
     * @param workerSet - [[ConcurrentWorkerSet]] this tiler will live in.
     * @param tilerServiceType - Service type identifier.
     */
    constructor(workerSet, tilerServiceType) {
        this.workerSet = workerSet;
        this.tilerServiceType = tilerServiceType;
        this.m_serviceCreated = false;
        this.workerSet.addReference();
        this.serviceId = `${this.tilerServiceType}-${nextUniqueServiceId++}`;
    }
    /**
     * Dispose of dedicated tiler services in workers and remove reference to underlying
     * [[ConcurrentWorkerSet]].
     */
    dispose() {
        if (this.m_serviceCreated) {
            this.workerSet
                .broadcastRequest(harp_datasource_protocol_1.WorkerServiceProtocol.WORKER_SERVICE_MANAGER_SERVICE_ID, {
                type: harp_datasource_protocol_1.WorkerServiceProtocol.Requests.DestroyService,
                targetServiceId: this.serviceId
            })
                .catch(() => {
                /* Ignoring these errors as underlying workers possibly do not exist anymore. */
            });
        }
        this.workerSet.removeReference();
    }
    /**
     * Connects to [[WorkerServiceManager]]s in underlying [[ConcurrentWorkerSet]] and creates
     * dedicated [[TilerService]]s in all workers to serve tiling requests.
     */
    async connect() {
        await this.workerSet.connect(harp_datasource_protocol_1.WorkerServiceProtocol.WORKER_SERVICE_MANAGER_SERVICE_ID);
        if (!this.m_serviceCreated) {
            await this.workerSet.broadcastRequest(harp_datasource_protocol_1.WorkerServiceProtocol.WORKER_SERVICE_MANAGER_SERVICE_ID, {
                type: harp_datasource_protocol_1.WorkerServiceProtocol.Requests.CreateService,
                targetServiceType: this.tilerServiceType,
                targetServiceId: this.serviceId
            });
            this.m_serviceCreated = true;
        }
    }
    /**
     * Register index in the tiler. Indexes registered in the tiler can be later used to retrieved
     * tiled payloads using `getTile`.
     *
     * @param indexId - Index identifier.
     * @param input - Url to the index payload, or direct GeoJSON.
     */
    registerIndex(indexId, input) {
        const message = {
            type: harp_datasource_protocol_1.WorkerTilerProtocol.Requests.RegisterIndex,
            id: indexId,
            input: input instanceof URL ? input.href : input
        };
        return this.workerSet.invokeRequest(this.serviceId, message);
    }
    /**
     * Update index in the tiler. Indexes registered in the tiler can be later used to retrieved
     * tiled payloads using `getTile`.
     *
     * @param indexId - Index identifier.
     * @param input - Url to the index payload, or direct GeoJSON.
     */
    updateIndex(indexId, input) {
        const message = {
            type: harp_datasource_protocol_1.WorkerTilerProtocol.Requests.UpdateIndex,
            id: indexId,
            input: input instanceof URL ? input.href : input
        };
        return this.workerSet.invokeRequest(this.serviceId, message);
    }
    /**
     * Retrieves a tile for a previously registered index.
     *
     * @param indexId - Index identifier.
     * @param tileKey - The {@link @here/harp-geoutils#TileKey} that identifies the tile.
     */
    getTile(indexId, tileKey) {
        const tileKeyCode = tileKey.mortonCode();
        const message = {
            type: harp_datasource_protocol_1.WorkerTilerProtocol.Requests.TileRequest,
            index: indexId,
            tileKey: tileKeyCode
        };
        return this.workerSet.invokeRequest(this.serviceId, message);
    }
}
exports.WorkerBasedTiler = WorkerBasedTiler;
export default exports
//# sourceMappingURL=WorkerBasedTiler.js.map