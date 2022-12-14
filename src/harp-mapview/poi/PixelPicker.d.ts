import { Math2D } from "@here/harp-utils";
/**
 * It returns an array containing the channel colors for the pixel at the given coordinates.
 *
 * @param xPos - X value of the pixel.
 * @param yPos - Y value of the pixel.
 * @param image - The image source.
 * @param canvas - Canvas element that will be used to draw the image, in case the imageData is an
 * ImageBitmap
 */
export declare function getPixelFromImage(xPos: number, yPos: number, image: CanvasImageSource | ImageData, canvas?: HTMLCanvasElement): Uint8ClampedArray | undefined;
/**
 * Given the x and y position in screen coordinates inside the target box, it map them to the UV
 * coordinates.
 * @param screenX - X value in screen coordinates.
 * @param screenY - Y value in screen coordinates.
 * @param box - Bounding box in screen coordinates.
 * @param uvBox - Uv box referred to the given bounding box.
 */
export declare function screenToUvCoordinates(screenX: number, screenY: number, box: Math2D.Box, uvBox: Math2D.UvBox): {
    u: number;
    v: number;
};
/**
 * It returns an Uint8ClampedArray containing the color channel values for the given pixel
 * coordinates. It returns undefined if the given coordinates are out of range.
 *
 * @param image - Image source.
 * @param xPos - X value of the pixel.
 * @param yPos - Y value of the pixel.
 * @param canvas - HTML Canvas element on which the image is drawn.
 */
export declare function getPixelFromCanvasImageSource(image: CanvasImageSource, xPos: number, yPos: number, canvas: HTMLCanvasElement): Uint8ClampedArray | undefined;
/**
 * It returns an Uint8ClampedArray containing the color channel values for the given pixel
 * coordinates. It returns undefined if the given coordinates are out of range.
 *
 * @param image - Image data in which the pixels are stored.
 * @param xPos - X value of the pixel.
 * @param yPos - Y value of the pixel.
 * @param stride - The stride value of the image data.
 */
export declare function getPixelFromImageData(imgData: ImageData, xPos: number, yPos: number, stride: number): Uint8ClampedArray | undefined;
//# sourceMappingURL=PixelPicker.d.ts.map