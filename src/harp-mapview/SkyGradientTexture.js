"use strict";
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */

let exports = {}
exports.SkyGradientTexture = exports.DEFAULT_MONOMIAL_POWER = exports.DEFAULT_TEXTURE_SIZE = void 0;
import * as harp_geoutils_1 from "@here/harp-geoutils"
import * as harp_utils_1 from "@here/harp-utils"
import * as three_1 from "three"
exports.DEFAULT_TEXTURE_SIZE = 512;
exports.DEFAULT_MONOMIAL_POWER = 1;
// Vectors used for skybox bitmap computation.
const cameraDir = [
    new three_1.Vector3(1, 0, 0),
    new three_1.Vector3(-1, 0, 0),
    new three_1.Vector3(0, -1, 0),
    new three_1.Vector3(0, 1, 0),
    new three_1.Vector3(0, 0, 1),
    new three_1.Vector3(0, 0, -1)
];
const cameraRight = [
    new three_1.Vector3(0, 0, -1),
    new three_1.Vector3(0, 0, 1),
    new three_1.Vector3(1, 0, 0),
    new three_1.Vector3(1, 0, 0),
    new three_1.Vector3(1, 0, 0),
    new three_1.Vector3(-1, 0, 0)
];
const cameraUp = [
    new three_1.Vector3(0, 1, 0),
    new three_1.Vector3(0, 1, 0),
    new three_1.Vector3(0, 0, 1),
    new three_1.Vector3(0, 0, -1),
    new three_1.Vector3(0, 1, 0),
    new three_1.Vector3(0, 1, 0)
];
/**
 * Class tha generates a texture containing a linear gradient, to be used with [[SkyBackground]].
 *
 * The gradient is mapped onto a sphere, where `topColor` maps to the top of the upper hemisphere,
 * `bottomColor` to the bottom of the upper hemisphere, and `groundColor` fills the bottom
 *  hemisphere..
 */
