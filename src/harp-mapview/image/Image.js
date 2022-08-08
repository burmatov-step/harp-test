"use strict";
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.ImageItem = void 0;
import * as harp_utils_1 from "@here/harp-utils"
import * as THREE from "three"
import MipMapGenerator_1 from "./MipMapGenerator"
const logger = harp_utils_1.LoggerManager.instance.create("loadImage");
const mipMapGenerator = new MipMapGenerator_1.MipMapGenerator();
/**
 * `ImageItem` is used to identify an image in the {@link ImageCache}.
 */
class ImageItem {
    /**
     * Create the `ImageItem`.
     *
     * @param url - URL of the image, or unique identifier.
     * @param image - Optional image if already loaded.
     */
    constructor(url, image) {
        this.url = url;
        this.image = image;
    }
    get loaded() {
        return this.image !== undefined && this.mipMaps !== undefined;
    }
    get loading() {
        return this.loadingPromise !== undefined;
    }
    /**
     * Load an {@link ImageItem}.
     *
     * @remarks
     * If the loading process is already running, it returns the current promise.
     *
     * @param imageItem - `ImageItem` containing the URL to load image from.
     * @returns An {@link ImageItem} if the image has already been loaded, a promise otherwise.
     */
    loadImage() {
        if (this.loaded) {
            return Promise.resolve(this);
        }
        if (this.loading) {
            return this.loadingPromise;
        }
        this.loadingPromise = new Promise((resolve, reject) => {
            if (this.image) {
                const image = this.image;
                if (image instanceof HTMLImageElement && !image.complete) {
                    image.addEventListener("load", this.finalizeImage.bind(this, image, resolve));
                    image.addEventListener("error", reject);
                }
                else {
                    this.finalizeImage(this.image, resolve);
                }
                return;
            }
            logger.debug(`Loading image: ${this.url}`);
            if (this.cancelled === true) {
                logger.debug(`Cancelled loading image: ${this.url}`);
                resolve(undefined);
            }
            else {
                new THREE.ImageLoader().load(this.url, (image) => {
                    if (this.cancelled === true) {
                        logger.debug(`Cancelled loading image: ${this.url}`);
                        resolve(undefined);
                        return;
                    }
                    this.finalizeImage(image, resolve);
                }, undefined, errorEvent => {
                    logger.error(`... loading image failed: ${this.url} : ${errorEvent}`);
                    this.loadingPromise = undefined;
                    reject(`... loading image failed: ${this.url} : ${errorEvent}`);
                });
            }
        });
        return this.loadingPromise;
    }
    finalizeImage(image, resolve) {
        this.image = image;
        this.mipMaps = mipMapGenerator.generateTextureAtlasMipMap(this);
        this.loadingPromise = undefined;
        resolve(this);
    }
}
exports.ImageItem = ImageItem;
//# sourceMappingURL=Image.js.map

export default exports