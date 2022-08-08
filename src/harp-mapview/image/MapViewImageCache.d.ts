import { ImageItem, TexturizableImage } from "./Image";
/**
 * Cache images wrapped into {@link ImageItem}s for a {@link MapView}.
 *
 * @remarks
 * An image may have multiple names in a theme, the `MapViewImageCache` maps different names to the
 * same image URL, and allows to share the image by URL to different MapViews.
 * Within a MapView instance, the (optional) name is unique, so registering multiple images with the
 * same name is invalid.
 *
 * The `MapViewImageCache` uses a global {@link ImageCache} to actually store (and generate) the
 * image data.
 */
export declare class MapViewImageCache {
    private readonly m_name2Url;
    private readonly m_urlNameCount;
    /**
     * Add an image from an URL and optionally start loading it, storing the resulting
     * {@link TexturizableImage} in a {@link ImageItem}.
     *
     * @remarks
     * Names are unique within a {@link MapView}. URLs are not unique, multiple images with
     * different names can have the same URL. Still, URLs are are loaded only once.
     * If an image with the same name is already registered an error is thrown.
     *
     * @param name - Image name.
     * @param url - Image URL.
     * @param startLoading - Optional. Pass `true` to start loading the image in the background.
     * @returns The resulting {@link ImageItem} or a promise for it if it starts loading.
     */
    addImage(name: string, url: string, startLoading?: boolean): ImageItem | Promise<ImageItem | undefined>;
    /**
     * Add an image storing it in a {@link ImageItem}.
     *
     * @remarks
     * Names are unique within a {@link MapView}. If an image with the same name is already
     * registered an error is thrown.
     *
     * @param name - Unique image name.
     * @param image - The image to add.
     * @returns The resulting {@link ImageItem}
     */
    addImage(name: string, image: TexturizableImage): ImageItem;
    /**
     * Remove the image with this name from the cache.
     *
     * @param name - Name of the image.
     * @returns `true` if item has been removed.
     */
    removeImage(name: string): boolean;
    /**
     * Find {@link ImageItem} by its name.
     *
     * @param name - Name of image.
     */
    findImageByName(name: string): ImageItem | undefined;
    /**
     * Remove all {@link ImageItem}s from the cache.
     *
     * @remarks
     * Also removes all {@link ImageItem}s that belong to this
     * {@link MapView} from the global {@link ImageCache}.
     * @returns Number of images removed.
     */
    clear(): void;
    /**
     * Register an existing image by name. If the name already exists and error is thrown.
     *
     * @param name - Image name.
     * @param url - Optional image URL.
     * @param image - Optional {@link TexturizableImage}.
     */
    private registerImage;
    private hasName;
}
//# sourceMappingURL=MapViewImageCache.d.ts.map