"use strict";
let exports = {}
exports.LowResRenderPass = void 0;
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
import * as harp_materials_1 from "@here/harp-materials"
import * as THREE from "three"
import Pass_1 from "./Pass"
/**
 * The `LowResRenderPass` renders the scene at a lower resolution into an internal
 * `WebGLRenderTarget`, and then copies the result into the frame buffer. The size of the internal
 * buffer is determined by the current frame buffer size multiplied by `pixelRatio`.
 *
 * @note Since no anti-aliasing is applied during dynamic rendering, visual artifacts may be
 * visible.
 */
class LowResRenderPass extends Pass_1.Pass {
    /**
     * The constructor for `LowResRenderPass`. It builds an internal scene with a camera looking at
     * a quad.
     *
     * @param lowResPixelRatio - The `pixelRatio` determines the resolution of the internal
     *  `WebGLRenderTarget`. Values between 0.5 and `window.devicePixelRatio` can be tried to give
     * good results. A value of `undefined` disables the low res render pass. The value should not
     * be larger than`window.devicePixelRatio`.
     */
    constructor(lowResPixelRatio) {
        super();
        this.lowResPixelRatio = lowResPixelRatio;
        this.m_renderTarget = null;
        this.m_localCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.m_quadScene = new THREE.Scene();
        this.m_quadUniforms = harp_materials_1.CopyShader.uniforms;
        this.m_quadMaterial = new harp_materials_1.CopyMaterial(this.m_quadUniforms);
        this.m_quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), this.m_quadMaterial);
        this.m_savedWidth = 0;
        this.m_savedHeight = 0;
        this.m_quad.frustumCulled = false;
        this.m_quadScene.add(this.m_quad);
        this.m_pixelRatio = lowResPixelRatio;
    }
    /**
     * Releases all used resources.
     */
    dispose() {
        this.m_quadMaterial.dispose();
        this.m_quad.geometry.dispose();
        if (this.m_renderTarget !== null) {
            this.m_renderTarget.dispose();
            this.m_renderTarget = null;
        }
    }
    /**
     * If a value is specified, a low resolution render pass is used to render the scene into a
     * low resolution render target, before it is copied to the screen.
     *
     * A value of `undefined` disables the low res render pass. The value should not be larger than
     * `window.devicePixelRatio`.
     *
     * @default `undefined`
     */
    set pixelRatio(ratio) {
        this.m_pixelRatio = ratio;
        if (this.m_renderTarget && this.pixelRatio !== undefined) {
            this.m_renderTarget.setSize(Math.floor(this.m_savedWidth * this.pixelRatio), Math.floor(this.m_savedHeight * this.pixelRatio));
        }
    }
    get pixelRatio() {
        return this.m_pixelRatio;
    }
    /**
     * The render function of `LowResRenderPass`. It renders the whole scene into an internal
     * `WebGLRenderTarget` instance with a lower resolution, using the passed in `WebGLRenderer`.
     * The low resolution image is then copied to the `writeBuffer`, which is `undefined` in case it
     * is the screen.
     *
     * @param renderer - The ThreeJS WebGLRenderer instance to render the scene with.
     * @param scene - The ThreeJS Scene instance to render the scene with.
     * @param camera - The ThreeJS Camera instance to render the scene with.
     * @param writeBuffer - A ThreeJS WebGLRenderTarget instance to render the scene to.
     * @param readBuffer - A ThreeJS WebGLRenderTarget instance to render the scene.
     * @override
     */
    render(renderer, scene, camera, writeBuffer, readBuffer) {
        if (!this.enabled || this.pixelRatio === undefined) {
            return;
        }
        // Initiates the local render target with the read buffer's dimensions, if not available.
        if (this.m_renderTarget === null) {
            this.m_savedWidth = readBuffer.width;
            this.m_savedHeight = readBuffer.height;
            this.m_renderTarget = new THREE.WebGLRenderTarget(Math.floor(this.m_savedWidth * this.pixelRatio), Math.floor(this.m_savedHeight * this.pixelRatio), {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                format: THREE.RGBAFormat,
                depthBuffer: true,
                stencilBuffer: true
            });
            this.m_renderTarget.texture.name = "LowResRenderPass.sample";
        }
        this.m_quadUniforms.tDiffuse.value = this.m_renderTarget.texture;
        this.m_quadUniforms.opacity.value = 1.0;
        const oldRenderTarget = renderer.getRenderTarget();
        renderer.setRenderTarget(this.m_renderTarget);
        renderer.clear();
        // Render into the low resolution internal render target.
        renderer.render(scene, camera);
        // Render the low resolution target into the screen.
        // NOTE: three.js doesn't like undefined as renderTarget, but works with `null`
        renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
        renderer.clear();
        renderer.render(this.m_quadScene, this.m_localCamera);
        renderer.setRenderTarget(oldRenderTarget);
    }
    /**
     * Resize the internal render target to match the new size specified. The size of internal
     * buffer depends on the `pixelRatio`.
     *
     * @param width - New width to apply to the render target.
     * @param height - New height to apply to the render target.
     * @override
     */
    setSize(width, height) {
        this.m_savedWidth = width;
        this.m_savedHeight = height;
        if (this.m_renderTarget && this.pixelRatio !== undefined) {
            this.m_renderTarget.setSize(Math.floor(width * this.pixelRatio), Math.floor(height * this.pixelRatio));
        }
    }
}
exports.LowResRenderPass = LowResRenderPass;
//# sourceMappingURL=LowResRenderPass.js.map

export default exports