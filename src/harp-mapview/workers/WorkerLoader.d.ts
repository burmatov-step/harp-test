import "@here/harp-fetch";
/**
 * Set of `Worker` loading and initialization helpers:
 *  - starting Worker from URL with fallback to XHR+blob {@link WorkerLoader.startWorker}
 *  - waiting for proper worker initialization, see {@link WorkerLoader.waitWorkerInitialized}
 */
export declare class WorkerLoader {
    static directlyFallbackToBlobBasedLoading: boolean;
    static sourceLoaderCache: Map<string, Promise<string>>;
    static dependencyUrlMapping: {
        [name: string]: string;
    };
    /**
     * Starts worker by first attempting load from `scriptUrl` using native `Worker` constructor.
     * Then waits (using [[waitWorkerInitialized]]) for first message that indicates successful
     * initialization.
     * If `scriptUrl`'s origin is different than `baseUrl`, then in case of error falls back to
     * [[startWorkerBlob]].
     *
     * We must resolve/reject promise at some time, so it is expected that any sane application will
     * be able to load worker code in some amount of time.
     * By default, this method timeouts after 10 seconds (configurable using `timeout` argument).
     *
     * This method is needed as browsers in general forbid to load worker if it's not on 'same
     * origin' regardless of Content-Security-Policy.
     *
     * For blob-based fallback work, one need to ensure that Content Security Policy (CSP) allows
     * loading web worker code from `Blob`s. By default browsers, allow 'blob:' for workers, but
     * this may change.
     *
     * Following snippet setups CSP, so workers can be started from blob urls:
     *
     *     <head>
     *         <meta http-equiv="Content-Security-Policy" content="child-src blob:">
     *     </head>
     *
     * Tested on:
     *   * Chrome 67 / Linux, Window, OSX, Android
     *   * Firefox 60 / Linux, Windows, OSX
     *   * Edge 41 / Windows
     *   * Safari 11 / OSX
     *   * Samsung Internet 7.2
     *
     * See
     *  * https://benohead.com/cross-domain-cross-browser-web-workers/
     *  * MapBox
     *    * https://stackoverflow.com/questions/21913673/execute-web-worker-from-different-origin
     *    * https://github.com/mapbox/mapbox-gl-js/issues/2658
     *    * https://github.com/mapbox/mapbox-gl-js/issues/559
     *    * https://github.com/mapbox/mapbox-gl-js/issues/6058
     *
     * Findings:
     *
     * * Chrome reports CSP by exception when constructing [[Worker]] instance.
     * * Firefox reports CSP errors when loading in first event:
     *   https://bugzilla.mozilla.org/show_bug.cgi?id=1241888
     * * Firefox 62, Chrome 67 obeys `<meta http-equiv="Content-Security-Policy">` with
     *   `worker-src blob:` but doesn't obey `worker-src URL` when used
     * * Chrome 67 doesn't obey CSP `worker-src URL` despite it's documented as supported
     *   (https://developer.mozilla.org/docs/Web/HTTP/Headers/Content-Security-Policy/worker-src)
     *
     * @param scriptUrl - web worker script URL
     * @param timeout - timeout in milliseconds, in which worker should set initial message
     *    (default 10 seconds)
     */
    static startWorker(scriptUrl: string, timeout?: number): Promise<Worker>;
    /**
     * Start worker, loading it immediately from `scriptUrl`. Waits (using
     * [[waitWorkerInitialized]]) for successful worker start.
     *
     * @param scriptUrl - web worker script URL
     */
    static startWorkerImmediately(scriptUrl: string, timeout: number): Promise<Worker>;
    /**
     * Start worker "via blob" by first loading worker script code with [[fetch]], creating `Blob`
     * and attempting to start worker from blob url. Waits (using [[waitWorkerInitialized]]) for
     * successful worker start.
     *
     * @param scriptUrl - web worker script URL
     */
    static startWorkerBlob(scriptUrl: string, timeout: number): Promise<Worker>;
    /**
     * Fetch script source as `Blob` url.
     *
     * Reuses results, if there are many simultaneous requests.
     *
     * @param scriptUrl - web worker script URL
     * @return promise that resolves to url of a `Blob` with script source code
     */
    static fetchScriptSourceToBlobUrl(scriptUrl: string): Promise<string>;
    /**
     * Waits for successful Web Worker start.
     *
     * Expects that worker script sends initial message.
     *
     * If first event is `message` then assumes that worker has been loaded sussesfully and promise
     * resolves to `worker` object passed as argument.
     *
     * If first event is 'error', then it is assumed that worker failed to load and promise is
     * rejected.
     *
     * (NOTE: The initial 'message' - if received - is immediately replayed using worker's
     * `dispatchEvent`, so application code can also consume it as confirmation of successful
     * worker initialization.
     *
     * We must resolve/reject promise at some time, so it is expected that any sane application will
     * be able to load worker code in some amount of time.
     *
     * @param worker - [[Worker]] instance to be checked
     * @param timeout - timeout in milliseconds, in which worker should set initial message
     * @returns `Promise` that resolves to `worker` on success
     */
    static waitWorkerInitialized(worker: Worker, timeout: number): Promise<Worker>;
}
//# sourceMappingURL=WorkerLoader.d.ts.map