"use strict";
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */

let exports = {}
exports.SkyCubemapTexture = exports.SkyCubemapFaceId = exports.SKY_CUBEMAP_FACE_COUNT = void 0;
import * as harp_utils_1 from "@here/harp-utils"
import * as three_1 from "three"
const logger = harp_utils_1.LoggerManager.instance.create("SkyCubemapTexture");
/**
 * Number of faces that form a [[SkyCubemapTexture]].
 */
exports.SKY_CUBEMAP_FACE_COUNT = 6;
/**
 * Maps the faceId to the expected position in the threejs faces array.
 */
var SkyCubemapFaceId;
(function (SkyCubemapFaceId) {
    SkyCubemapFaceId[SkyCubemapFaceId["positiveX"] = 0] = "positiveX";
    SkyCubemapFaceId[SkyCubemapFaceId["negativeX"] = 1] = "negativeX";
    SkyCubemapFaceId[SkyCubemapFaceId["positiveY"] = 2] = "positiveY";
    SkyCubemapFaceId[SkyCubemapFaceId["negativeY"] = 3] = "negativeY";
    SkyCubemapFaceId[SkyCubemapFaceId["positiveZ"] = 4] = "positiveZ";
    SkyCubemapFaceId[SkyCubemapFaceId["negativeZ"] = 5] = "negativeZ";
})(SkyCubemapFaceId = exports.SkyCubemapFaceId || (exports.SkyCubemapFaceId = {}));
/**
 * Class that handles loading all 6 faces of a [[CubeTexture]], to be used with [[SkyBackground]].
 */
class SkyCubemapTexture {
    /**
     * Constructs a new `SkyCubemapTexture`.
     *
     * @param sky - Initial [[CubemapSky]] configuration.
     */
    constructor(sky) {
        const faces = this.createCubemapFaceArray(sky);
        this.m_skybox =
            faces !== undefined ? new three_1.CubeTextureLoader().load(faces) : new three_1.CubeTexture();
    }
    /**
     * Disposes allocated resources.
     */
    dispose() {
        this.m_skybox.dispose();
    }
    /**
     * `SkyCubemapTexture`'s texture resource.
     */
    get texture() {
        return this.m_skybox;
    }
    /**
     * Updates the `SkyCubemapTexture` with new parameters.
     *
     * @param params - New [[CubemapSky]] configuration.
     */
    updateTexture(sky) {
        const faces = this.createCubemapFaceArray(sky);
        if (faces === undefined) {
            return;
        }
        this.m_skybox = new three_1.CubeTextureLoader().load(faces);
    }
    createCubemapFaceArray(sky) {
        const faces = [
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined
        ];
        for (let i = 0; i < exports.SKY_CUBEMAP_FACE_COUNT; ++i) {
            const face = sky[SkyCubemapFaceId[i]];
            if (face === undefined) {
                logger.error(`Face "${SkyCubemapFaceId[i]}" was not defined.`);
                return;
            }
            faces[i] = face;
        }
        return faces;
    }
}
exports.SkyCubemapTexture = SkyCubemapTexture;

export default exports
//# sourceMappingURL=SkyCubemapTexture.js.map