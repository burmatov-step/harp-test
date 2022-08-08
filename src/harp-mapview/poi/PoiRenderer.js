"use strict";
let exports = {}
exports.PoiRenderer = exports.PoiBatchRegistry = exports.PoiBuffer = void 0;
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
import * as harp_datasource_protocol_1 from "@here/harp-datasource-protocol"
import * as harp_materials_1 from "@here/harp-materials"
import * as harp_utils_1 from "@here/harp-utils"
import * as THREE from "three"
import MipMapGenerator_1 from "../image/MipMapGenerator"
import BoxBuffer_1 from "./BoxBuffer"
const logger = harp_utils_1.LoggerManager.instance.create("PoiRenderer");
/**
 * Neutral color used as `vColor` attribute of [[IconMaterial]] if no `iconColor` color was
 * specified.
 */
const neutralColor = new THREE.Color(1, 1, 1);
/**
 * Temporary color instance used by `addPoi` to pass color derived from `iconBrightness` property.
 */
const tmpIconColor = new THREE.Color();
/**
 * @internal
 * Buffer for POIs sharing same material and render order, renderable in a single draw call
 * (WebGL limits apply, see {@link BoxBuffer}).
 */
class PoiBuffer {
    /**
     * Creates a `PoiBuffer`
     * @param buffer -
     * @param layer - The {@link TextCanvas} layer used to render the POIs.
     */
    constructor(buffer, layer, m_onDispose) {
        this.buffer = buffer;
        this.layer = layer;
        this.m_onDispose = m_onDispose;
        this.m_refCount = 0;
    }
    /**
     * Increases this `PoiBuffer`'s reference count.
     * @returns this `PoiBuffer`.
     */
    increaseRefCount() {
        ++this.m_refCount;
        return this;
    }
    /**
     * Decreases this `PoiBuffer`'s reference count. All resources will be disposed when the
     * reference count reaches 0.
     * @returns this `PoiBuffer`.
     */
    decreaseRefCount() {
        harp_utils_1.assert(this.m_refCount > 0);
        if (--this.m_refCount === 0) {
            this.dispose();
        }
        return this;
    }
    dispose() {
        this.layer.scene.remove(this.buffer.mesh);
        this.buffer.dispose();
        this.m_onDispose();
    }
}
exports.PoiBuffer = PoiBuffer;
/**
 * @internal
 *
 * The `PoiBatch` contains the geometry and the material for all POIs that share the same icon image
 * ({@link @here/harp-datasource-protocol#ImageTexture}).
 *
 * There is a `PoiBatch` for every icon in a texture atlas, since the size of the icon in the atlas
 * as well as the texture coordinates are specified in the `PoiBatch`.
 */
