"use strict";
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports= {}
exports.SkyBackground = void 0;
import SkyCubemapTexture_1 from "./SkyCubemapTexture"
import SkyGradientTexture_1 from "./SkyGradientTexture"
/**
 * Class that handles {@link MapView}'s sky background.
 */
class SkyBackground {
    /**
     * Constructs a new `SkyBackground`.
     *
     * @param m_sky - Sky configuration parameters.
     * @param m_projectionType - {@link MapView}'s projection type.
     * @param camera - {@link MapView}'s camera.
     */
    constructor(m_sky, m_projectionType, camera) {
        this.m_sky = m_sky;
        this.m_projectionType = m_projectionType;
        switch (this.m_sky.type) {
            case "gradient":
                this.m_skyTexture = new SkyGradientTexture_1.SkyGradientTexture(this.m_sky, this.m_projectionType);
                this.updateCamera(camera);
                break;
            case "cubemap": {
                this.m_skyTexture = new SkyCubemapTexture_1.SkyCubemapTexture(this.m_sky);
                break;
            }
        }
    }
    /**
     * Disposes allocated resources.
     */
    dispose() {
        this.m_skyTexture.dispose();
    }
    /**
     * Sky texture.
     */
    get texture() {
        return this.m_skyTexture.texture;
    }
    /**
     * This method updates the skybox based on the camera position (needed for some types of sky).
     *
     * @param camera - The camera used in the map view.
     */
    updateCamera(camera) {
        if (this.m_sky.type === "gradient") {
            this.m_skyTexture.update(camera);
        }
    }
    /**
     * Updates the sky texture with new parameters.
     *
     * @param params - New sky configuration parameters.
     * @param projectionType - Which projection is used, this may also change (in which case the
     * textures should be recreated).
     */
    updateTexture(params, projectionType) {
        const isSameSkyType = this.m_sky.type === params.type && this.m_projectionType === projectionType;
        switch (params.type) {
            case "gradient":
                if (isSameSkyType) {
                    this.m_skyTexture.updateTexture(params);
                }
                else {
                    this.m_skyTexture = new SkyGradientTexture_1.SkyGradientTexture(params, projectionType);
                }
                break;
            case "cubemap": {
                if (isSameSkyType) {
                    this.m_skyTexture.updateTexture(params);
                }
                else {
                    this.m_skyTexture = new SkyCubemapTexture_1.SkyCubemapTexture(params);
                }
                break;
            }
        }
        this.m_projectionType = projectionType;
        this.m_sky = params;
    }
}
exports.SkyBackground = SkyBackground;

export default exports
//# sourceMappingURL=SkyBackground.js.map