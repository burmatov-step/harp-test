"use strict";
/*
 * Copyright (C) 2018-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.evaluateColorProperty = exports.applyBaseColorToMaterial = exports.applySecondaryColorToMaterial = exports.evaluateBaseColorProperty = exports.buildMetricValueEvaluator = exports.getMaterialConstructor = exports.BASE_TECHNIQUE_NON_MATERIAL_PROPS = exports.buildObject = exports.usesObject3D = exports.getBufferAttribute = exports.createMaterial = void 0;
import * as harp_datasource_protocol_1 from "@here/harp-datasource-protocol";
import * as TechniqueDescriptors_1 from "@here/harp-datasource-protocol/lib/TechniqueDescriptors";
import * as harp_materials_1 from "@here/harp-materials";
import * as harp_utils_1 from "@here/harp-utils";
import * as THREE from "three";
import DisplacedMesh_1 from "./geometry/DisplacedMesh";
import SolidLineMesh_1 from "./geometry/SolidLineMesh";
import MapMaterialAdapter_1 from "./MapMaterialAdapter";
import MapViewPoints_1 from "./MapViewPoints";
import ThemeHelpers_1 from "./ThemeHelpers";
const logger = harp_utils_1.LoggerManager.instance.create("DecodedTileHelpers");
function createTextureFromURL(url, onLoad, onError, isObjectURL) {
    const texture = new THREE.TextureLoader().load(url, onLoad, undefined, // onProgress
    onError);
    if (isObjectURL) {
        // Remove object URL on dispose to avoid memory leaks.
        texture.addEventListener("dispose", () => {
            URL.revokeObjectURL(url);
        });
    }
}
function createTextureFromRawImage(textureBuffer, onLoad, onError) {
    const properties = textureBuffer.dataTextureProperties;
    if (properties) {
        const textureDataType = properties.type
            ? ThemeHelpers_1.toTextureDataType(properties.type)
            : undefined;
        const buffer = getTextureBuffer(textureBuffer.buffer, textureDataType);
        const texture = new THREE.DataTexture(buffer, properties.width, properties.height, properties.format ? ThemeHelpers_1.toPixelFormat(properties.format) : undefined, textureDataType);
        onLoad(texture);
    }
    else {
        onError("no data texture properties provided.");
    }
}
function initTextureProperties(texture, properties) {
    if (!properties) {
        return;
    }
    if (properties.wrapS !== undefined) {
        texture.wrapS = ThemeHelpers_1.toWrappingMode(properties.wrapS);
    }
    if (properties.wrapT !== undefined) {
        texture.wrapT = ThemeHelpers_1.toWrappingMode(properties.wrapT);
    }
    if (properties.magFilter !== undefined) {
        texture.magFilter = ThemeHelpers_1.toTextureFilter(properties.magFilter);
    }
    if (properties.minFilter !== undefined) {
        texture.minFilter = ThemeHelpers_1.toTextureFilter(properties.minFilter);
    }
    if (properties.flipY !== undefined) {
        texture.flipY = properties.flipY;
    }
    if (properties.repeatU !== undefined) {
        texture.repeat.x = properties.repeatU;
    }
    if (properties.repeatV !== undefined) {
        texture.repeat.y = properties.repeatV;
    }
}
function createTexture(material, texturePropertyName, options) {
    const technique = options.technique;
    let textureProperty = technique[texturePropertyName];
    if (textureProperty === undefined) {
        return undefined;
    }
    const texturePromise = new Promise((resolve, reject) => {
        const onLoad = (texture) => {
            const properties = technique[texturePropertyName + "Properties"];
            initTextureProperties(texture, properties);
            material[texturePropertyName] = texture;
            material.needsUpdate = true;
            resolve(texture);
        };
        const onError = (error) => {
            logger.error("#createMaterial: Failed to load texture: ", error);
            reject(error);
        };
        if (harp_datasource_protocol_1.Expr.isExpr(textureProperty)) {
            textureProperty = harp_datasource_protocol_1.getPropertyValue(textureProperty, options.env);
            if (!textureProperty) {
                // Expression may evaluate to a valid texture at any time, create a fake texture to
                // avoid shader recompilation.
                onLoad(new THREE.Texture());
                return;
            }
        }
        if (typeof textureProperty === "string") {
            createTextureFromURL(textureProperty, onLoad, onError, false);
        }
        else if (harp_datasource_protocol_1.isTextureBuffer(textureProperty)) {
            if (textureProperty.type === "image/raw") {
                createTextureFromRawImage(textureProperty, onLoad, onError);
            }
            else {
                const textureBlob = new Blob([textureProperty.buffer], {
                    type: textureProperty.type
                });
                createTextureFromURL(URL.createObjectURL(textureBlob), onLoad, onError, true);
            }
        }
        else if (typeof textureProperty === "object" &&
            (textureProperty.nodeName === "IMG" || textureProperty.nodeName === "CANVAS")) {
            onLoad(new THREE.CanvasTexture(textureProperty));
        }
    });
    return texturePromise;
}
/**
 * Create a material, depending on the rendering technique provided in the options.
 *
 * @param rendererCapabilities - The capabilities of the renderer that will use the material.
 * @param options - The material options the subsequent functions need.
 * @param onTextureCreated - Optional callback for each texture created for the material, getting
 * a promise that will be resolved once the texture is loaded. Texture is not uploaded to GPU.
 *
 * @returns new material instance that matches `technique.name`.
 *
 * @internal
 */
