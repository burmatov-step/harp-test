"use strict";
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.BloomPass = void 0;
import * as harp_materials_1 from "@here/harp-materials"
import * as THREE from "three"
import Pass_1 from "./Pass"
const BlurDirectionX = new THREE.Vector2(1.0, 0.0);
const BlurDirectionY = new THREE.Vector2(0.0, 1.0);
/**
 * The TS version of ThreeJS's UnrealBloomPass.
 */
class BloomPass extends Pass_1.Pass {
    constructor(resolution, strength, radius, threshold) {
        super();
        this.resolution = new THREE.Vector2(256, 256);
        this.m_renderTargetsHorizontal = [];
        this.m_renderTargetsVertical = [];
        this.m_nMips = 5;
        this.m_separableBlurMaterials = [];
        this.m_camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.m_scene = new THREE.Scene();
        this.m_basic = new THREE.MeshBasicMaterial();
        this.m_quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2));
        this.m_bloomTintColors = [
            new THREE.Vector3(1, 1, 1),
            new THREE.Vector3(1, 1, 1),
            new THREE.Vector3(1, 1, 1),
            new THREE.Vector3(1, 1, 1),
            new THREE.Vector3(1, 1, 1)
        ];
        this.strength = strength;
        this.radius = radius;
        this.threshold = threshold;
        this.resolution = resolution;
        this.m_quad.frustumCulled = false;
        this.m_scene.add(this.m_quad);
        const pars = {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat
        };
        let resx = Math.round(this.resolution.x / 2);
        let resy = Math.round(this.resolution.y / 2);
        this.m_renderTargetBright = new THREE.WebGLRenderTarget(resx, resy, pars);
        this.m_renderTargetBright.texture.name = "UnrealBloomPass.bright";
        this.m_renderTargetBright.texture.generateMipmaps = false;
        for (let i = 0; i < this.m_nMips; i++) {
            const renderTargetHorizonal = new THREE.WebGLRenderTarget(resx, resy, pars);
            renderTargetHorizonal.texture.name = "UnrealBloomPass.h" + i;
            renderTargetHorizonal.texture.generateMipmaps = false;
            this.m_renderTargetsHorizontal.push(renderTargetHorizonal);
            const renderTargetVertical = new THREE.WebGLRenderTarget(resx, resy, pars);
            renderTargetVertical.texture.name = "UnrealBloomPass.v" + i;
            renderTargetVertical.texture.generateMipmaps = false;
            this.m_renderTargetsVertical.push(renderTargetVertical);
            resx = Math.round(resx / 2);
            resy = Math.round(resy / 2);
        }
        this.m_highPassUniforms = THREE.UniformsUtils.clone(harp_materials_1.LuminosityHighPassShader.uniforms);
        this.m_highPassUniforms["luminosityThreshold"].value = threshold;
        this.m_highPassUniforms["smoothWidth"].value = 0.01;
        this.m_materialHighPassFilter = new THREE.ShaderMaterial({
            uniforms: this.m_highPassUniforms,
            vertexShader: harp_materials_1.LuminosityHighPassShader.vertexShader,
            fragmentShader: harp_materials_1.LuminosityHighPassShader.fragmentShader,
            defines: {}
        });
        // Gaussian Blur Materials
        const kernelSizeArray = [3, 5, 7, 9, 11];
        resx = Math.round(this.resolution.x / 2);
        resy = Math.round(this.resolution.y / 2);
        for (let i = 0; i < this.m_nMips; i++) {
            this.m_separableBlurMaterials.push(this.getSeperableBlurMaterial(kernelSizeArray[i]));
            this.m_separableBlurMaterials[i].uniforms["texSize"].value = new THREE.Vector2(resx, resy);
            resx = Math.round(resx / 2);
            resy = Math.round(resy / 2);
        }
        // Composite material
        this.m_compositeMaterial = this.getCompositeMaterial(this.m_nMips);
        this.m_compositeMaterial.uniforms["blurTexture1"].value = this.m_renderTargetsVertical[0].texture;
        this.m_compositeMaterial.uniforms["blurTexture2"].value = this.m_renderTargetsVertical[1].texture;
        this.m_compositeMaterial.uniforms["blurTexture3"].value = this.m_renderTargetsVertical[2].texture;
        this.m_compositeMaterial.uniforms["blurTexture4"].value = this.m_renderTargetsVertical[3].texture;
        this.m_compositeMaterial.uniforms["blurTexture5"].value = this.m_renderTargetsVertical[4].texture;
        this.m_compositeMaterial.uniforms["bloomStrength"].value = strength;
        this.m_compositeMaterial.uniforms["bloomRadius"].value = 0.1;
        this.m_compositeMaterial.needsUpdate = true;
        const bloomFactors = [1.0, 0.8, 0.6, 0.4, 0.2];
        this.m_compositeMaterial.uniforms["bloomFactors"].value = bloomFactors;
        this.m_compositeMaterial.uniforms["bloomTintColors"].value = this.m_bloomTintColors;
        this.m_copyUniforms = THREE.UniformsUtils.clone(harp_materials_1.CopyShader.uniforms);
        this.m_copyUniforms["opacity"].value = 1.0;
        this.m_materialCopy = new THREE.ShaderMaterial({
            uniforms: this.m_copyUniforms,
            vertexShader: harp_materials_1.CopyShader.vertexShader,
            fragmentShader: harp_materials_1.CopyShader.fragmentShader,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            depthWrite: false,
            transparent: true
        });
    }
    dispose() {
        for (const rt of this.m_renderTargetsHorizontal) {
            rt.dispose();
        }
        for (const rt of this.m_renderTargetsVertical) {
            rt.dispose();
        }
        this.m_renderTargetBright.dispose();
    }
    /** @override */
    setSize(width, height) {
        let resx = Math.round(width / 2);
        let resy = Math.round(height / 2);
        this.m_renderTargetBright.setSize(resx, resy);
        for (let i = 0; i < this.m_nMips; i++) {
            this.m_renderTargetsHorizontal[i].setSize(resx, resy);
            this.m_renderTargetsVertical[i].setSize(resx, resy);
            this.m_separableBlurMaterials[i].uniforms["texSize"].value = new THREE.Vector2(resx, resy);
            resx = Math.round(resx / 2);
            resy = Math.round(resy / 2);
        }
    }
    /** @override */
    render(renderer, scene, camera, writeBuffer, readBuffer) {
        // Render input to screen
        if (this.renderToScreen) {
            this.m_quad.material = this.m_basic;
            this.m_basic.map = readBuffer.texture;
            renderer.setRenderTarget(null);
            renderer.clear();
            renderer.render(this.m_scene, this.m_camera);
        }
        // 1. Extract bright areas
        this.m_highPassUniforms["tDiffuse"].value = readBuffer.texture;
        this.m_highPassUniforms["luminosityThreshold"].value = this.threshold;
        this.m_quad.material = this.m_materialHighPassFilter;
        renderer.setRenderTarget(this.m_renderTargetBright);
        renderer.clear();
        renderer.render(this.m_scene, this.m_camera);
        // 2. Blur all the mips progressively
        let inputRenderTarget = this.m_renderTargetBright;
        for (let i = 0; i < this.m_nMips; i++) {
            this.m_quad.material = this.m_separableBlurMaterials[i];
            this.m_separableBlurMaterials[i].uniforms["colorTexture"].value =
                inputRenderTarget.texture;
            this.m_separableBlurMaterials[i].uniforms["direction"].value = BlurDirectionX;
            renderer.setRenderTarget(this.m_renderTargetsHorizontal[i]);
            renderer.clear();
            renderer.render(this.m_scene, this.m_camera);
            this.m_separableBlurMaterials[i].uniforms["colorTexture"].value = this.m_renderTargetsHorizontal[i].texture;
            this.m_separableBlurMaterials[i].uniforms["direction"].value = BlurDirectionY;
            renderer.setRenderTarget(this.m_renderTargetsVertical[i]);
            renderer.clear();
            renderer.render(this.m_scene, this.m_camera);
            inputRenderTarget = this.m_renderTargetsVertical[i];
        }
        // Composite all the mips
        this.m_quad.material = this.m_compositeMaterial;
        this.m_compositeMaterial.uniforms["bloomStrength"].value = this.strength;
        this.m_compositeMaterial.uniforms["bloomRadius"].value = this.radius;
        this.m_compositeMaterial.uniforms["bloomTintColors"].value = this.m_bloomTintColors;
        renderer.setRenderTarget(this.m_renderTargetsHorizontal[0]);
        renderer.clear();
        renderer.render(this.m_scene, this.m_camera);
        // Blend it additively over the input texture
        this.m_quad.material = this.m_materialCopy;
        this.m_copyUniforms["tDiffuse"].value = this.m_renderTargetsHorizontal[0].texture;
        if (this.renderToScreen) {
            renderer.setRenderTarget(null);
            renderer.render(this.m_scene, this.m_camera);
        }
        else {
            renderer.setRenderTarget(readBuffer);
            renderer.render(this.m_scene, this.m_camera);
        }
    }
    getSeperableBlurMaterial(kernelRadius) {
        return new THREE.ShaderMaterial({
            defines: {
                KERNEL_RADIUS: kernelRadius,
                SIGMA: kernelRadius
            },
            uniforms: {
                colorTexture: { value: null },
                texSize: { value: new THREE.Vector2(0.5, 0.5) },
                direction: { value: new THREE.Vector2(0.5, 0.5) }
            },
            vertexShader: `varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            }`,
            fragmentShader: `#include <common>
            varying vec2 vUv;
            uniform sampler2D colorTexture;
            uniform vec2 texSize;
            uniform vec2 direction;

            float gaussianPdf(in float x, in float sigma) {
                return 0.39894 * exp( -0.5 * x * x/( sigma * sigma))/sigma;
            }
            void main() {\n\
                vec2 invSize = 1.0 / texSize;
                float fSigma = float(SIGMA);
                float weightSum = gaussianPdf(0.0, fSigma);
                vec3 diffuseSum = texture2D( colorTexture, vUv).rgb * weightSum;
                for( int i = 1; i < KERNEL_RADIUS; i ++ ) {
                    float x = float(i);
                    float w = gaussianPdf(x, fSigma);
                    vec2 uvOffset = direction * invSize * x;
                    vec3 sample1 = texture2D( colorTexture, vUv + uvOffset).rgb;
                    vec3 sample2 = texture2D( colorTexture, vUv - uvOffset).rgb;
                    diffuseSum += (sample1 + sample2) * w;
                    weightSum += 2.0 * w;
                }
                gl_FragColor = vec4(diffuseSum/weightSum, 1.0);
            }`
        });
    }
    getCompositeMaterial(nMips) {
        return new THREE.ShaderMaterial({
            defines: {
                NUM_MIPS: nMips
            },
            uniforms: {
                blurTexture1: { value: null },
                blurTexture2: { value: null },
                blurTexture3: { value: null },
                blurTexture4: { value: null },
                blurTexture5: { value: null },
                dirtTexture: { value: null },
                bloomStrength: { value: 1.0 },
                bloomFactors: { value: null },
                bloomTintColors: { value: null },
                bloomRadius: { value: 0.0 }
            },
            vertexShader: `varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
                }`,
            fragmentShader: `varying vec2 vUv;
                uniform sampler2D blurTexture1;
                uniform sampler2D blurTexture2;
                uniform sampler2D blurTexture3;
                uniform sampler2D blurTexture4;
                uniform sampler2D blurTexture5;
                uniform sampler2D dirtTexture;
                uniform float bloomStrength;
                uniform float bloomRadius;
                uniform float bloomFactors[NUM_MIPS];
                uniform vec3 bloomTintColors[NUM_MIPS];

                float lerpBloomFactor(const in float factor) {
                    float mirrorFactor = 1.2 - factor;
                    return mix(factor, mirrorFactor, bloomRadius);
                }

                void main() {
                    gl_FragColor = bloomStrength * (
lerpBloomFactor(bloomFactors[0]) * vec4(bloomTintColors[0], 1.0) * texture2D(blurTexture1, vUv) +
lerpBloomFactor(bloomFactors[1]) * vec4(bloomTintColors[1], 1.0) * texture2D(blurTexture2, vUv) +
lerpBloomFactor(bloomFactors[2]) * vec4(bloomTintColors[2], 1.0) * texture2D(blurTexture3, vUv) +
lerpBloomFactor(bloomFactors[3]) * vec4(bloomTintColors[3], 1.0) * texture2D(blurTexture4, vUv) +
lerpBloomFactor(bloomFactors[4]) * vec4(bloomTintColors[4], 1.0) * texture2D(blurTexture5, vUv) );
                }`
        });
    }
}
exports.BloomPass = BloomPass;
//# sourceMappingURL=UnrealBloomPass.js.map
export default exports