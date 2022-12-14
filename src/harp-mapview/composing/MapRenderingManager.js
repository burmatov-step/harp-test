"use strict";
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.MapRenderingManager = void 0;
import * as harp_materials_1 from "@here/harp-materials"
import * as THREE from "three"
import LowResRenderPass_1 from "./LowResRenderPass"
import MSAARenderPass_1 from "./MSAARenderPass"
import Outline_1 from "./Outline"
import Pass_1 from "./Pass"
import UnrealBloomPass_1 from "./UnrealBloomPass"
const DEFAULT_DYNAMIC_MSAA_SAMPLING_LEVEL = MSAARenderPass_1.MSAASampling.Level_1;
const DEFAULT_STATIC_MSAA_SAMPLING_LEVEL = MSAARenderPass_1.MSAASampling.Level_4;
/**
 * The implementation of {@link IMapRenderingManager} to
 * instantiate in {@link MapView} and manage the map
 * rendering.
 */
class MapRenderingManager {
    /**
     * The constructor of `MapRenderingManager`.
     *
     * @param width - Width of the frame buffer.
     * @param height - Height of the frame buffer.
     * @param lowResPixelRatio - The `pixelRatio` determines the resolution of the internal
     *  `WebGLRenderTarget`. Values between 0.5 and `window.devicePixelRatio` can be tried to give
     * good results. A value of `undefined` disables the low res render pass. The value should not
     * be larger than`window.devicePixelRatio`.
     * @param antialiasSetting - The object defining the demeanor of MSAA.
     */
    constructor(width, height, lowResPixelRatio, antialiasSettings = { msaaEnabled: false }) {
        this.bloom = {
            enabled: false,
            strength: 1.5,
            radius: 0.4,
            threshold: 0.85
        };
        this.outline = {
            enabled: false,
            thickness: 0.005,
            color: "#000000",
            ghostExtrudedPolygons: false,
            needsUpdate: false
        };
        this.vignette = {
            enabled: false,
            offset: 1.0,
            darkness: 1.0
        };
        this.sepia = {
            enabled: false,
            amount: 0.5
        };
        this.m_width = 1;
        this.m_height = 1;
        this.m_renderPass = new Pass_1.RenderPass();
        this.m_target1 = new THREE.WebGLRenderTarget(1, 1);
        this.m_target2 = new THREE.WebGLRenderTarget(1, 1);
        this.m_sepiaPass = new Pass_1.ShaderPass(harp_materials_1.SepiaShader);
        this.m_vignettePass = new Pass_1.ShaderPass(harp_materials_1.VignetteShader);
        this.m_readBuffer = new THREE.WebGLRenderTarget(width, height);
        this.m_msaaPass = new MSAARenderPass_1.MSAARenderPass();
        this.m_msaaPass.enabled =
            antialiasSettings !== undefined ? antialiasSettings.msaaEnabled === true : false;
        this.m_dynamicMsaaSamplingLevel =
            antialiasSettings.dynamicMsaaSamplingLevel === undefined
                ? DEFAULT_DYNAMIC_MSAA_SAMPLING_LEVEL
                : antialiasSettings.dynamicMsaaSamplingLevel;
        this.m_staticMsaaSamplingLevel =
            antialiasSettings.staticMsaaSamplingLevel === undefined
                ? DEFAULT_STATIC_MSAA_SAMPLING_LEVEL
                : antialiasSettings.staticMsaaSamplingLevel;
        this.m_lowResPass = new LowResRenderPass_1.LowResRenderPass(lowResPixelRatio);
        this.m_lowResPass.enabled = lowResPixelRatio !== undefined;
    }
    updateOutline(options) {
        this.outline.color = options.color;
        this.outline.thickness = options.thickness;
        this.outline.ghostExtrudedPolygons = options.ghostExtrudedPolygons;
        this.outline.needsUpdate = true;
    }
    /**
     * The method to call to render the map with the `MapRenderingManager` instance. It contains the
     * chain of sub-passes that can transfer the write and read buffers, and other sheer rendering
     * conditions as disabling AA when a high DPI device is in use.
     *
     * @param renderer - The ThreeJS WebGLRenderer instance to render the map with.
     * @param scene - The ThreeJS Scene instance containing the map objects to render.
     * @param camera - The ThreeJS Camera instance to render the scene through.
     * @param isStaticFrame - Whether the frame to render is static or dynamic. Selects level of
     * antialiasing.
     */
    render(renderer, scene, camera, isStaticFrame) {
        const target = null;
        if (!isStaticFrame && this.m_lowResPass.pixelRatio !== undefined) {
            // Not designed to be combined with our own MSAA
            this.m_lowResPass.renderToScreen = true;
            this.m_lowResPass.render(renderer, scene, camera, target, this.m_readBuffer);
            return;
        }
        const usePostEffects = this.bloom.enabled ||
            this.outline.enabled ||
            this.vignette.enabled ||
            this.sepia.enabled;
        let activeTarget = null;
        // 1. If the bloom is enabled, clear the depth.
        if (this.bloom.enabled || this.vignette.enabled || this.sepia.enabled) {
            renderer.setRenderTarget(this.m_target1);
            renderer.clearDepth();
        }
        // 2. Render the map.
        if (this.m_msaaPass.enabled) {
            // Use a higher MSAA sampling level for static rendering.
            this.m_msaaPass.samplingLevel = isStaticFrame
                ? this.m_staticMsaaSamplingLevel
                : this.m_dynamicMsaaSamplingLevel;
            // MSAA is the only effect for the moment.
            this.m_msaaPass.renderToScreen = !usePostEffects;
            // Render to the specified target with the MSAA pass.
            this.m_msaaPass.render(renderer, scene, camera, target, this.m_readBuffer);
        }
        else {
            if (this.bloom.enabled || this.vignette.enabled || this.sepia.enabled) {
                activeTarget = this.m_target1;
                this.m_renderPass.render(renderer, scene, camera, this.m_target1, null);
            }
            else if (!this.outline.enabled || (this.outline.enabled && !this.bloom.enabled)) {
                renderer.render(scene, camera);
            }
        }
        // 3. Apply effects
        if (this.outline.enabled) {
            if (this.m_outlineEffect === undefined) {
                this.m_outlineEffect = new Outline_1.OutlineEffect(renderer);
            }
            if (this.outline.needsUpdate) {
                this.m_outlineEffect.color = this.outline.color;
                this.m_outlineEffect.thickness = this.outline.thickness;
                this.m_outlineEffect.ghostExtrudedPolygons = this.outline.ghostExtrudedPolygons;
                this.outline.needsUpdate = false;
            }
            const nextEffectEnabled = this.bloom.enabled || this.vignette.enabled || this.sepia.enabled;
            if (nextEffectEnabled) {
                activeTarget = this.m_target1;
            }
            renderer.setRenderTarget(nextEffectEnabled ? activeTarget : null);
            this.m_outlineEffect.render(scene, camera);
        }
        if (this.bloom.enabled) {
            if (this.m_bloomPass === undefined) {
                this.m_bloomPass = new UnrealBloomPass_1.BloomPass(new THREE.Vector2(this.m_width, this.m_height), this.bloom.strength, this.bloom.radius, this.bloom.threshold);
            }
            const nextEffectEnabled = this.vignette.enabled || this.sepia.enabled;
            this.m_bloomPass.renderToScreen = !nextEffectEnabled;
            this.m_bloomPass.radius = this.bloom.radius;
            this.m_bloomPass.strength = this.bloom.strength;
            this.m_bloomPass.threshold = this.bloom.threshold;
            this.m_bloomPass.render(renderer, scene, camera, null, activeTarget);
        }
        else if (this.m_bloomPass !== undefined) {
            this.m_bloomPass.dispose();
            this.m_bloomPass = undefined;
        }
        if (this.vignette.enabled) {
            const oldTarget = activeTarget;
            const nextEffectEnabled = this.sepia.enabled;
            this.m_vignettePass.uniforms.offset.value = this.vignette.offset;
            this.m_vignettePass.uniforms.darkness.value = this.vignette.darkness;
            this.m_vignettePass.renderToScreen = !nextEffectEnabled;
            if (nextEffectEnabled) {
                activeTarget = activeTarget === this.m_target1 ? this.m_target2 : this.m_target1;
            }
            this.m_vignettePass.render(renderer, scene, camera, activeTarget, oldTarget);
        }
        if (this.sepia.enabled) {
            this.m_sepiaPass.renderToScreen = true;
            this.m_sepiaPass.uniforms.amount.value = this.sepia.amount;
            this.m_sepiaPass.render(renderer, scene, camera, null, activeTarget);
        }
    }
    /**
     * The resize function to call on resize events to resize the render targets. It shall include
     * the resize methods of all the sub-passes used in `MapRenderingManager`.
     *
     * @param width - New width to use.
     * @param height - New height to use.
     */
    setSize(width, height) {
        this.m_readBuffer.setSize(width, height);
        this.m_msaaPass.setSize(width, height);
        if (this.m_bloomPass !== undefined) {
            this.m_bloomPass.setSize(width, height);
        }
        this.m_lowResPass.setSize(width, height);
        this.m_target1.setSize(width, height);
        this.m_target2.setSize(width, height);
        this.m_width = width;
        this.m_height = height;
    }
    /**
     * The `lowResPixelRatio` determines the resolution of the internal `WebGLRenderTarget`. Values
     * between 0.5 and `window.devicePixelRatio` can be tried to give  good results. A value of
     * `undefined` disables the low res render pass. The value should not be larger than
     * `window.devicePixelRatio`.
     */
    get lowResPixelRatio() {
        return this.m_lowResPass.pixelRatio;
    }
    set lowResPixelRatio(pixelRatio) {
        this.m_lowResPass.pixelRatio = pixelRatio;
        this.m_lowResPass.enabled = pixelRatio !== undefined;
    }
    /**
     * Set the level of sampling while the user interacts.
     *
     * @param samplingLevel - The sampling level.
     */
    set dynamicMsaaSamplingLevel(samplingLevel) {
        this.m_dynamicMsaaSamplingLevel = samplingLevel;
    }
    /**
     * Return the sampling level defined during continuous rendering.
     */
    get dynamicMsaaSamplingLevel() {
        return this.m_dynamicMsaaSamplingLevel;
    }
    /**
     * Enable or disable the MSAA. If disabled, `MapRenderingManager` will use the renderer provided
     * in the {@link MapRenderingManager.render} method to render the scene.
     *
     * @param value - If `true`, MSAA is enabled, disabled otherwise.
     */
    set msaaEnabled(value) {
        this.m_msaaPass.enabled = value;
    }
    /**
     * Return whether the MSAA is enabled.
     */
    get msaaEnabled() {
        return this.m_msaaPass.enabled;
    }
    /**
     * Set the sampling level for rendering static frames.
     *
     * @param samplingLevel - The sampling level.
     */
    set staticMsaaSamplingLevel(samplingLevel) {
        this.m_staticMsaaSamplingLevel = samplingLevel;
    }
    /**
     * Return the sampling level defined for rendering static frames.
     */
    get staticMsaaSamplingLevel() {
        return this.m_staticMsaaSamplingLevel;
    }
}
exports.MapRenderingManager = MapRenderingManager;
//# sourceMappingURL=MapRenderingManager.js.map

export default exports