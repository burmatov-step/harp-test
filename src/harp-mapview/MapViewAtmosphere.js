"use strict";
/*
 * Copyright (C) 2020-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.MapViewAtmosphere = exports.AtmosphereLightMode = void 0;
import harp_geoutils_1 from "@here/harp-geoutils"
import harp_materials_1 from "@here/harp-materials"
import harp_utils_1 from "@here/harp-utils"
import * as THREE from "three"
import ClipPlanesEvaluator_1 from "./ClipPlanesEvaluator"
/**
 * Atmosphere effect variants.
 */
var AtmosphereVariant;
(function (AtmosphereVariant) {
    AtmosphereVariant[AtmosphereVariant["Ground"] = 1] = "Ground";
    AtmosphereVariant[AtmosphereVariant["Sky"] = 2] = "Sky";
    AtmosphereVariant[AtmosphereVariant["SkyAndGround"] = 3] = "SkyAndGround";
})(AtmosphereVariant || (AtmosphereVariant = {}));
/**
 * Atmosphere shader variants.
 */
var AtmosphereShadingVariant;
(function (AtmosphereShadingVariant) {
    AtmosphereShadingVariant[AtmosphereShadingVariant["ScatteringShader"] = 0] = "ScatteringShader";
    AtmosphereShadingVariant[AtmosphereShadingVariant["SimpleColor"] = 1] = "SimpleColor";
    AtmosphereShadingVariant[AtmosphereShadingVariant["Wireframe"] = 2] = "Wireframe";
})(AtmosphereShadingVariant || (AtmosphereShadingVariant = {}));
/**
 * Lists light modes.
 */
var AtmosphereLightMode;
(function (AtmosphereLightMode) {
    AtmosphereLightMode[AtmosphereLightMode["LightOverhead"] = 0] = "LightOverhead";
    AtmosphereLightMode[AtmosphereLightMode["LightDynamic"] = 1] = "LightDynamic";
})(AtmosphereLightMode = exports.AtmosphereLightMode || (exports.AtmosphereLightMode = {}));
/**
 * Maximum altitude that atmosphere reaches as the percent of the Earth radius.
 */
const SKY_ATMOSPHERE_ALTITUDE_FACTOR = 0.025;
/**
 * Maximum altitude that ground atmosphere is visible as the percent of the Earth radius.
 */
const GROUND_ATMOSPHERE_ALTITUDE_FACTOR = 0.0001;
/**
 * Utility cache for holding temporary values.
 */
const cache = {
    clipPlanes: { near: 0, far: 0 }
};
/**
 * Class that provides {@link MapView}'s atmospheric scattering effect.
 */
