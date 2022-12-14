"use strict";
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.getPixelFromImageData = exports.getPixelFromCanvasImageSource = exports.screenToUvCoordinates = exports.getPixelFromImage = void 0;
import harp_utils_1 from "@here/harp-utils"
/**
 * It returns an array containing the channel colors for the pixel at the given coordinates.
 *
 * @param xPos - X value of the pixel.
 * @param yPos - Y value of the pixel.
 * @param image - The image source.
 * @param canvas - Canvas element that will be used to draw the image, in case the imageData is an
 * ImageBitmap
 */
function getPixelFromImage(xPos, yPos, image, canvas) {
    if (image instanceof ImageData) {
        const stride = image.data.length / (image.height * image.width);
        return getPixelFromImageData(image, xPos, yPos, stride);
    }
    if (!canvas) {
        canvas = document.createElement("canvas");
    }
    return getPixelFromCanvasImageSource(image, xPos, yPos, canvas);
}
exports.getPixelFromImage = getPixelFromImage;
/**
 * Given the x and y position in screen coordinates inside the target box, it map them to the UV
 * coordinates.
 * @param screenX - X value in screen coordinates.
 * @param screenY - Y value in screen coordinates.
 * @param box - Bounding box in screen coordinates.
 * @param uvBox - Uv box referred to the given bounding box.
 */
function screenToUvCoordinates(screenX, screenY, box, uvBox) {
    const minX = box.x;
    const maxX = box.x + box.w;
    const minY = box.y;
    const maxY = box.y + box.h;
    const u = harp_utils_1.MathUtils.map(screenX, minX, maxX, uvBox.s0, uvBox.s1);
    const v = harp_utils_1.MathUtils.map(screenY, minY, maxY, uvBox.t0, uvBox.t1);
    return { u, v };
}
exports.screenToUvCoordinates = screenToUvCoordinates;
/**
 * It returns an Uint8ClampedArray containing the color channel values for the given pixel
 * coordinates. It returns undefined if the given coordinates are out of range.
 *
 * @param image - Image source.
 * @param xPos - X value of the pixel.
 * @param yPos - Y value of the pixel.
 * @param canvas - HTML Canvas element on which the image is drawn.
 */
function getPixelFromCanvasImageSource(image, xPos, yPos, canvas) {
    const { width, height } = image instanceof SVGImageElement ? image.getBBox() : image;
    if (xPos > width || xPos < 0 || yPos > height || yPos < 0) {
        return undefined;
    }
    let pixelData;
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (context !== null) {
        context.drawImage(image, 0, 0);
        pixelData = context.getImageData(xPos, yPos, 1, 1).data;
    }
    return pixelData;
}
exports.getPixelFromCanvasImageSource = getPixelFromCanvasImageSource;
/**
 * It returns an Uint8ClampedArray containing the color channel values for the given pixel
 * coordinates. It returns undefined if the given coordinates are out of range.
 *
 * @param image - Image data in which the pixels are stored.
 * @param xPos - X value of the pixel.
 * @param yPos - Y value of the pixel.
 * @param stride - The stride value of the image data.
 */
function getPixelFromImageData(imgData, xPos, yPos, stride) {
    const getPixel = (imageData, index, strd) => {
        const i = index * strd;
        const d = imageData.data;
        const pixel = new Uint8ClampedArray(strd);
        for (let s = 0; s < strd; s++) {
            pixel[0] = d[i + s];
        }
        return pixel;
    };
    if (xPos > imgData.width || xPos < 0 || yPos > imgData.height || yPos < 0) {
        return undefined;
    }
    return getPixel(imgData, yPos * imgData.width + xPos, stride);
}
exports.getPixelFromImageData = getPixelFromImageData;
export default exports
//# sourceMappingURL=PixelPicker.js.map