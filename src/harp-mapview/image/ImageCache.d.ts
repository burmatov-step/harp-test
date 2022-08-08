import { ImageItem, TexturizableImage } from "./Image";
/**
 * @internal
 *
 * `ImageCache` is a singleton, so it can be used with multiple owners on a single page.
 *
 * @remarks
 * This allows to have an image loaded only once for multiple views.
 * THREE is doing something similar,
 * but does not allow to share images that have been loaded from a canvas (which we may need to do
 * if we use SVG images for textures).
 *
 * One application that makes our own cache necessary is the generation of our own textures from
 * data that is not an URL.
 *
 * The `ImageCache` can be improved by adding statistics for memory footprint as well.
 */
export declare class ImageCache {
    /**
     * Returns the singleton `instance` of the `ImageCache`.
     */
    static get instance(): ImageCache;
    /**
     * Dispose the singleton object.
     *
     * @remarks
     * Not normally implemented for singletons, but good for debugging.
     */
    static dispose(): void;
    private static m_instance;
    private readonly m_images;
    /**
     * Add an image definition to the global cache. Useful when the image data is already loaded.
     *
     * @param owner - Specify which {@link any} requests the image.
     * @param url - URL of image.
     * @param image - Optional {@link TexturizableImage}.
     */
    registerImage(owner: any, url: string, image?: TexturizableImage): ImageItem;
    /**
     * Remove an image from the cache..
     *
     * @param url - URL of the image.
     * @param owner - Owner removing the image.
     * @returns `true` if image has been removed.
     */
    removeImage(url: string, owner: any): boolean;
    /**
     * Find {@link ImageItem} for the specified URL.
     *
     * @param url - URL of image.
     * @returns `ImageItem` for the URL if the URL is registered, `undefined` otherwise.
     */
    findImage(url: string): ImageItem | undefined;
    /**
     * Clear all {@link ImageItem}s belonging to an owner.
     *
     * @remarks
     * May remove cached items if no owner is registered anymore.
     *
     * @param owner - specify to remove all items registered by {@link any}.
     * @returns Number of images removed.
     */
    clear(owner: any): void;
    /**
     * Returns the number of all cached {@link ImageItem}s.
     */
    get size(): number;
    /**
     * Find the cached {@link ImageItem} by URL.
     *
     * @param url - URL of image.
     */
    private findImageCacheItem;
    /**
     * Cancel loading an image.
     *
     * @param imageItem - Item to cancel loading.
     */
    private cancelLoading;
    /**
     * Remove the cacheItem from cache, unless the item is used by another owner, in that case the
     * link to the owner is removed from the item, just like a reference count.
     *
     * @param cacheItem The cache item to be removed.
     * @param owner - Specify which owner removes the image.
     * If no owner is specified, the cache item is removed even if it has owners.
     */
    private unlinkCacheItem;
}
//# sourceMappingURL=ImageCache.d.ts.map