function createMaterial(rendererCapabilities, options, onTextureCreated) {
    const technique = options.technique;
    const Constructor = getMaterialConstructor(technique, options.shadowsEnabled === true);
    const settings = {};
    if (Constructor === undefined) {
        return undefined;
    }
    if (Constructor.prototype instanceof harp_materials_1.RawShaderMaterial) {
        settings.rendererCapabilities = rendererCapabilities;
        if (Constructor !== harp_materials_1.HighPrecisionLineMaterial) {
            settings.fog = options.fog;
        }
    }
    if (options.shadowsEnabled === true && technique.name === "fill") {
        settings.removeDiffuseLight = true;
    }
    const material = new Constructor(settings);
    if (technique.id !== undefined) {
        material.name = technique.id;
    }
    if (harp_datasource_protocol_1.isExtrudedPolygonTechnique(technique)) {
        material.flatShading = true;
    }
    material.depthTest = harp_datasource_protocol_1.isExtrudedPolygonTechnique(technique) && technique.depthTest !== false;
    if (harp_datasource_protocol_1.supportsTextures(technique)) {
        harp_datasource_protocol_1.TEXTURE_PROPERTY_KEYS.forEach((texturePropertyName) => {
            const texturePromise = createTexture(material, texturePropertyName, options);
            if (texturePromise) {
                onTextureCreated === null || onTextureCreated === void 0 ? void 0 : onTextureCreated(texturePromise);
            }
        });
    }
    if (harp_datasource_protocol_1.isShaderTechnique(technique)) {
        // Special case for ShaderTechnique.
        applyShaderTechniqueToMaterial(technique, material);
    }
    else {
        MapMaterialAdapter_1.MapMaterialAdapter.create(material, getMainMaterialStyledProps(technique));
    }
    return material;
}
exports.createMaterial = createMaterial;
/**
 * Returns a [[THREE.BufferAttribute]] created from a provided
 * {@link @here/harp-datasource-protocol#BufferAttribute} object.
 *
 * @param attribute - BufferAttribute a WebGL compliant buffer
 * @internal
 */
function getBufferAttribute(attribute) {
    switch (attribute.type) {
        case "float":
            return new THREE.BufferAttribute(new Float32Array(attribute.buffer), attribute.itemCount);
        case "uint8":
            return new THREE.BufferAttribute(new Uint8Array(attribute.buffer), attribute.itemCount, attribute.normalized);
        case "uint16":
            return new THREE.BufferAttribute(new Uint16Array(attribute.buffer), attribute.itemCount, attribute.normalized);
        case "uint32":
            return new THREE.BufferAttribute(new Uint32Array(attribute.buffer), attribute.itemCount, attribute.normalized);
        case "int8":
            return new THREE.BufferAttribute(new Int8Array(attribute.buffer), attribute.itemCount, attribute.normalized);
        case "int16":
            return new THREE.BufferAttribute(new Int16Array(attribute.buffer), attribute.itemCount, attribute.normalized);
        case "int32":
            return new THREE.BufferAttribute(new Int32Array(attribute.buffer), attribute.itemCount, attribute.normalized);
        default:
            throw new Error(`unsupported buffer of type ${attribute.type}`);
    } // switch
}
exports.getBufferAttribute = getBufferAttribute;
/**
 * Determines if a technique uses THREE.Object3D instances.
 * @param technique - The technique to check.
 * @returns true if technique uses THREE.Object3D, false otherwise.
 * @internal
 */