class PoiBatch {
    /**
     * Create the `PoiBatch`.
     *
     * @param m_rendererCapabilities - The {@link THREE.WebGLCapabilities} used for material
     * creation.
     * @param imageItem - The icon that will have his material shared.
     * @param m_onDispose - Callback executed when the `PoiBatch` is disposed.
     */
    constructor(m_rendererCapabilities, imageItem, m_onDispose) {
        this.m_rendererCapabilities = m_rendererCapabilities;
        this.imageItem = imageItem;
        this.m_onDispose = m_onDispose;
        // Texture images should be generated with premultiplied alpha
        const premultipliedAlpha = true;
        const texture = new THREE.Texture(this.imageItem.image, THREE.UVMapping, undefined, undefined, PoiBatch.trilinear ? THREE.LinearFilter : THREE.LinearFilter, PoiBatch.trilinear ? THREE.LinearMipMapLinearFilter : THREE.LinearFilter, THREE.RGBAFormat);
        if (PoiBatch.trilinear && this.imageItem.mipMaps) {
            // Generate mipmaps for distance scaling of icon
            texture.mipmaps = this.imageItem.mipMaps;
            texture.image = texture.mipmaps[0];
        }
        texture.flipY = false;
        texture.premultiplyAlpha = premultipliedAlpha;
        texture.needsUpdate = true;
        this.m_material = new harp_materials_1.IconMaterial({
            rendererCapabilities: this.m_rendererCapabilities,
            map: texture
        });
        this.m_poiBuffers = new Map();
    }
    /**
     * Gets the {@link PoiBuffer} for a given layer, creating it if necessary.
     * @param layer - The {@link PoiLayer} to be used.
     * @returns The {@link PoiBuffer}.
     */
    getBuffer(layer) {
        let poiBuffer = this.m_poiBuffers.get(layer.id);
        if (poiBuffer) {
            return poiBuffer.increaseRefCount();
        }
        const boxBuffer = new BoxBuffer_1.BoxBuffer(this.m_material, layer.id);
        const mesh = boxBuffer.mesh;
        mesh.frustumCulled = false;
        layer.scene.add(mesh);
        poiBuffer = new PoiBuffer(boxBuffer, layer, () => {
            this.disposeBuffer(layer.id);
        });
        this.m_poiBuffers.set(layer.id, poiBuffer);
        return poiBuffer.increaseRefCount();
    }
    /**
     * Clean the `PoiBatch`, remove all icon boxes. Called before starting a new frame.
     */
    reset() {
        for (const poiBuffer of this.m_poiBuffers.values()) {
            poiBuffer.buffer.reset();
        }
    }
    /**
     * Update the geometry with all the added boxes during the frame.
     */
    update() {
        for (const poiBuffer of this.m_poiBuffers.values()) {
            poiBuffer.buffer.updateBufferGeometry();
        }
    }
    /**
     * Fill the picking results for the pixel with the given screen coordinate. If multiple
     * boxes are found, the order of the results is unspecified.
     *
     * @param screenPosition - Screen coordinate of picking position.
     * @param pickCallback - Callback to be called for every picked element.
     * @param image - Image to test if the pixel is transparent
     */
    pickBoxes(screenPosition, pickCallback, image) {
        for (const poiBuffer of this.m_poiBuffers.values()) {
            poiBuffer.buffer.pickBoxes(screenPosition, pickCallback, image);
        }
    }
    /**
     * Update the info with the memory footprint caused by objects owned by the `PoiBatch`.
     *
     * @param info - The info object to increment with the values from this `PoiBatch`.
     */
    updateMemoryUsage(info) {
        if (this.imageItem.image !== undefined) {
            const imageBytes = this.imageItem.image.width * this.imageItem.image.height * 4;
            info.heapSize += imageBytes;
            info.gpuSize += imageBytes;
        }
        for (const poiBuffer of this.m_poiBuffers.values()) {
            poiBuffer.buffer.updateMemoryUsage(info);
        }
    }
    dispose() {
        this.m_poiBuffers.clear();
        this.m_material.map.dispose();
        this.m_material.dispose();
        this.m_onDispose();
    }
    disposeBuffer(renderOrder) {
        harp_utils_1.assert(this.m_poiBuffers.size > 0);
        this.m_poiBuffers.delete(renderOrder);
        if (this.m_poiBuffers.size === 0) {
            this.dispose();
        }
    }
}
// Enable trilinear filtering to reduce flickering due to distance scaling
PoiBatch.trilinear = true;
/**
 * @internal
 * Contains all [[PoiBatch]]es. Selects (and initializes) the correct batch for a POI.
 */
