"use strict";
let exports = {}
exports.OutlineEffect = void 0;
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
import * as harp_materials_1 from  "@here/harp-materials"
import * as harp_utils_1 from  "@here/harp-utils"
import * as THREE from "three"
const vertexShaderChunk = `
#ifdef USE_EXTRUSION
  #ifndef HAS_EXTRUSION_PARS_VERTEX
    #include <extrusion_pars_vertex>
  #endif
#endif

#ifdef USE_FADING
  #include <fading_pars_vertex>
#endif

uniform float outlineThickness;

vec4 calculateOutline( vec4 pos, vec3 objectNormal, vec4 skinned ) {
    float thickness = outlineThickness;
    const float ratio = 1.0;
    vec4 pos2 = projectionMatrix * modelViewMatrix * vec4( skinned.xyz + objectNormal, 1.0 );
    vec4 norm = normalize( pos - pos2 );
    return pos + norm * thickness * pos.w * ratio;
}`;
const vertexShaderChunk2 = `
#if ! defined( LAMBERT ) && ! defined( PHONG ) && ! defined( TOON ) && ! defined( STANDARD )
    #ifndef USE_ENVMAP
        vec3 objectNormal = normalize( normal );
    #endif
#endif

#ifdef FLIP_SIDED
    objectNormal = -objectNormal;
#endif

#ifdef DECLARE_TRANSFORMED
    vec3 transformed = vec3( position );
#endif

#ifdef USE_EXTRUSION
 #ifndef HAS_EXTRUSION_VERTEX
  #include <extrusion_vertex>
 #endif
#endif

#ifdef USE_FADING
  #include <fading_vertex>
#endif

#ifdef USE_EXTRUSION
  gl_Position = calculateOutline( projectionMatrix * modelViewMatrix * vec4( transformed, 1.0 ),
      objectNormal, vec4( transformed, 1.0 ) );
#else
  gl_Position = calculateOutline( gl_Position, objectNormal, vec4( transformed, 1.0 ) );
#endif

#include <fog_vertex>`;
const fragmentShader = `
#include <common>
#include <fog_pars_fragment>

#ifdef USE_EXTRUSION
  #include <extrusion_pars_fragment>
#endif

#ifdef USE_FADING
  #include <fading_pars_fragment>
#endif

uniform vec3 outlineColor;
uniform float outlineAlpha;

void main() {

    gl_FragColor = vec4( outlineColor, outlineAlpha );

    #include <fog_fragment>

    #ifdef USE_EXTRUSION
      #include <extrusion_fragment>
    #endif

    #ifdef USE_FADING
      #include <fading_fragment>
    #endif
}`;
/**
 * Effect to render bold lines around extruded polygons.
 *
 * Implemented by rendering the mesh geometries with an outline material before rendering them
 * again with their original.
 */
