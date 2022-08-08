"use strict";
let exports = {}
exports.ImageCache = void 0;
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
import Image_1 from "./Image"
/**
 * Combines an {@link ImageItem} with a list of owners (which can be any object) that reference it.
 */
class ImageCacheItem {
    /**
     * Instantiates `ImageCacheItem`.
     *
     * @param imageItem - The {@link ImageItem} referenced by the associated owners.
     * @param owner - First owner referencing the {@link ImageItem}.
     */
    constructor(imageItem, owner) {
        this.imageItem = imageItem;
        /**
         * The list of owners referencing the {@link ImageItem}.
         */
        this.owners = [];
        this.owners.push(owner);
    }
}
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
class ImageCache {
    constructor() {
        this.m_images = new Map();
    }
    /**
     * Returns the singleton `instance` of the `ImageCache`.
     */
    static get instance() {
        if (ImageCache.m_instance === undefined) {
            ImageCache.m_instance = new ImageCache();
        }
        return ImageCache.m_instance;
    }
    /**
     * Dispose the singleton object.
     *
     * @remarks
     * Not normally implemented for singletons, but good for debugging.
     */
    static dispose() {
        ImageCache.m_instance = undefined;
    }
    /**
     * Add an image definition to the global cache. Useful when the image data is already loaded.
     *
     * @param owner - Specify which {@link any} requests the image.
     * @param url - URL of image.
     * @param image - Optional {@link TexturizableImage}.
     */
    registerImage(owner, url, image) {
        let imageCacheItem = this.findImageCacheItem(url);
        if (imageCacheItem) {
            if (owner !== undefined && !imageCacheItem.owners.includes(owner)) {
                imageCacheItem.owners.push(owner);
            }
            return imageCacheItem.imageItem;
        }
        imageCacheItem = {
            imageItem: new Image_1.ImageItem(url, image),
            owners: [owner]
        };
        this.m_images.set(url, imageCacheItem);
        return imageCacheItem.imageItem;
    }
    /**
     * Remove an image from the cache..
     *
     * @param url - URL of the image.
     * @param owner - Owner removing the image.
     * @returns `true` if image has been removed.
     */
    removeImage(url, owner) {
        const cacheItem = this.m_images.get(url);
        if (cacheItem !== undefined) {
            this.unlinkCacheItem(cacheItem, owner);
            return true;
        }
        return false;
    }
    /**
     * Find {@link ImageItem} for the specified URL.
     *
     * @param url - URL of image.
     * @returns `ImageItem` for the URL if the URL is registered, `undefined` otherwise.
     */
    findImage(url) {
        const cacheItem = this.m_images.get(url);
        if (cacheItem !== undefined) {
            return cacheItem.imageItem;
        }
        return undefined;
    }
    /**
     * Clear all {@link ImageItem}s belonging to an owner.
     *
     * @remarks
     * May remove cached items if no owner is registered anymore.
     *
     * @param owner - specify to remove all items registered by {@link any}.
     * @returns Number of images removed.
     */
    clear(owner) {
        this.m_images.forEach(cacheItem => {
            this.unlinkCacheItem(cacheItem, owner);
        });
    }
    /**
     * Returns the number of all cached {@link ImageItem}s.
     */
    get size() {
        return this.m_images.size;
    }
    /**
     * Find the cached {@link ImageItem} by URL.
     *
     * @param url - URL of image.
     */
    findImageCacheItem(url) {
        return this.m_images.get(url);
    }
    /**
     * Cancel loading an image.
     *
     * @param imageItem - Item to cancel loading.
     */
    cancelLoading(imageItem) {
        if (imageItem.loading) {
            // Notify that we are cancelling.
            imageItem.cancelled = true;
        }
    }
    /**
     * Remove the cacheItem from cache, unless the item is used by another owner, in that case the
     * link to the owner is removed from the item, just like a reference count.
     *
     * @param cacheItem The cache item to be removed.
     * @param owner - Specify which owner removes the image.
     * If no owner is specified, the cache item is removed even if it has owners.
     */
    unlinkCacheItem(cacheItem, owner) {
        const ownerIndex = cacheItem.owners.indexOf(owner);
        if (ownerIndex >= 0) {
            cacheItem.owners.splice(ownerIndex, 1);
        }
        if (cacheItem.owners.length === 0) {
            this.m_images.delete(cacheItem.imageItem.url);
            this.cancelLoading(cacheItem.imageItem);
        }
    }
}
exports.ImageCache = ImageCache;
export default exports
//# sourceMappingURL=ImageCache.js.map