"use strict";
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.ShaderPass = exports.RenderPass = exports.Pass = void 0;
import * as THREE from "three";
/**
 * The base class to extend for further passes in {@link MapView},
 * like the {@link MSAARenderPass},
 *
 * @remarks
 * `Pass` provides the core logic for both :
 * - render passes (proper scene renders),
 * - and shader passes (quad renders, i.e. effects added on top of the render output as a
 * postprocess).
 *
 * Even some shader passes still actually fall within the render pass category as they need to
 * re-render the scene to then deduce an effect, such as masking, AO, DoF etc. Others just need the
 * previous input image to apply a shader on top of it, as for bloom or NVIDIA's FXAA for example.
 * These only are proper shader passes.
 */
class Pass {
    constructor() {
        this.enabled = false;
        this.renderToScreen = false;
    }
    setSize(width, height) {
        // Implemented in sub-classes.
    }
    render(renderer, scene, camera, writeBuffer, readBuffer, delta) {
        // Implemented in sub-classes.
    }
}
exports.Pass = Pass;
/**
 * The pass that does a default normal scene rendering for further post-effects.
 */
class RenderPass extends Pass {
    constructor() {
        super();
    }
    /** @override */
    render(renderer, scene, camera, writeBuffer, readBuffer) {
        renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
        renderer.render(scene, camera);
    }
}
exports.RenderPass = RenderPass;
/**
 * The base class to extend for post-effects on the final render (like Vignette, Sepia, color
 * correction...)
 */
class ShaderPass extends Pass {
    constructor(shader, textureID = "tDiffuse") {
        super();
        this.textureID = textureID;
        if (shader instanceof THREE.ShaderMaterial) {
            this.uniforms = shader.uniforms;
            this.material = shader;
        }
        else {
            this.uniforms = THREE.UniformsUtils.clone(shader.uniforms);
            this.material = new THREE.ShaderMaterial({
                defines: Object.assign({}, shader.defines),
                uniforms: this.uniforms,
                vertexShader: shader.vertexShader,
                fragmentShader: shader.fragmentShader
            });
        }
        this.fsQuad = new FullScreenQuad(this.material);
    }
    /** @override */
    render(renderer, scene, camera, writeBuffer, readBuffer, delta) {
        if (this.uniforms[this.textureID]) {
            this.uniforms[this.textureID].value = readBuffer.texture;
        }
        this.fsQuad.material = this.material;
        renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
        this.fsQuad.render(renderer);
    }
}
exports.ShaderPass = ShaderPass;
class FullScreenQuad {
    constructor(material) {
        this.m_camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const geometry = new THREE.PlaneBufferGeometry(2, 2);
        this.m_mesh = new THREE.Mesh(geometry, material);
    }
    get material() {
        return this.m_mesh.material;
    }
    set material(value) {
        this.m_mesh.material = value;
    }
    render(renderer) {
        renderer.render(this.m_mesh, this.m_camera);
    }
}
//# sourceMappingURL=Pass.js.map

export default exports