class SkyGradientTexture {
    /**
     * Constructs a new `SkyGradientTexture`.
     *
     * @param sky - Initial [[GradientSky]] configuration.
     * @param m_projectionType - {@link MapView}'s projection type.
     * @param m_height - Optional height parameter.
     */
    constructor(sky, m_projectionType, m_height = exports.DEFAULT_TEXTURE_SIZE) {
        this.m_projectionType = m_projectionType;
        this.m_height = m_height;
        const topColor = new three_1.Color(sky.topColor);
        const bottomColor = new three_1.Color(sky.bottomColor);
        const groundColor = new three_1.Color(sky.groundColor);
        this.m_width = this.m_projectionType === harp_geoutils_1.ProjectionType.Planar ? 1.0 : this.m_height;
        this.m_faceCount = this.m_projectionType === harp_geoutils_1.ProjectionType.Planar ? 1.0 : 6.0;
        this.m_faces = [];
        for (let i = 0; i < this.m_faceCount; ++i) {
            const data = new Uint8Array(3 * this.m_width * this.m_height);
            this.fillTextureData(data, i, topColor, bottomColor, groundColor, sky.monomialPower);
            const texture = new three_1.DataTexture(data, this.m_width, this.m_height, three_1.RGBFormat);
            texture.needsUpdate = true;
            texture.unpackAlignment = 1;
            this.m_faces.push(texture);
        }
        if (this.m_projectionType === harp_geoutils_1.ProjectionType.Spherical) {
            this.m_skybox = new three_1.CubeTexture(this.m_faces);
            this.m_skybox.needsUpdate = true;
        }
        else {
            this.m_farClipPlaneDividedVertically = new three_1.Line3();
            this.m_groundPlane = new three_1.Plane(new three_1.Vector3(0, 0, 1));
            this.m_bottomMidFarPoint = new three_1.Vector3();
            this.m_topMidFarPoint = new three_1.Vector3();
            this.m_horizonPosition = new three_1.Vector3();
            this.m_farClipPlaneCorners = [
                new three_1.Vector3(),
                new three_1.Vector3(),
                new three_1.Vector3(),
                new three_1.Vector3()
            ];
        }
    }
    /**
     * Disposes allocated resources.
     */
    dispose() {
        for (let i = 0; i < this.m_faceCount; ++i) {
            this.m_faces[i].dispose();
        }
        if (this.m_projectionType === harp_geoutils_1.ProjectionType.Spherical) {
            this.m_skybox.dispose();
        }
    }
    /**
     * `SkyGradientTexture`'s texture resource (simple texture or cubemap depending on
     * {@link MapView}'s projection).
     */
    get texture() {
        return this.m_projectionType === harp_geoutils_1.ProjectionType.Planar ? this.m_faces[0] : this.m_skybox;
    }
    /**
     * This method updates the position of the texture depending on the camera frustum.
     *
     * @param camera - The camera used in the map view.
     */
    update(camera) {
        if (this.m_projectionType === harp_geoutils_1.ProjectionType.Planar) {
            this.setHorizonPosition(camera);
            this.updateTexturePosition();
        }
    }
    /**
     * Updates the `SkyGradientTexture` with new parameters.
     *
     * @param params - New [[GradientSky]] configuration.
     */
    updateTexture(sky) {
        for (let i = 0; i < this.m_faceCount; ++i) {
            this.fillTextureData(this.m_faces[i].image.data, i, new three_1.Color(sky.topColor), new three_1.Color(sky.bottomColor), new three_1.Color(sky.groundColor), sky.monomialPower);
            this.m_faces[i].needsUpdate = true;
        }
        if (this.m_projectionType === harp_geoutils_1.ProjectionType.Spherical) {
            this.m_skybox.needsUpdate = true;
        }
    }
    // When creating the texture, a Uint8Array is required, because the resulting texture passed
    // to the scene as a background, is a texImage2D object, that does not accept UintClampedArray
    // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
    // But, when updating the texture, a Uint8ClampedArray is passed as argument, because
    // this.m_texture.image.data returns a Uint8ClampedArray. That's why this method accepts both.
    fillTextureData(data, faceIdx, topColor, bottomColor, groundColor, monomialPower) {
        const color = new three_1.Color();
        const dir = new three_1.Vector3();
        const right = new three_1.Vector3();
        const up = new three_1.Vector3();
        const upDir = new three_1.Vector3(0, 0, 1);
        for (let i = 0; i < this.m_height; ++i) {
            for (let j = 0; j < this.m_width; ++j) {
                if (this.m_projectionType === harp_geoutils_1.ProjectionType.Spherical) {
                    const offsetX = right
                        .copy(cameraRight[faceIdx])
                        .multiplyScalar(((j + 0.5) / this.m_width) * 2.0 - 1.0);
                    const offsetY = up
                        .copy(cameraUp[faceIdx])
                        .multiplyScalar(((i + 0.5) / this.m_height) * 2.0 - 1.0);
                    dir.copy(cameraDir[faceIdx]).add(offsetX).add(offsetY).normalize();
                    const t = Math.max(upDir.dot(dir), 0);
                    color
                        .copy(groundColor)
                        .lerp(bottomColor, Math.min(t * 100, 1))
                        .lerp(topColor, t ** harp_utils_1.getOptionValue(monomialPower, exports.DEFAULT_MONOMIAL_POWER))
                        .multiplyScalar(255);
                }
                else {
                    const t = i / this.m_height;
                    if (i === 0) {
                        color.copy(groundColor).multiplyScalar(255);
                    }
                    else {
                        color
                            .copy(bottomColor)
                            .lerp(topColor, t ** harp_utils_1.getOptionValue(monomialPower, exports.DEFAULT_MONOMIAL_POWER))
                            .multiplyScalar(255);
                    }
                }
                data[i * this.m_width * 3 + j * 3] = color.r;
                data[i * this.m_width * 3 + j * 3 + 1] = color.g;
                data[i * this.m_width * 3 + j * 3 + 2] = color.b;
            }
        }
    }
    setHorizonPosition(camera) {
        this.m_farClipPlaneCorners[0].set(-1, -1, 1).unproject(camera);
        this.m_farClipPlaneCorners[1].set(1, -1, 1).unproject(camera);
        this.m_farClipPlaneCorners[2].set(-1, 1, 1).unproject(camera);
        this.m_farClipPlaneCorners[3].set(1, 1, 1).unproject(camera);
        this.m_bottomMidFarPoint.copy(this.m_farClipPlaneCorners[0])
            .add(this.m_farClipPlaneCorners[1])
            .multiplyScalar(0.5);
        this.m_topMidFarPoint.copy(this.m_farClipPlaneCorners[2])
            .add(this.m_farClipPlaneCorners[3])
            .multiplyScalar(0.5);
        this.m_farClipPlaneDividedVertically.set(this.m_bottomMidFarPoint, this.m_topMidFarPoint);
        const hasIntersection = this.m_groundPlane.intersectLine(this.m_farClipPlaneDividedVertically, this.m_horizonPosition);
        // When there is no intersection between the ground plane and the
        // farClipPlaneDividedVertically, be sure that the horizon is reset. Otherwise a previous
        // intersection point stored in the m_horizonPosition will be considered the valid one.
        if (!hasIntersection) {
            this.m_horizonPosition.set(0.0, 0.0, 0.0);
        }
    }
    updateTexturePosition() {
        const coveredBySky = this.m_bottomMidFarPoint.distanceTo(this.m_horizonPosition);
        const frustumHeight = this.m_farClipPlaneDividedVertically.distance();
        const skyRatio = coveredBySky / frustumHeight;
        // If there is no intersection between the ground plane and the line that defines the far
        // clip plane divided vertically, it means that there is no sky visible and therefore the
        // ground color should be displayed. When there is no intersection, the length of the
        // this.m_horizonPosition is still equal to zero, as threejs initialize an empty vector with
        // all the three components to zero.
        // If there is an intersection, calculate the offset.
        const ratio = this.m_horizonPosition.length() === 0 ? 1 : skyRatio - 2 / this.m_height;
        // If the bottom part of the far clipping plane is under the ground plane, scroll the
        // texture down. Otherwise, the camera is looking at the sky, therefore, scroll the texture
        // up.
        this.m_faces[0].offset.set(0, this.m_bottomMidFarPoint.z <= 0 ? -ratio : skyRatio);
    }
}
exports.SkyGradientTexture = SkyGradientTexture;

export default exports
//# sourceMappingURL=SkyGradientTexture.js.map