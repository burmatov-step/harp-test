"use strict";
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.MapViewImageCache = void 0;
import harp_utils_1  from "@here/harp-utils"
import ImageCache_1  from "./ImageCache"
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
class MapViewImageCache {
    constructor() {
        this.m_name2Url = new Map();
        this.m_urlNameCount = new Map();
    }
    addImage(name, urlOrImage, startLoading = true) {
        if (typeof urlOrImage === "string") {
            const url = urlOrImage;
            const imageItem = this.registerImage(name, url);
            return startLoading ? imageItem.loadImage() : imageItem;
        }
        const image = urlOrImage;
        return this.registerImage(name, undefined, image);
    }
    /**
     * Remove the image with this name from the cache.
     *
     * @param name - Name of the image.
     * @returns `true` if item has been removed.
     */
    removeImage(name) {
        const url = this.m_name2Url.get(name);
        if (url !== undefined) {
            this.m_name2Url.delete(name);
            let nameCount = 1;
            if (name !== url) {
                const result = this.m_urlNameCount.get(url);
                harp_utils_1.assert(result !== undefined);
                nameCount = result;
                harp_utils_1.assert(nameCount > 0);
            }
            if (nameCount > 1) {
                // There is another name sharing this URL.
                this.m_urlNameCount.set(url, nameCount - 1);
            }
            else {
                // URL was used by this image only, remove the image.
                this.m_urlNameCount.delete(url);
                ImageCache_1.ImageCache.instance.removeImage(url, this);
            }
            return true;
        }
        return false;
    }
    /**
     * Find {@link ImageItem} by its name.
     *
     * @param name - Name of image.
     */
    findImageByName(name) {
        const url = this.m_name2Url.get(name);
        if (url === undefined) {
            return undefined;
        }
        return ImageCache_1.ImageCache.instance.findImage(url);
    }
    /**
     * Remove all {@link ImageItem}s from the cache.
     *
     * @remarks
     * Also removes all {@link ImageItem}s that belong to this
     * {@link MapView} from the global {@link ImageCache}.
     * @returns Number of images removed.
     */
    clear() {
        ImageCache_1.ImageCache.instance.clear(this);
        this.m_name2Url.clear();
        this.m_urlNameCount.clear();
    }
    /**
     * Register an existing image by name. If the name already exists and error is thrown.
     *
     * @param name - Image name.
     * @param url - Optional image URL.
     * @param image - Optional {@link TexturizableImage}.
     */
    registerImage(name, url, image) {
        var _a;
        if (this.hasName(name)) {
            throw new Error("duplicate name in cache");
        }
        if (url === undefined) {
            // If no url given, an image must be provided directly. In this case the name is used
            // as url.
            harp_utils_1.assert(image !== undefined);
            url = name;
        }
        if (url !== name) {
            const nameCount = (_a = this.m_urlNameCount.get(url)) !== null && _a !== void 0 ? _a : 0;
            this.m_urlNameCount.set(url, nameCount + 1);
        }
        this.m_name2Url.set(name, url);
        return ImageCache_1.ImageCache.instance.registerImage(this, url, image);
    }
    hasName(name) {
        return this.m_name2Url.get(name) !== undefined;
    }
}
exports.MapViewImageCache = MapViewImageCache;

export default exports
//# sourceMappingURL=MapViewImageCache.js.map