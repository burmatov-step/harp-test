"use strict";
let exports = {}
exports.WorkerBasedDecoder = void 0;
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
import harp_datasource_protocol_1 from "@here/harp-datasource-protocol"
/**
 * Identifier of next decoder worker-service. Used to ensure uniqueness of service ids of decoders
 * dedicated to different datasources.
 */
let nextUniqueServiceId = 0;
/**
 * Decoder based on [[ConcurrentWorkerSet]].
 *
 * Decodes tiles using workers running in separate contexts (also known as `WebWorkers`):
 * - connection establishment,
 * - sends decode requests,
 * - configuration.
 */
class WorkerBasedDecoder {
    /**
     * Creates a new `WorkerBasedDecoder`.
     *
     * @param workerSet - [[ConcurrentWorkerSet]] this tiler will live in.
     * @param decoderServiceType - Service type identifier.
     */
    constructor(workerSet, decoderServiceType) {
        this.workerSet = workerSet;
        this.decoderServiceType = decoderServiceType;
        this.m_serviceCreated = false;
        this.workerSet.addReference();
        this.serviceId = `${this.decoderServiceType}-${nextUniqueServiceId++}`;
    }
    /**
     * Dispose of dedicated tile decoder services in workers and remove reference to underlying
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
     * dedicated [[TileDecoderService]]s in all workers to serve decode requests.
     */
    async connect() {
        await this.workerSet.connect(harp_datasource_protocol_1.WorkerServiceProtocol.WORKER_SERVICE_MANAGER_SERVICE_ID);
        if (!this.m_serviceCreated) {
            await this.workerSet.broadcastRequest(harp_datasource_protocol_1.WorkerServiceProtocol.WORKER_SERVICE_MANAGER_SERVICE_ID, {
                type: harp_datasource_protocol_1.WorkerServiceProtocol.Requests.CreateService,
                targetServiceType: this.decoderServiceType,
                targetServiceId: this.serviceId
            });
            this.m_serviceCreated = true;
        }
    }
    /**
     * Get {@link Tile} from tile decoder service in worker.
     *
     * @remarks
     * Invokes {@link @here/harp-datasource-protocol#DecodeTileRequest} on
     * [[TileDecoderService]] running in worker pool.
     */
    decodeTile(data, tileKey, projection, requestController) {
        const tileKeyCode = tileKey.mortonCode();
        const message = {
            type: harp_datasource_protocol_1.WorkerDecoderProtocol.Requests.DecodeTileRequest,
            tileKey: tileKeyCode,
            data,
            projection: harp_datasource_protocol_1.getProjectionName(projection)
        };
        const transferList = data instanceof ArrayBuffer ? [data] : undefined;
        return this.workerSet.invokeRequest(this.serviceId, message, transferList, requestController);
    }
    /**
     * Get {@link @here/harp-datasource-protocol#TileInfo} from tile decoder service in worker.
     *
     * @remarks
     * Invokes {@link @here/harp-datasource-protocol#TileInfoRequest}
     * on [[TileDecoderService]] running in worker pool.
     */
    getTileInfo(data, tileKey, projection, requestController) {
        const tileKeyCode = tileKey.mortonCode();
        const message = {
            type: harp_datasource_protocol_1.WorkerDecoderProtocol.Requests.TileInfoRequest,
            tileKey: tileKeyCode,
            data,
            projection: harp_datasource_protocol_1.getProjectionName(projection)
        };
        const transferList = data instanceof ArrayBuffer ? [data] : undefined;
        return this.workerSet.invokeRequest(this.serviceId, message, transferList, requestController);
    }
    /**
     * Configure tile decoder service in workers.
     *
     * @remarks
     * Broadcasts {@link @here/harp-datasource-protocol#ConfigurationMessage}
     * to all [[TileDecoderService]]s running in worker pool.
     *
     * @param options - Options that will be applied to the styles
     * @param customOptions -   new options, undefined options are not changed
     */
    configure(options, customOptions) {
        const message = Object.assign(Object.assign({ service: this.serviceId, type: harp_datasource_protocol_1.WorkerDecoderProtocol.DecoderMessageName.Configuration }, options), { options: customOptions });
        this.workerSet.broadcastMessage(message);
    }
    /**
     * The number of workers started for this decoder. The value is `undefined` until the workers
     * have been created.
     */
    get workerCount() {
        return this.workerSet.workerCount;
    }
}
exports.WorkerBasedDecoder = WorkerBasedDecoder;
export default exports
//# sourceMappingURL=WorkerBasedDecoder.js.map