class PoiBatchRegistry {
    /**
     * Create the `PoiBatchRegistry`.
     *
     * @param m_rendererCapabilities - The {@link THREE.WebGLCapabilities} to be used.
     */
    constructor(m_rendererCapabilities) {
        this.m_rendererCapabilities = m_rendererCapabilities;
        this.m_batchMap = new Map();
    }
    /**
     * Register the POI and prepare the [[PoiBatch]] for the POI at first usage.
     *
     * @param poiInfo - Describes the POI icon.
     * @param layer - The {@link PoiLayer} to render to.
     */
    registerPoi(poiInfo, layer) {
        var _a;
        const { imageItem, imageTexture } = poiInfo;
        if (!imageItem) {
            // No image found, therefore just return undefined. It will probably come in soon?
            return undefined;
        }
        // There is a batch for every ImageDefinition, which could be a texture atlas with many
        // ImageTextures in it. If the imageTexture is not set, imageTextureName has the actual
        // image name.
        harp_utils_1.assert(poiInfo.imageTextureName !== undefined);
        const batchKey = (_a = imageTexture === null || imageTexture === void 0 ? void 0 : imageTexture.image) !== null && _a !== void 0 ? _a : poiInfo.imageTextureName;
        let batch = this.m_batchMap.get(batchKey);
        if (batch === undefined) {
            batch = new PoiBatch(this.m_rendererCapabilities, imageItem, () => {
                this.deleteBatch(batchKey);
            });
            this.m_batchMap.set(batchKey, batch);
        }
        return batch.getBuffer(layer);
    }
    /**
     * Render a POI image at the specified location.
     *
     * @param poiInfo - PoiInfo containing information for rendering the POI icon.
     * @param screenBox - Box to render icon into in 2D coordinates.
     * @param viewDistance - Box's distance to camera.
     * @param opacity - Opacity of icon to allow fade in/out.
     */
    addPoi(poiInfo, screenBox, viewDistance, opacity) {
        if (poiInfo.isValid === false || !poiInfo.buffer) {
            logger.warn("PoiBatchRegistry: trying to add poiInfo without buffer prepared: ", poiInfo.poiName);
            return;
        }
        harp_utils_1.assert(poiInfo.uvBox !== undefined);
        let color;
        if (poiInfo.iconBrightness !== undefined) {
            color = tmpIconColor.setScalar(poiInfo.iconBrightness);
            if (poiInfo.iconColor !== undefined) {
                color = tmpIconColor.multiply(poiInfo.iconColor);
            }
        }
        else if (poiInfo.iconColor !== undefined) {
            color = poiInfo.iconColor;
        }
        else {
            color = neutralColor;
        }
        poiInfo.buffer.buffer.addBox(screenBox, poiInfo.uvBox, color, opacity, viewDistance, poiInfo.textElement);
    }
    /**
     * Reset all batches, removing all content from the [[PoiBatch]]es. Called at the
     * beginning of a frame before the POIs are placed.
     */
    reset() {
        for (const batch of this.m_batchMap.values()) {
            batch.reset();
        }
    }
    /**
     * Update the geometry of all [[PoiBatch]]es. Called before rendering.
     */
    update() {
        for (const batch of this.m_batchMap.values()) {
            batch.update();
        }
    }
    /**
     * Fill the picking results for the pixel with the given screen coordinate. If multiple
     * {@link PoiInfo}s are found, the order of the results is unspecified.
     *
     * @param screenPosition - Screen coordinate of picking position.
     * @param pickCallback - Callback to be called for every picked element.
     */
    pickTextElements(screenPosition, pickCallback) {
        for (const batch of this.m_batchMap.values()) {
            batch.pickBoxes(screenPosition, pickCallback, batch.imageItem.image);
        }
    }
    /**
     * Update the info with the memory footprint caused by objects owned by the `PoiBatchRegistry`.
     *
     * @param info - The info object to increment with the values from this `PoiBatchRegistry`.
     */
    updateMemoryUsage(info) {
        for (const batch of this.m_batchMap.values()) {
            batch.updateMemoryUsage(info);
        }
    }
    deleteBatch(batchKey) {
        this.m_batchMap.delete(batchKey);
    }
}
exports.PoiBatchRegistry = PoiBatchRegistry;
// keep track of the missing textures, we throw an error if the number of attempts goes over some
// threshold.
const missingTextureName = new Map();
const SEARCH_CACHE_ATTEMPTS = 5;
function findImageItem(poiInfo, imageCaches, imageTexture) {
    var _a;
    harp_utils_1.assert(poiInfo.imageTextureName !== undefined);
    const imageTextureName = imageTexture ? imageTexture.image : poiInfo.imageTextureName;
    for (const imageCache of imageCaches) {
        const imageItem = imageCache.findImageByName(imageTextureName);
        if (imageItem) {
            missingTextureName.delete(imageTextureName);
            return imageItem;
        }
    }
    // There is a texture missing in the cache, we attempt again, and then error out.
    const missingTextureCount = missingTextureName.get(imageTextureName);
    missingTextureName.set(imageTextureName, missingTextureCount ? missingTextureCount + 1 : 0);
    if (missingTextureName.get(imageTextureName) === SEARCH_CACHE_ATTEMPTS) {
        logger.error(`PoiRenderer::findImageItem: No imageItem found with name:
            '${(_a = imageTexture === null || imageTexture === void 0 ? void 0 : imageTexture.image) !== null && _a !== void 0 ? _a : imageTextureName}'
            after ${SEARCH_CACHE_ATTEMPTS} attempts.`);
    }
    return undefined;
}
/**
 * @internal
 * Manage POI rendering. Uses a [[PoiBatchRegistry]] to actually create the geometry that is being
 * rendered.
 */