function usesObject3D(technique) {
    const name = technique.name;
    return (name !== undefined &&
        name !== "text" &&
        name !== "labeled-icon" &&
        name !== "line-marker" &&
        name !== "label-rejection-line");
}
exports.usesObject3D = usesObject3D;
/**
 * Builds the object associated with the given technique.
 *
 * @param technique - The technique.
 * @param geometry - The object's geometry.
 * @param material - The object's material.
 * @param tile - The tile where the object is located.
 * @param elevationEnabled - True if elevation is enabled, false otherwise.
 *
 * @internal
 */
function buildObject(technique, geometry, material, tile, elevationEnabled) {
    harp_utils_1.assert(technique.name !== undefined);
    switch (technique.name) {
        case "extruded-line":
        case "standard":
        case "extruded-polygon":
        case "fill":
            return elevationEnabled
                ? new DisplacedMesh_1.DisplacedMesh(geometry, material, () => ({
                    min: tile.elevationRange.minElevation,
                    max: tile.elevationRange.maxElevation
                }))
                : new THREE.Mesh(geometry, material);
        case "terrain":
            return new THREE.Mesh(geometry, material);
        case "dashed-line":
        case "solid-line":
            return elevationEnabled
                ? new DisplacedMesh_1.DisplacedMesh(geometry, material, () => ({
                    min: tile.elevationRange.minElevation,
                    max: tile.elevationRange.maxElevation
                }), SolidLineMesh_1.SolidLineMesh.raycast)
                : new SolidLineMesh_1.SolidLineMesh(geometry, material);
        case "circles":
            return new MapViewPoints_1.Circles(geometry, material);
        case "squares":
            return new MapViewPoints_1.Squares(geometry, material);
        case "line":
            return new THREE.LineSegments(geometry, material);
        case "segments":
            return new THREE.LineSegments(geometry, material);
        case "shader": {
            harp_utils_1.assert(harp_datasource_protocol_1.isShaderTechnique(technique), "Invalid technique");
            switch (technique.primitive) {
                case "line":
                    return new THREE.Line(geometry, material);
                case "segments":
                    return new THREE.LineSegments(geometry, material);
                case "point":
                    return new THREE.Points(geometry, material);
                case "mesh":
                    return new THREE.Mesh(geometry, material);
            }
        }
    }
    harp_utils_1.assert(false, "Invalid technique");
    return new THREE.Object3D();
}
exports.buildObject = buildObject;
/**
 * Non material properties of `BaseTechnique`.
 * @internal
 */
exports.BASE_TECHNIQUE_NON_MATERIAL_PROPS = ["name", "id", "renderOrder", "transient"];
/**
 * Returns a `MaterialConstructor` basing on provided technique object.
 *
 * @param technique - `Technique` object which the material will be based on.
 * @param shadowsEnabled - Whether the material can accept shadows, this is required for some
 *                         techniques to decide which material to create.
 *
 * @internal
 */
function getMaterialConstructor(technique, shadowsEnabled) {
    if (technique.name === undefined) {
        return undefined;
    }
    switch (technique.name) {
        case "extruded-line":
            if (!harp_datasource_protocol_1.isExtrudedLineTechnique(technique)) {
                throw new Error("Invalid extruded-line technique");
            }
            return technique.shading === "standard"
                ? harp_materials_1.MapMeshStandardMaterial
                : harp_materials_1.MapMeshBasicMaterial;
        case "standard":
        case "terrain":
        case "extruded-polygon":
            return harp_materials_1.MapMeshStandardMaterial;
        case "dashed-line":
        case "solid-line":
            return harp_materials_1.SolidLineMaterial;
        case "fill":
            return shadowsEnabled ? harp_materials_1.MapMeshStandardMaterial : harp_materials_1.MapMeshBasicMaterial;
        case "squares":
            return THREE.PointsMaterial;
        case "circles":
            return harp_materials_1.CirclePointsMaterial;
        case "line":
        case "segments":
            return THREE.LineBasicMaterial;
        case "shader":
            return THREE.ShaderMaterial;
        case "text":
        case "labeled-icon":
        case "line-marker":
        case "label-rejection-line":
            return undefined;
    }
}
exports.getMaterialConstructor = getMaterialConstructor;
/**
 * Styled properties of main material (created by [[createMaterial]]) managed by
 * [[MapObjectAdapter]].
 */
