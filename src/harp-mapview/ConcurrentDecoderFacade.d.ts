import { ITileDecoder } from "@here/harp-datasource-protocol";
import { ConcurrentWorkerSet } from "./ConcurrentWorkerSet";
/**
 * Default concurrent decoder helper.
 *
 * A convenient singleton that maintains a separate [[ConcurrentWorkerSet]] for each bundle
 * requested. Provides easy access to {@link WorkerBasedDecoder}s for data sources.
 */
export declare class ConcurrentDecoderFacade {
    /**
     * The URL containing a script to fall back (default) to when looking for worker sets
     * and decoders.
     */
    static defaultScriptUrl: string;
    /**
     * The default number of workers.
     */
    static defaultWorkerCount?: number;
    /**
     * Returns a {@link WorkerBasedDecoder} instance.
     *
     * @param decoderServiceType - The name of the decoder service type.
     * @param scriptUrl - The optional URL with the workers' script.
     * @param workerCount - The number of web workers to use.
     * @param workerConnectionTimeout - Timeout in seconds to connect to the web worker.
     */
    static getTileDecoder(decoderServiceType: string, scriptUrl?: string, workerCount?: number, workerConnectionTimeout?: number): ITileDecoder;
    /**
     * Returns a [[ConcurrentWorkerSet]] instance based on the script URL specified.
     *
     * @param scriptUrl - The optional URL with the workers' script. If not specified,
     * the function uses [[defaultScriptUrl]] instead.
     * @param workerCount - The number of web workers to use.
     * @param workerConnectionTimeout - Timeout in seconds to connect to the web worker.
     */
    static getWorkerSet(scriptUrl?: string, workerCount?: number, workerConnectionTimeout?: number): ConcurrentWorkerSet;
    /**
     * Destroys a [[ConcurrentWorkerSet]] instance.
     *
     * @param scriptUrl - The worker script URL that was used to create the [[ConcurrentWorkerSet]].
     */
    static destroyWorkerSet(scriptUrl: string): void;
    /**
     * Destroys all managed [[ConcurrentWorkerSet]]s.
     */
    static destroy(): void;
    /**
     * Destroys this [[ConcurrentDecoderFacade]] if all of the [[ConcurrentWorkerSet]]s are
     * terminated.
     */
    static destroyIfTerminated(): void;
    /**
     * The [[ConcurrentWorkerSet]] instances which are stored by the script URL.
     */
    private static workerSets;
}
//# sourceMappingURL=ConcurrentDecoderFacade.d.ts.map