class PoiRenderer {
    /**
     * Create the `PoiRenderer` for the specified {@link MapView}.
     *
     * @param m_renderer - The {@link THREE.WebGLRenderer} to be rendered to.
     * @param m_poiManager - The {@link PoiManager} to be used.
     * @param m_imageCaches - The {@link ImageCache}s to look for loaded images.
     */
    constructor(m_renderer, m_poiManager, m_imageCaches) {
        this.m_renderer = m_renderer;
        this.m_poiManager = m_poiManager;
        this.m_imageCaches = m_imageCaches;
        // temporary variable to save allocations
        this.m_tempScreenBox = new harp_utils_1.Math2D.Box();
        this.m_layers = [];
        this.m_poiBatchRegistry = new PoiBatchRegistry(this.renderer.capabilities);
    }
    /**
     * Compute screen box for icon. It is required that `prepareRender` has been successfully called
     * before `computeScreenBox` may be called.
     *
     * @param poiInfo - PoiInfo containing information for rendering the POI icon.
     * @param screenPosition - Position on screen (2D).
     * @param scale - Scale to apply to icon.
     * @param env - Current zoom level.
     * @param screenBox - Box that will be used to store the result.
     * @returns The computed screen box for the icon.
     */
    static computeIconScreenBox(poiInfo, screenPosition, scale, env, 
    /* out */ screenBox = new harp_utils_1.Math2D.Box()) {
        harp_utils_1.assert(poiInfo.buffer !== undefined);
        const width = poiInfo.computedWidth * scale;
        const height = poiInfo.computedHeight * scale;
        const technique = poiInfo.technique;
        const iconXOffset = harp_datasource_protocol_1.getPropertyValue(technique.iconXOffset, env);
        const iconYOffset = harp_datasource_protocol_1.getPropertyValue(technique.iconYOffset, env);
        const centerX = screenPosition.x + (typeof iconXOffset === "number" ? iconXOffset : 0) * scale;
        const centerY = screenPosition.y + (typeof iconYOffset === "number" ? iconYOffset : 0) * scale;
        screenBox.x = centerX - width / 2;
        screenBox.y = centerY - height / 2;
        screenBox.w = width;
        screenBox.h = height;
        return screenBox;
    }
    get renderer() {
        return this.m_renderer;
    }
    /**
     * Prepare the POI for rendering, and determine which {@link PoiBuffer} should be used. If a
     * {@link PoiBuffer} is assigned, the POI is ready to be rendered.
     *
     * @param pointLabel - TextElement with PoiInfo for rendering the POI icon.
     * @param env - TODO! The current zoomLevel level of {@link MapView}
     *
     * @returns `True` if the space is not already allocated by another object (text label or POI)
     */
    prepareRender(pointLabel, env) {
        const poiInfo = pointLabel.poiInfo;
        if (poiInfo === undefined) {
            return false;
        }
        if (poiInfo.buffer === undefined) {
            this.preparePoi(pointLabel, env);
        }
        return poiInfo.buffer !== undefined;
    }
    /**
     * Reset all batches, removing all content from the [[PoiBatchRegistry]]. Called at the
     * beginning of a frame before the POIs are placed.
     */
    reset() {
        this.m_poiBatchRegistry.reset();
    }
    /**
     * Add the icon. Icon will only be added if opacity > 0, otherwise only its space will be
     * allocated.
     *
     * @param poiInfo - PoiInfo containing information for rendering the POI icon.
     * @param screenPosition - Position on screen (2D):
     * @param screenCollisions - Object handling the collision checks for screen-aligned 2D boxes.
     * @param viewDistance - Box's distance to camera.
     * @param scale - Scaling factor to apply to text and icon.
     * @param allocateScreenSpace - If `true` screen space will be allocated for the icon.
     * @param opacity - Opacity of icon to allow fade in/out.
     * @returns - `true` if icon has been actually rendered, `false` otherwise.
     */
    addPoi(poiInfo, screenPosition, screenCollisions, viewDistance, scale, allocateScreenSpace, opacity, env) {
        harp_utils_1.assert(poiInfo.buffer !== undefined);
        PoiRenderer.computeIconScreenBox(poiInfo, screenPosition, scale, env, this.m_tempScreenBox);
        if (allocateScreenSpace) {
            screenCollisions.allocate(this.m_tempScreenBox);
        }
        if (opacity > 0) {
            if (!poiInfo.buffer) {
                this.preparePoi(poiInfo.textElement, env);
            }
            this.m_poiBatchRegistry.addPoi(poiInfo, this.m_tempScreenBox, viewDistance, opacity);
        }
    }
    /**
     * Update the geometry of all [[PoiBatch]]es. Called before rendering.
     */
    update() {
        this.m_poiBatchRegistry.update();
    }
    /**
     * @internal
     *
     * Adds a layer to the PoiRenderer
     * @param layerId
     */
    addLayer(layerId) {
        let result = this.getLayer(layerId);
        if (result === undefined) {
            result = {
                id: layerId,
                scene: new THREE.Scene()
            };
            this.m_layers.push(result);
            this.m_layers.sort((a, b) => {
                return a.id - b.id;
            });
        }
        return result;
    }
    /**
     * Retrieves a specific `Poi` rendering layer.
     *
     * @param layerId - Desired layer identifier.
     *
     * @returns Selected {@link PoiLayer}
     */
    getLayer(layerId) {
        return this.m_layers.find(layer => layer.id === layerId);
    }
    /**
     * @internal
     *
     * Returns all {@link PoiLayer}s of this {@link PoiRenderer}
     */
    get layers() {
        return this.m_layers;
    }
    /**
     * Renders the content of this `PoiRenderer`.
     *
     * @param camera - Orthographic camera.
     * @param layer - The Layer to be rendered.
     */
    render(camera, layer) {
        this.m_renderer.render(layer.scene, camera);
    }
    /**
     * Fill the picking results for the pixel with the given screen coordinate. If multiple
     * {@link PoiInfo}s are found, the order of the results is unspecified.
     *
     * @param screenPosition - Screen coordinate of picking position.
     * @param pickCallback - Callback to be called for every picked element.
     */
    pickTextElements(screenPosition, pickCallback) {
        this.m_poiBatchRegistry.pickTextElements(screenPosition, pickCallback);
    }
    /**
     * Update the info with the memory footprint caused by objects owned by the `PoiRenderer`.
     *
     * @param info - The info object to increment with the values from this `PoiRenderer`.
     */
    getMemoryUsage(info) {
        this.m_poiBatchRegistry.updateMemoryUsage(info);
    }
    /**
     * Register the POI at the [[PoiBatchRegistry]] which may require some setup, for example
     * loading of the actual image.
     */
    preparePoi(pointLabel, env) {
        const poiInfo = pointLabel.poiInfo;
        if (!poiInfo || !pointLabel.visible) {
            return;
        }
        if (poiInfo.buffer !== undefined || poiInfo.isValid === false) {
            // Already set up, nothing to be done here.
            return;
        }
        if (poiInfo.poiTableName !== undefined) {
            if (this.m_poiManager.updatePoiFromPoiTable(pointLabel)) {
                if (!pointLabel.visible) {
                    // PoiTable set this POI to not visible.
                    return;
                }
            }
            else {
                // PoiTable has not been loaded, but is required to determine visibility.
                return;
            }
        }
        const imageTextureName = poiInfo.imageTextureName;
        if (imageTextureName === undefined) {
            poiInfo.isValid = false;
            return;
        }
        const imageTexture = this.m_poiManager.getImageTexture(imageTextureName);
        const imageItem = findImageItem(poiInfo, this.m_imageCaches, imageTexture);
        if (!imageItem) {
            poiInfo.imageItem = null;
            return;
        }
        if (imageItem.loaded) {
            this.setupPoiInfo(poiInfo, imageItem, env, imageTexture);
            return;
        }
        if (imageItem.loading) {
            // already being loaded, will be rendered once available
            return;
        }
        imageItem
            .loadImage()
            .then(loadedImageItem => {
            // Skip setup if image was not loaded (cancelled).
            if (loadedImageItem === null || loadedImageItem === void 0 ? void 0 : loadedImageItem.image) {
                this.setupPoiInfo(poiInfo, loadedImageItem, env, imageTexture);
            }
        })
            .catch(error => {
            logger.error(`preparePoi: Failed to load imageItem: '${imageItem.url}`, error);
            poiInfo.isValid = false;
        });
    }
    /**
     * Setup texture and material for the batch.
     *
     * @param poiInfo - {@link PoiInfo} to initialize.
     * @param imageTexture - Shared {@link @here/harp-datasource-protocol#ImageTexture},
     *                       defines used area in atlas.
     * @param imageItem - Shared {@link ImageItem}, contains cached image for texture.
     * @param env - The current zoom level of {@link MapView}
     */
    setupPoiInfo(poiInfo, imageItem, env, imageTexture) {
        harp_utils_1.assert(poiInfo.uvBox === undefined);
        if (!imageItem.image) {
            logger.error("setupPoiInfo: No imageItem/imageData found");
            poiInfo.isValid = false;
            return;
        }
        const technique = poiInfo.technique;
        const imageWidth = imageItem.image.width;
        const imageHeight = imageItem.image.height;
        const paddedSize = MipMapGenerator_1.MipMapGenerator.getPaddedSize(imageWidth, imageHeight);
        const trilinearFiltering = PoiBatch.trilinear && imageItem.mipMaps;
        const paddedImageWidth = trilinearFiltering ? paddedSize.width : imageWidth;
        const paddedImageHeight = trilinearFiltering ? paddedSize.height : imageHeight;
        const iconWidth = (imageTexture === null || imageTexture === void 0 ? void 0 : imageTexture.width) !== undefined ? imageTexture.width : imageWidth;
        const iconHeight = (imageTexture === null || imageTexture === void 0 ? void 0 : imageTexture.height) !== undefined ? imageTexture.height : imageHeight;
        const width = (imageTexture === null || imageTexture === void 0 ? void 0 : imageTexture.width) !== undefined ? imageTexture.width : imageWidth;
        const height = (imageTexture === null || imageTexture === void 0 ? void 0 : imageTexture.height) !== undefined ? imageTexture.height : imageHeight;
        const xOffset = (imageTexture === null || imageTexture === void 0 ? void 0 : imageTexture.xOffset) !== undefined ? imageTexture.xOffset : 0;
        const yOffset = (imageTexture === null || imageTexture === void 0 ? void 0 : imageTexture.yOffset) !== undefined ? imageTexture.yOffset : 0;
        const minS = xOffset / paddedImageWidth;
        const maxS = (xOffset + width) / paddedImageWidth;
        const minT = yOffset / paddedImageHeight;
        const maxT = (yOffset + height) / paddedImageHeight;
        let iconScaleH = technique.iconScale !== undefined ? technique.iconScale : 1;
        let iconScaleV = technique.iconScale !== undefined ? technique.iconScale : 1;
        // By default, iconScaleV should be equal to iconScaleH, whatever is set in the style.
        const screenWidth = harp_datasource_protocol_1.getPropertyValue(technique.screenWidth, env);
        if (screenWidth !== undefined && screenWidth !== null) {
            iconScaleV = iconScaleH = screenWidth / iconWidth;
        }
        const screenHeight = harp_datasource_protocol_1.getPropertyValue(technique.screenHeight, env);
        if (screenHeight !== undefined && screenHeight !== null) {
            iconScaleV = screenHeight / iconHeight;
            if (screenWidth !== undefined) {
                iconScaleH = iconScaleV;
            }
        }
        // compute stored values in imageTexture
        poiInfo.computedWidth = iconWidth * iconScaleH;
        poiInfo.computedHeight = iconHeight * iconScaleV;
        poiInfo.uvBox = {
            s0: minS,
            t0: maxT,
            s1: maxS,
            t1: minT
        };
        poiInfo.imageItem = imageItem;
        poiInfo.imageTexture = imageTexture;
        poiInfo.buffer = this.m_poiBatchRegistry.registerPoi(poiInfo, this.addLayer(poiInfo.renderOrder));
        poiInfo.isValid = true;
    }
}
exports.PoiRenderer = PoiRenderer;
export default exports
//# sourceMappingURL=PoiRenderer.js.map