function getMainMaterialStyledProps(technique) {
    var _a;
    const automaticAttributes = TechniqueDescriptors_1.getTechniqueAutomaticAttrs(technique);
    switch (technique.name) {
        case "dashed-line":
        case "solid-line": {
            const baseProps = harp_utils_1.pick(technique, automaticAttributes);
            baseProps.lineWidth = buildMetricValueEvaluator((_a = technique.lineWidth) !== null && _a !== void 0 ? _a : 0, // Compatibility: `undefined` lineWidth means hidden.
            technique.metricUnit);
            baseProps.outlineWidth = buildMetricValueEvaluator(technique.outlineWidth, technique.metricUnit);
            baseProps.dashSize = buildMetricValueEvaluator(technique.dashSize, technique.metricUnit);
            baseProps.gapSize = buildMetricValueEvaluator(technique.gapSize, technique.metricUnit);
            baseProps.offset = buildMetricValueEvaluator(technique.offset, technique.metricUnit);
            return baseProps;
        }
        case "fill":
            return harp_utils_1.pick(technique, automaticAttributes);
        case "standard":
        case "terrain":
        case "extruded-polygon": {
            const baseProps = harp_utils_1.pick(technique, automaticAttributes);
            if (technique.vertexColors !== true) {
                baseProps.color = technique.color;
            }
            return baseProps;
        }
        case "circles":
        case "squares":
            return harp_utils_1.pick(technique, automaticAttributes);
        case "extruded-line":
            return harp_utils_1.pick(technique, [
                "color",
                "wireframe",
                "transparent",
                "opacity",
                "polygonOffset",
                "polygonOffsetFactor",
                "polygonOffsetUnits",
                ...automaticAttributes
            ]);
        case "line":
        case "segments":
            return harp_utils_1.pick(technique, automaticAttributes);
        default:
            return {};
    }
}
/**
 * Convert metric style property to expression that accounts {@link MapView.pixelToWorld} if
 * `metricUnit === 'Pixel'`.
 * @internal
 */
function buildMetricValueEvaluator(value, metricUnit) {
    if (value === undefined || value === null) {
        return value;
    }
    if (typeof value === "string") {
        if (value.endsWith("px")) {
            metricUnit = "Pixel";
            value = Number.parseFloat(value);
        }
        else if (value.endsWith("m")) {
            value = Number.parseFloat(value);
        }
    }
    if (metricUnit === "Pixel") {
        return (context) => {
            var _a;
            const pixelToWorld = (_a = context.env.lookup("$pixelToMeters")) !== null && _a !== void 0 ? _a : 1;
            const evaluated = harp_datasource_protocol_1.getPropertyValue(value, context.env);
            return pixelToWorld * evaluated;
        };
    }
    else {
        return value;
    }
}
exports.buildMetricValueEvaluator = buildMetricValueEvaluator;
/**
 * Allows to easy parse/encode technique's base color property value as number coded color.
 *
 * @remarks
 * Function takes care about property parsing, interpolation and encoding if neccessary.
 *
 * @see ColorUtils
 * @param technique - the technique where we search for base (transparency) color value
 * @param env - {@link @here/harp-datasource-protocol#Env} instance
 *              used to evaluate {@link @here/harp-datasource-protocol#Expr}
 *              based properties of `Technique`
 * @returns `number` encoded color value (in custom #TTRRGGBB) format or `undefined` if
 * base color property is not defined in the technique passed.
 *
 * @internal
 */
function evaluateBaseColorProperty(technique, env) {
    const baseColorProp = getBaseColorProp(technique);
    if (baseColorProp !== undefined) {
        return evaluateColorProperty(baseColorProp, env);
    }
    return undefined;
}
exports.evaluateBaseColorProperty = evaluateBaseColorProperty;
/**
 * Apply `ShaderTechnique` parameters to material.
 *
 * @param technique - the `ShaderTechnique` which requires special handling
 * @param material - material to which technique will be applied
 *
 * @internal
 */
