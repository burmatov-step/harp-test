/** Any type supported by WebGLRenderingContext.texImage2D() for texture creation */
export declare type TexturizableImage = HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageData | ImageBitmap;
/**
 * `ImageItem` is used to identify an image in the {@link ImageCache}.
 */
export declare class ImageItem {
    readonly url: string;
    image?: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageData | ImageBitmap | undefined;
    /** Mip maps for image data */
    mipMaps?: ImageData[];
    /** Turns to `true` if the loading has been cancelled. */
    cancelled?: boolean;
    /** `loadingPromise` is only used during loading/generating the image. */
    private loadingPromise?;
    /**
     * Create the `ImageItem`.
     *
     * @param url - URL of the image, or unique identifier.
     * @param image - Optional image if already loaded.
     */
    constructor(url: string, image?: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageData | ImageBitmap | undefined);
    get loaded(): boolean;
    get loading(): boolean;
    /**
     * Load an {@link ImageItem}.
     *
     * @remarks
     * If the loading process is already running, it returns the current promise.
     *
     * @param imageItem - `ImageItem` containing the URL to load image from.
     * @returns An {@link ImageItem} if the image has already been loaded, a promise otherwise.
     */
    loadImage(): Promise<ImageItem | undefined>;
    private finalizeImage;
}
//# sourceMappingURL=Image.d.ts.map