class MapViewAtmosphere {
    /**
     * Creates and adds `Atmosphere` effects to the scene.
     *
     * @note Currently works only with globe projection.
     *
     * @param m_mapAnchors - The {@link MapAnchors} instance where the effect will be added.
     * @param m_sceneCamera - The camera used to render entire scene.
     * @param m_projection - The geo-projection used to transform geo coordinates to
     *                       cartesian space.
     * @param m_rendererCapabilities The capabilities of the WebGL renderer.
     * @param m_updateCallback - The optional callback to that should be called whenever atmosphere
     * configuration changes, may be used to inform related components (`MapView`) to redraw.
     * @param m_atmosphereVariant - The optional atmosphere configuration variant enum
     * [[AtmosphereVariant]], which denotes where the atmosphere scattering effect should be
     * applied, it may be ground or sky atmosphere only or most realistic for both, which is
     * chosen by default.
     * @param m_materialVariant - The optional material variant to be used, mainly for
     * testing and tweaking purposes.
     */
    constructor(m_mapAnchors, m_sceneCamera, m_projection, m_rendererCapabilities, m_updateCallback, m_atmosphereVariant = AtmosphereVariant.SkyAndGround, m_materialVariant = AtmosphereShadingVariant.ScatteringShader) {
        this.m_mapAnchors = m_mapAnchors;
        this.m_sceneCamera = m_sceneCamera;
        this.m_projection = m_projection;
        this.m_rendererCapabilities = m_rendererCapabilities;
        this.m_updateCallback = m_updateCallback;
        this.m_atmosphereVariant = m_atmosphereVariant;
        this.m_materialVariant = m_materialVariant;
        this.m_enabled = true;
        this.m_clipPlanesEvaluator = new ClipPlanesEvaluator_1.TiltViewClipPlanesEvaluator(harp_geoutils_1.EarthConstants.EQUATORIAL_RADIUS * SKY_ATMOSPHERE_ALTITUDE_FACTOR, 0, 1.0, 0.05, 10000000.0);
        // TODO: Support for Theme definition should be added.
        //private m_cachedTheme: Theme = { styles: {} };
        this.m_lightDirection = new THREE.Vector3(0.0, 1.0, 0.0);
        if (this.m_atmosphereVariant & AtmosphereVariant.Sky) {
            this.createSkyGeometry();
        }
        if (this.m_atmosphereVariant & AtmosphereVariant.Ground) {
            this.createGroundGeometry();
        }
        this.addToMapAnchors(this.m_mapAnchors);
    }
    /**
     * Check if map anchors have already atmosphere effect added.
     *
     * @param mapAnchors - MapAnchors to check.
     */
    static isPresent(mapAnchors) {
        for (const mapAnchor of mapAnchors.children) {
            if (mapAnchor.name === MapViewAtmosphere.SkyAtmosphereUserName ||
                mapAnchor.name === MapViewAtmosphere.GroundAtmosphereUserName) {
                return true;
            }
        }
        return false;
    }
    get skyMesh() {
        return this.m_skyMesh;
    }
    get groundMesh() {
        return this.m_groundMesh;
    }
    /**
     * Allows to enable/disable the atmosphere effect, regardless of the theme settings.
     *
     * Use this method to change the setup in runtime without defining corresponding theme setup.
     *
     * @param enable - A boolean that specifies whether the atmosphere should be enabled or
     *                 disabled.
     */
    set enabled(enable) {
        // Check already disposed.
        if (this.disposed) {
            return;
        }
        if (this.m_enabled === enable) {
            return;
        }
        this.m_enabled = enable;
        const isAdded = MapViewAtmosphere.isPresent(this.m_mapAnchors);
        if (enable && !isAdded) {
            this.addToMapAnchors(this.m_mapAnchors);
        }
        else if (!enable && isAdded) {
            this.removeFromMapAnchors(this.m_mapAnchors);
        }
    }
    /**
     * Returns the current atmosphere status, enabled or disabled.
     */
    get enabled() {
        return this.m_enabled;
    }
    set lightMode(lightMode) {
        if (this.m_materialVariant !== AtmosphereShadingVariant.ScatteringShader) {
            return;
        }
        const dynamicLight = lightMode === AtmosphereLightMode.LightDynamic;
        if (this.m_groundMaterial !== undefined) {
            const groundMat = this.m_groundMaterial;
            groundMat.setDynamicLighting(dynamicLight);
        }
        if (this.m_skyMaterial !== undefined) {
            const skyMat = this.m_skyMaterial;
            skyMat.setDynamicLighting(dynamicLight);
        }
    }
    /**
     * Disposes allocated resources.
     */
    dispose() {
        var _a, _b, _c, _d;
        // Unlink from scene and mapview anchors
        if (this.enabled) {
            this.enabled = false;
        }
        (_a = this.m_skyMaterial) === null || _a === void 0 ? void 0 : _a.dispose();
        (_b = this.m_groundMaterial) === null || _b === void 0 ? void 0 : _b.dispose();
        (_c = this.m_skyGeometry) === null || _c === void 0 ? void 0 : _c.dispose();
        (_d = this.m_groundGeometry) === null || _d === void 0 ? void 0 : _d.dispose();
        // After disposal we may no longer enable effect.
        this.m_skyGeometry = undefined;
        this.m_groundGeometry = undefined;
        this.m_skyMaterial = undefined;
        this.m_groundMaterial = undefined;
        this.m_skyMesh = undefined;
        this.m_groundMesh = undefined;
    }
    /**
     * Sets the atmosphere depending on the
     * {@link @here/harp-datasource-protocol#Theme} instance provided.
     *
     * This function is called when a theme is loaded. Atmosphere is added only if the theme
     * contains a atmosphere definition with a:
     * - `color` property, used to set the atmosphere color.
     *
     * @param theme - A {@link @here/harp-datasource-protocol#Theme} instance.
     */
    reset(theme) {
        //this.m_cachedTheme = theme;
    }
    get disposed() {
        return this.m_skyMesh === undefined && this.m_groundMesh === undefined;
    }
    /**
     * Handles atmosphere effect adding.
     */
    addToMapAnchors(mapAnchors) {
        harp_utils_1.assert(!MapViewAtmosphere.isPresent(mapAnchors), "Atmosphere already added");
        if (this.m_skyMesh !== undefined) {
            mapAnchors.add(createMapAnchor(this.m_skyMesh, Number.MIN_SAFE_INTEGER));
        }
        if (this.m_groundMesh !== undefined) {
            mapAnchors.add(createMapAnchor(this.m_groundMesh, Number.MAX_SAFE_INTEGER));
        }
        // Request an update once the anchor is added to {@link MapView}.
        if (this.m_updateCallback) {
            this.m_updateCallback();
        }
    }
    /**
     * Handles atmosphere effect removal.
     */
    removeFromMapAnchors(mapAnchors) {
        if (!MapViewAtmosphere.isPresent(mapAnchors)) {
            return;
        }
        let update = false;
        if (this.m_skyMesh !== undefined) {
            mapAnchors.remove(this.m_skyMesh);
            update = true;
        }
        if (this.m_groundMesh !== undefined) {
            mapAnchors.remove(this.m_groundMesh);
            update = true;
        }
        if (update && this.m_updateCallback) {
            this.m_updateCallback();
        }
    }
    createSkyGeometry() {
        switch (this.m_projection.type) {
            case harp_geoutils_1.ProjectionType.Spherical:
                this.m_skyGeometry = new THREE.SphereGeometry(harp_geoutils_1.EarthConstants.EQUATORIAL_RADIUS * (1 + SKY_ATMOSPHERE_ALTITUDE_FACTOR), 256, 256);
                break;
            default: {
                this.m_skyGeometry = new THREE.PlaneGeometry(200, 200);
                break;
            }
        }
        this.m_skyGeometry.translate(0, 0, 0);
        if (this.m_materialVariant === AtmosphereShadingVariant.ScatteringShader) {
            this.m_skyMaterial = new harp_materials_1.SkyAtmosphereMaterial({
                rendererCapabilities: this.m_rendererCapabilities
            });
        }
        else if (this.m_materialVariant === AtmosphereShadingVariant.SimpleColor) {
            this.m_skyMaterial = new THREE.MeshBasicMaterial({
                color: new THREE.Color(0xc4f8ed),
                opacity: 0.4,
                transparent: false,
                depthTest: true,
                depthWrite: false,
                side: THREE.BackSide,
                blending: THREE.NormalBlending,
                fog: false
            });
        }
        else {
            this.m_skyMaterial = new THREE.MeshStandardMaterial({
                color: 0x7fffff,
                depthTest: false,
                depthWrite: false,
                normalScale: new THREE.Vector2(-1, -1),
                side: THREE.BackSide,
                wireframe: true
            });
        }
        this.m_skyMesh = new THREE.Mesh(this.m_skyGeometry, this.m_skyMaterial);
        // Assign custom name so sky object may be easily recognized withing the scene.
        this.m_skyMesh.name = MapViewAtmosphere.SkyAtmosphereUserName;
        this.setupSkyForRendering();
    }
    createGroundGeometry() {
        switch (this.m_projection.type) {
            case harp_geoutils_1.ProjectionType.Spherical:
                this.m_groundGeometry = new THREE.SphereGeometry(harp_geoutils_1.EarthConstants.EQUATORIAL_RADIUS * (1 + GROUND_ATMOSPHERE_ALTITUDE_FACTOR), 256, 256);
                break;
            default: {
                this.m_groundGeometry = new THREE.PlaneGeometry(200, 200);
                break;
            }
        }
        this.m_groundGeometry.translate(0, 0, 0);
        if (this.m_materialVariant === AtmosphereShadingVariant.ScatteringShader) {
            this.m_groundMaterial = new harp_materials_1.GroundAtmosphereMaterial({
                rendererCapabilities: this.m_rendererCapabilities
            });
        }
        else if (this.m_materialVariant === AtmosphereShadingVariant.SimpleColor) {
            this.m_groundMaterial = new THREE.MeshBasicMaterial({
                color: new THREE.Color(0x00c5ff),
                opacity: 0.4,
                transparent: true,
                depthTest: false,
                depthWrite: false,
                side: THREE.FrontSide,
                blending: THREE.NormalBlending,
                fog: false
            });
        }
        else {
            this.m_groundMaterial = new THREE.MeshStandardMaterial({
                color: 0x11899a,
                depthTest: true,
                depthWrite: false,
                side: THREE.FrontSide,
                wireframe: true
            });
        }
        this.m_groundMesh = new THREE.Mesh(this.m_groundGeometry, this.m_groundMaterial);
        // Assign name so object may be recognized withing the scene.
        this.m_groundMesh.name = MapViewAtmosphere.GroundAtmosphereUserName;
        this.setupGroundForRendering();
    }
    setupSkyForRendering() {
        if (this.m_skyMesh === undefined) {
            return;
        }
        // Depending on material variant we need to update uniforms or only
        // update camera near/far planes cause camera need to see further then
        // actual earth geometry.
        let onBeforeCallback;
        if (this.m_materialVariant !== AtmosphereShadingVariant.ScatteringShader) {
            // Setup only further clip planes before rendering.
            onBeforeCallback = (camera, _material) => {
                this.overrideClipPlanes(camera);
            };
        }
        else {
            // Setup proper clip planes and update uniforms values.
            onBeforeCallback = (camera, material) => {
                this.overrideClipPlanes(camera);
                // Check material wasn't swapped.
                harp_utils_1.assert(material instanceof harp_materials_1.SkyAtmosphereMaterial);
                const mat = this.m_skyMaterial;
                mat.updateUniforms(mat, this.m_skyMesh, camera, this.m_lightDirection);
            };
        }
        // Sky material should be already created with mesh.
        harp_utils_1.assert(this.m_skyMaterial !== undefined);
        this.m_skyMesh.onBeforeRender = (_renderer, _scene, camera, _geometry, material, _group) => {
            onBeforeCallback(camera, material);
        };
        this.m_skyMesh.onAfterRender = (_renderer, _scene, camera, _geometry, _material, _group) => {
            this.revertClipPlanes(camera);
        };
    }
    setupGroundForRendering() {
        if (this.m_groundMesh === undefined) {
            return;
        }
        if (this.m_materialVariant !== AtmosphereShadingVariant.ScatteringShader) {
            return;
        }
        // Ground material should be already created.
        harp_utils_1.assert(this.m_groundMaterial !== undefined);
        // Ground mesh does not need custom clip planes and uses the same camera setup as
        // real (data source based) geometry.
        this.m_groundMesh.onBeforeRender = (_renderer, _scene, camera, _geometry, material, _group) => {
            harp_utils_1.assert(material instanceof harp_materials_1.GroundAtmosphereMaterial);
            const mat = this.m_groundMaterial;
            mat.updateUniforms(mat, this.m_groundMesh, camera, this.m_lightDirection);
        };
    }
    overrideClipPlanes(rteCamera) {
        // Store current clip planes used by global camera before modifying them.
        const sceneCam = this.m_sceneCamera;
        cache.clipPlanes.near = sceneCam.near;
        cache.clipPlanes.far = sceneCam.far;
        // Calculate view ranges using world camera.
        // NOTE: ElevationProvider is not passed to evaluator, leaves min/max altitudes unchanged.
        const viewRanges = this.m_clipPlanesEvaluator.evaluateClipPlanes(this.m_sceneCamera, this.m_projection);
        // Update relative to eye camera used internally in rendering.
        harp_utils_1.assert(rteCamera instanceof THREE.PerspectiveCamera);
        const c = rteCamera;
        c.near = viewRanges.near;
        // Small margin ensures that we never cull small triangles just below or at
        // horizon - possible due to frustum culling in-precisions.
        c.far = viewRanges.far + harp_geoutils_1.EarthConstants.EQUATORIAL_RADIUS * 0.1;
        c.updateProjectionMatrix();
    }
    revertClipPlanes(rteCamera) {
        harp_utils_1.assert(rteCamera instanceof THREE.PerspectiveCamera);
        const c = rteCamera;
        // Restore scene camera clip planes.
        c.near = cache.clipPlanes.near;
        c.far = cache.clipPlanes.far;
        c.updateProjectionMatrix();
    }
}
exports.MapViewAtmosphere = MapViewAtmosphere;
/**
 * User data name attribute assigned to created mesh.
 */
MapViewAtmosphere.SkyAtmosphereUserName = "SkyAtmosphere";
/**
 * User data name attribute assigned to created mesh.
 */
MapViewAtmosphere.GroundAtmosphereUserName = "GroundAtmosphere";
function createMapAnchor(mesh, renderOrder) {
    const anchor = mesh;
    anchor.renderOrder = renderOrder;
    anchor.pickable = false;
    anchor.anchor = new THREE.Vector3(0, 0, 0);
    return anchor;
}
//# sourceMappingURL=MapViewAtmosphere.js.map

export default exports