function applyShaderTechniqueToMaterial(technique, material) {
    if (technique.transparent) {
        harp_materials_1.enableBlending(material);
    }
    else {
        harp_materials_1.disableBlending(material);
    }
    // The shader technique takes the argument from its `params' member.
    const params = technique.params;
    // Remove base color and transparency properties from the processed set.
    const baseColorPropName = getBaseColorPropName(technique);
    const hasBaseColor = baseColorPropName && baseColorPropName in technique.params;
    const props = Object.getOwnPropertyNames(params).filter(propertyName => {
        // Omit base color and related transparency attributes if its defined in technique
        if (baseColorPropName === propertyName ||
            (hasBaseColor && harp_datasource_protocol_1.TRANSPARENCY_PROPERTY_KEYS.includes(propertyName))) {
            return false;
        }
        const prop = propertyName;
        if (prop === "name") {
            // skip reserved property names
            return false;
        }
        return true;
    });
    // Apply all technique properties omitting base color and transparency attributes.
    props.forEach(propertyName => {
        // TODO: Check if properties values should not be interpolated, possible bug in old code!
        // This behavior is kept in the new version too, level is set to undefined.
        applyTechniquePropertyToMaterial(material, propertyName, params[propertyName]);
    });
    if (hasBaseColor) {
        const propColor = baseColorPropName;
        // Finally apply base color and related properties to material (opacity, transparent)
        applyBaseColorToMaterial(material, material[propColor], technique, params[propColor]);
    }
}
/**
 * Apply single and generic technique property to corresponding material parameter.
 *
 * @note Special handling for material attributes of [[THREE.Color]] type is provided thus it
 * does not provide constructor that would take [[string]] or [[number]] values.
 *
 * @param material - target material
 * @param propertyName - material and technique parameter name (or index) that is to be transferred
 * @param techniqueAttrValue - technique property value which will be applied to material attribute
 * @param env - {@link @here/harp-datasource-protocol#Env} instance used
 *              to evaluate {@link @here/harp-datasource-protocol#Expr}
 *              based properties of [[Technique]]
 */
function applyTechniquePropertyToMaterial(material, propertyName, techniqueAttrValue, env) {
    const m = material;
    if (m[propertyName] instanceof THREE.Color) {
        applySecondaryColorToMaterial(material[propertyName], techniqueAttrValue, env);
    }
    else {
        const value = evaluateProperty(techniqueAttrValue, env);
        if (value !== null) {
            m[propertyName] = value;
        }
    }
}
/**
 * Apply technique color to material taking special care with transparent (RGBA) colors.
 *
 * @remarks
 * @note This function is intended to be used with secondary, triary etc. technique colors,
 * not the base ones that may contain transparency information. Such colors should be processed
 * with [[applyTechniqueBaseColorToMaterial]] function.
 *
 * @param technique - an technique the applied color comes from
 * @param material - the material to which color is applied
 * @param prop - technique property (color) name
 * @param value - color value
 * @param env - {@link @here/harp-datasource-protocol#Env} instance used
 *              to evaluate {@link @here/harp-datasource-protocol#Expr}
 *              based properties of `Technique`.
 *
 * @internal
 */
function applySecondaryColorToMaterial(materialColor, techniqueColor, env) {
    let value = evaluateColorProperty(techniqueColor, env);
    if (value === undefined) {
        return;
    }
    if (harp_datasource_protocol_1.ColorUtils.hasAlphaInHex(value)) {
        logger.warn("Used RGBA value for technique color without transparency support!");
        // Just for clarity remove transparency component, even if that would be ignored
        // by THREE.Color.setHex() function.
        value = harp_datasource_protocol_1.ColorUtils.removeAlphaFromHex(value);
    }
    materialColor.setHex(value);
}
exports.applySecondaryColorToMaterial = applySecondaryColorToMaterial;
/**
 * Apply technique base color (transparency support) to material with modifying material opacity.
 *
 * @remarks
 * This method applies main (or base) technique color with transparency support to the corresponding
 * material color, with an effect on entire [[THREE.Material]] __opacity__ and __transparent__
 * attributes.
 *
 * @note Transparent colors should be processed as the very last technique attributes,
 * since their effect on material properties like [[THREE.Material.opacity]] and
 * [[THREE.Material.transparent]] could be overridden by corresponding technique params.
 *
 * @param technique - an technique the applied color comes from
 * @param material - the material to which color is applied
 * @param prop - technique property (color) name
 * @param value - color value in custom number format
 * @param env - {@link @here/harp-datasource-protocol#Env} instance used to evaluate
 *              {@link @here/harp-datasource-protocol#Expr} based properties of [[Technique]]
 *
 * @internal
 */