class OutlineEffect {
    constructor(m_renderer) {
        this.m_renderer = m_renderer;
        this.enabled = true;
        this.m_defaultThickness = 0.02;
        this.m_defaultColor = new THREE.Color(0, 0, 0);
        this.m_defaultAlpha = 1;
        this.m_defaultKeepAlive = false;
        this.m_ghostExtrudedPolygons = false;
        this.m_cache = {};
        this.m_removeThresholdCount = 60;
        this.m_originalMaterials = {};
        this.m_originalOnBeforeRenders = {};
        this.m_shaderIDs = {
            MeshBasicMaterial: "basic",
            MeshLambertMaterial: "lambert",
            MeshPhongMaterial: "phong",
            MeshToonMaterial: "phong",
            MeshStandardMaterial: "physical",
            MeshPhysicalMaterial: "physical"
        };
        this.m_uniformsChunk = {
            outlineThickness: { value: this.m_defaultThickness },
            outlineColor: { value: this.m_defaultColor },
            outlineAlpha: { value: this.m_defaultAlpha }
        };
        this.autoClear = m_renderer.autoClear;
        this.domElement = m_renderer.domElement;
        this.shadowMap = m_renderer.shadowMap;
    }
    set thickness(thickness) {
        this.m_defaultThickness = thickness;
        this.m_uniformsChunk.outlineThickness.value = thickness;
        this.m_cache = {};
    }
    set color(color) {
        this.m_defaultColor.set(color);
        this.m_cache = {};
    }
    set ghostExtrudedPolygons(ghost) {
        this.m_ghostExtrudedPolygons = ghost;
    }
    clear(color, depth, stencil) {
        this.m_renderer.clear(color, depth, stencil);
    }
    getPixelRatio() {
        return this.m_renderer.getPixelRatio();
    }
    setPixelRatio(value) {
        this.m_renderer.setPixelRatio(value);
    }
    getSize(target) {
        return this.m_renderer.getSize(target);
    }
    setSize(width, height, updateStyle) {
        this.m_renderer.setSize(width, height, updateStyle);
    }
    setViewport(x, y, width, height) {
        this.m_renderer.setViewport(x, y, width, height);
    }
    setScissor(x, y, width, height) {
        this.m_renderer.setScissor(x, y, width, height);
    }
    setScissorTest(boolean) {
        this.m_renderer.setScissorTest(boolean);
    }
    setRenderTarget(renderTarget) {
        this.m_renderer.setRenderTarget(renderTarget);
    }
    render(scene, camera) {
        // Re-rendering the scene with the outline effect enables to hide the
        // extruded polygons and show only the outlines (it is a hack and should be
        // implemented another way!).
        if (this.m_ghostExtrudedPolygons) {
            if (!this.enabled) {
                this.m_renderer.render(scene, camera);
                return;
            }
            const currentAutoClear = this.m_renderer.autoClear;
            this.m_renderer.autoClear = this.autoClear;
            this.m_renderer.render(scene, camera);
            this.m_renderer.autoClear = currentAutoClear;
        }
        this.renderOutline(scene, camera);
    }
    renderOutline(scene, camera) {
        const currentAutoClear = this.m_renderer.autoClear;
        const currentSceneAutoUpdate = scene.autoUpdate;
        const currentSceneBackground = scene.background;
        const currentShadowMapEnabled = this.m_renderer.shadowMap.enabled;
        scene.autoUpdate = false;
        scene.background = null;
        this.m_renderer.autoClear = false;
        this.m_renderer.shadowMap.enabled = false;
        scene.traverse(this.setOutlineMaterial.bind(this));
        this.m_renderer.render(scene, camera);
        scene.traverse(this.restoreOriginalMaterial.bind(this));
        this.cleanupCache();
        scene.autoUpdate = currentSceneAutoUpdate;
        scene.background = currentSceneBackground;
        this.m_renderer.autoClear = currentAutoClear;
        this.m_renderer.shadowMap.enabled = currentShadowMapEnabled;
    }
    createInvisibleMaterial() {
        return new THREE.ShaderMaterial({ name: "invisible", visible: false });
    }
    createMaterial(originalMaterial) {
        // EdgeMaterial or depth prepass material should not be used for outlines.
        if (originalMaterial instanceof harp_materials_1.EdgeMaterial ||
            originalMaterial.isDepthPrepassMaterial === true) {
            return this.createInvisibleMaterial();
        }
        const shaderID = this.m_shaderIDs[originalMaterial.type];
        let originalVertexShader;
        let originalUniforms = originalMaterial.shaderUniforms !== undefined
            ? originalMaterial.shaderUniforms
            : originalMaterial.uniforms;
        if (shaderID !== undefined) {
            const shader = THREE.ShaderLib[shaderID];
            originalUniforms = shader.uniforms;
            originalVertexShader = shader.vertexShader;
        }
        else if (originalMaterial.isRawShaderMaterial === true) {
            originalVertexShader = originalMaterial.vertexShader;
            if (!/attribute\s+vec3\s+position\s*;/.test(originalVertexShader) ||
                !/attribute\s+vec3\s+normal\s*;/.test(originalVertexShader)) {
                return this.createInvisibleMaterial();
            }
        }
        else if (originalMaterial.isShaderMaterial === true) {
            originalVertexShader = originalMaterial.vertexShader;
        }
        else {
            return this.createInvisibleMaterial();
        }
        const isExtrusionMaterial = originalMaterial.shaderUniforms !== undefined &&
            originalMaterial.shaderUniforms.extrusionRatio !== undefined;
        const isFadingMaterial = harp_materials_1.FadingFeature.isDefined(originalMaterial);
        const uniforms = Object.assign(Object.assign({}, originalUniforms), this.m_uniformsChunk);
        const vertexShader = originalVertexShader
            // put vertexShaderChunk right before "void main() {...}"
            .replace(/void\s+main\s*\(\s*\)/, vertexShaderChunk + "\nvoid main()")
            // put vertexShaderChunk2 the end of "void main() {...}"
            // Note: here assums originalVertexShader ends with "}" of "void main() {...}"
            .replace(/\}\s*$/, vertexShaderChunk2 + "\n}")
            // remove any light related lines
            // Note: here is very sensitive to originalVertexShader
            // TODO: consider safer way
            .replace(/#include\s+<[\w_]*light[\w_]*>/g, "");
        const defines = {};
        if (!/vec3\s+transformed\s*=/.test(originalVertexShader) &&
            !/#include\s+<begin_vertex>/.test(originalVertexShader)) {
            defines.DECLARE_TRANSFORMED = true;
        }
        if (isExtrusionMaterial) {
            // If the original material is setup for animated extrusion (like buildings), add the
            // uniform describing the extrusion to the outline material.
            uniforms.extrusionRatio = { value: harp_materials_1.ExtrusionFeatureDefs.DEFAULT_RATIO_MIN };
            defines.USE_EXTRUSION = 1;
        }
        if (isFadingMaterial) {
            uniforms.fadeNear = {
                value: originalUniforms.fadeNear !== undefined
                    ? originalUniforms.fadeNear.value
                    : harp_materials_1.FadingFeature.DEFAULT_FADE_NEAR
            };
            uniforms.fadeFar = {
                value: originalUniforms.fadeFar !== undefined
                    ? originalUniforms.fadeFar.value
                    : harp_materials_1.FadingFeature.DEFAULT_FADE_FAR
            };
            defines.USE_FADING = 1;
        }
        const outlineMaterial = new THREE.ShaderMaterial({
            defines,
            uniforms,
            vertexShader,
            fragmentShader,
            side: THREE.BackSide,
            morphTargets: false,
            morphNormals: false,
            fog: false,
            blending: THREE.CustomBlending,
            blendSrc: THREE.SrcAlphaFactor,
            blendDst: THREE.OneMinusSrcAlphaFactor,
            blendSrcAlpha: THREE.OneFactor,
            blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
            transparent: true,
            polygonOffset: true,
            // Extreme values used here to reduce artifacts, especially at tile borders.
            polygonOffsetFactor: 10.0,
            polygonOffsetUnits: 30.0
        });
        return outlineMaterial;
    }
    getOutlineMaterialFromCache(originalMaterial) {
        let data = this.m_cache[originalMaterial.uuid];
        if (data === undefined) {
            data = {
                material: this.createMaterial(originalMaterial),
                used: true,
                keepAlive: this.m_defaultKeepAlive,
                count: 0
            };
            this.m_cache[originalMaterial.uuid] = data;
        }
        data.used = true;
        return data.material;
    }
    getOutlineMaterial(originalMaterial) {
        const outlineMaterial = this.getOutlineMaterialFromCache(originalMaterial);
        this.m_originalMaterials[outlineMaterial.uuid] = originalMaterial;
        this.updateOutlineMaterial(outlineMaterial, originalMaterial);
        return outlineMaterial;
    }
    setOutlineMaterial(object) {
        if (object.material === undefined) {
            return;
        }
        if (Array.isArray(object.material)) {
            for (let i = 0, il = object.material.length; i < il; i++) {
                object.material[i] = this.getOutlineMaterial(object.material[i]);
            }
        }
        else {
            object.material = this.getOutlineMaterial(object.material);
        }
        this.m_originalOnBeforeRenders[object.uuid] = object.onBeforeRender;
        object.onBeforeRender = harp_utils_1.chainCallbacks(object.onBeforeRender, this.onBeforeRender.bind(this));
    }
    restoreOriginalMaterial(object) {
        if (object.material === undefined) {
            return;
        }
        if (Array.isArray(object.material)) {
            for (let i = 0, il = object.material.length; i < il; i++) {
                object.material[i] = this.m_originalMaterials[object.material[i].uuid];
            }
        }
        else {
            object.material = this.m_originalMaterials[object.material.uuid];
        }
        object.onBeforeRender = this.m_originalOnBeforeRenders[object.uuid];
    }
    onBeforeRender(renderer, scene, camera, geometry, material, group) {
        const originalMaterial = this.m_originalMaterials[material.uuid];
        // just in case
        if (originalMaterial === undefined) {
            return;
        }
        this.updateUniforms(material, originalMaterial);
    }
    updateUniforms(material, originalMaterial) {
        var _a;
        const outlineParameters = originalMaterial.userData.outlineParameters;
        const outlineUniforms = material.uniforms;
        outlineUniforms.outlineAlpha.value = originalMaterial.opacity;
        const originalUniforms = originalMaterial.shaderUniforms !== undefined
            ? originalMaterial.shaderUniforms
            : originalMaterial.uniforms;
        if (outlineParameters !== undefined) {
            if (outlineParameters.thickness !== undefined) {
                outlineUniforms.outlineThickness.value = outlineParameters.thickness;
            }
            if (outlineParameters.color !== undefined) {
                outlineUniforms.outlineColor.value.fromArray(outlineParameters.color);
            }
            if (outlineParameters.alpha !== undefined) {
                outlineUniforms.outlineAlpha.value = outlineParameters.alpha;
            }
        }
        // If the original material is setup for animated extrusion (like buildings), update the
        // uniforms in the outline material.
        if (originalUniforms !== undefined && originalUniforms.extrusionRatio !== undefined) {
            const value = originalMaterial.shaderUniforms.extrusionRatio.value;
            material.extrusionRatio = value;
            material.uniforms.extrusionRatio.value =
                value !== undefined ? value : harp_materials_1.ExtrusionFeatureDefs.DEFAULT_RATIO_MIN;
        }
        // Copy available fading params to the outline material.
        if (((_a = material.defines) === null || _a === void 0 ? void 0 : _a.USE_FADING) !== undefined &&
            originalUniforms.fadeNear !== undefined &&
            originalUniforms.fadeFar !== undefined &&
            originalUniforms.fadeFar.value >= 0.0) {
            outlineUniforms.fadeNear.value = originalUniforms.fadeNear.value;
            outlineUniforms.fadeFar.value = originalUniforms.fadeFar.value;
        }
    }
    updateOutlineMaterial(material, originalMaterial) {
        if (material.name === "invisible") {
            return;
        }
        const outlineParameters = originalMaterial.userData.outlineParameters;
        material.skinning = originalMaterial.skinning;
        material.morphTargets = originalMaterial.morphTargets;
        material.morphNormals = originalMaterial.morphNormals;
        material.fog = originalMaterial.fog;
        if (outlineParameters !== undefined) {
            material.visible =
                originalMaterial.visible === false
                    ? false
                    : outlineParameters.visible !== undefined
                        ? outlineParameters.visible
                        : true;
            if (outlineParameters.keepAlive !== undefined) {
                this.m_cache[originalMaterial.uuid].keepAlive = outlineParameters.keepAlive;
            }
        }
        else {
            material.visible = originalMaterial.visible;
        }
        if (originalMaterial.wireframe === true || originalMaterial.depthTest === false) {
            material.visible = false;
        }
    }
    cleanupCache() {
        let keys;
        // clear originialMaterials
        keys = Object.keys(this.m_originalMaterials);
        for (let i = 0, il = keys.length; i < il; i++) {
            this.m_originalMaterials[keys[i]] = undefined;
        }
        // clear originalOnBeforeRenders
        keys = Object.keys(this.m_originalOnBeforeRenders);
        for (let i = 0, il = keys.length; i < il; i++) {
            this.m_originalOnBeforeRenders[keys[i]] = undefined;
        }
        // remove unused outlineMaterial from cache
        keys = Object.keys(this.m_cache);
        for (const key of keys) {
            if (this.m_cache[key].used === false) {
                this.m_cache[key].count++;
                if (this.m_cache[key].keepAlive === false &&
                    this.m_cache[key].count > this.m_removeThresholdCount) {
                    delete this.m_cache[key];
                }
            }
            else {
                this.m_cache[key].used = false;
                this.m_cache[key].count = 0;
            }
        }
    }
}
exports.OutlineEffect = OutlineEffect;
//# sourceMappingURL=Outline.js.map
export default exports