function applyBaseColorToMaterial(material, materialColor, technique, techniqueColor, env) {
    const colorValue = evaluateColorProperty(techniqueColor, env);
    if (colorValue === undefined) {
        return;
    }
    const { r, g, b, a } = harp_datasource_protocol_1.ColorUtils.getRgbaFromHex(colorValue);
    // Override material opacity and blending by mixing technique defined opacity
    // with main color transparency
    const tech = technique;
    let opacity = a;
    if (tech.opacity !== undefined) {
        opacity *= evaluateProperty(tech.opacity, env);
    }
    opacity = THREE.MathUtils.clamp(opacity, 0, 1);
    if (material instanceof harp_materials_1.RawShaderMaterial) {
        material.setOpacity(opacity);
    }
    else {
        material.opacity = opacity;
    }
    materialColor.setRGB(r, g, b);
    const opaque = opacity >= 1.0;
    if (!opaque) {
        harp_materials_1.enableBlending(material);
    }
    else {
        harp_materials_1.disableBlending(material);
    }
}
exports.applyBaseColorToMaterial = applyBaseColorToMaterial;
/**
 * Calculates the value of the technique defined property.
 *
 * Function takes care about property interpolation (when @param `env` is set) as also parsing
 * string encoded numbers.
 *
 * @note Use with care, because function does not recognize property type.
 * @param value - the value of color property defined in technique
 * @param env - {@link @here/harp-datasource-protocol#Env} instance used to evaluate
 *              {@link @here/harp-datasource-protocol#Expr} based properties of [[Technique]]
 */
function evaluateProperty(value, env) {
    if (env !== undefined && harp_datasource_protocol_1.Expr.isExpr(value)) {
        value = harp_datasource_protocol_1.getPropertyValue(value, env);
    }
    return value;
}
/**
 * Calculates the numerical value of the technique defined color property.
 *
 * @remarks
 * Function takes care about color interpolation (when @param `env is set) as also parsing
 * string encoded colors.
 *
 * @note Use with care, because function does not recognize property type.
 * @param value - the value of color property defined in technique
 * @param env - {@link @here/harp-datasource-protocol#Env} instance used to evaluate
 *              {@link @here/harp-datasource-protocol#Expr} based properties of [[Technique]]
 * @internal
 */
function evaluateColorProperty(value, env) {
    value = evaluateProperty(value, env);
    if (value === undefined || value === null) {
        return undefined;
    }
    if (typeof value === "number") {
        return value;
    }
    if (typeof value === "string") {
        const parsed = harp_datasource_protocol_1.parseStringEncodedColor(value);
        if (parsed !== undefined) {
            return parsed;
        }
    }
    logger.error(`Unsupported color format: '${value}'`);
    return undefined;
}
exports.evaluateColorProperty = evaluateColorProperty;
/**
 * Allows to access base color property value for given technique.
 *
 * The color value may be encoded in [[number]], [[string]] or even as
 * [[InterpolateProperty]].
 *
 * @param technique - The techniqe where we seach for base color property.
 * @returns The value of technique color used to apply transparency.
 */
function getBaseColorProp(technique) {
    const baseColorPropName = getBaseColorPropName(technique);
    if (baseColorPropName !== undefined) {
        if (!harp_datasource_protocol_1.isShaderTechnique(technique)) {
            const propColor = baseColorPropName;
            return technique[propColor];
        }
        else {
            const params = technique.params;
            const propColor = baseColorPropName;
            return params[propColor];
        }
    }
    return undefined;
}
function getBaseColorPropName(technique) {
    var _a;
    return (_a = TechniqueDescriptors_1.getTechniqueDescriptor(technique)) === null || _a === void 0 ? void 0 : _a.attrTransparencyColor;
}
function getTextureBuffer(buffer, textureDataType) {
    if (textureDataType === undefined) {
        return new Uint8Array(buffer);
    }
    switch (textureDataType) {
        case THREE.UnsignedByteType:
            return new Uint8Array(buffer);
        case THREE.ByteType:
            return new Int8Array(buffer);
        case THREE.ShortType:
            return new Int16Array(buffer);
        case THREE.UnsignedShortType:
            return new Uint16Array(buffer);
        case THREE.IntType:
            return new Int32Array(buffer);
        case THREE.UnsignedIntType:
            return new Uint32Array(buffer);
        case THREE.FloatType:
            return new Float32Array(buffer);
        case THREE.HalfFloatType:
            return new Uint16Array(buffer);
    }
    throw new Error("Unsupported texture data type");
}
//# sourceMappingURL=DecodedTileHelpers.js.map

export default exports