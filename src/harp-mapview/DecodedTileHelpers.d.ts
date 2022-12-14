import { BufferAttribute, Env, Expr, Technique, Value } from "@here/harp-datasource-protocol";
import * as THREE from "three";
import { Tile } from "./Tile";
/**
 * The structure of the options to pass into [[createMaterial]].
 */
export interface MaterialOptions {
    /**
     * The shader [[Technique]] to choose.
     */
    technique: Technique;
    /**
     * Environment used to evaluate dynamic technique attributes.
     *
     * Usually {@link MapView.env}.
     */
    env: Env;
    /**
     * Properties to skip.
     *
     * @see [[applyTechniqueToMaterial]]
     */
    skipExtraProps?: string[];
    /**
     * `RawShaderMaterial` instances need to know about the fog at instantiation in order to avoid
     * recompiling them manually later (ThreeJS does not update fog for `RawShaderMaterial`s).
     */
    fog?: boolean;
    /**
     * Whether shadows are enabled or not, this is required because we change the material used.
     */
    shadowsEnabled?: boolean;
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
export declare function createMaterial(rendererCapabilities: THREE.WebGLCapabilities, options: MaterialOptions, onTextureCreated?: (texture: Promise<THREE.Texture>) => void): THREE.Material | undefined;
/**
 * Returns a [[THREE.BufferAttribute]] created from a provided
 * {@link @here/harp-datasource-protocol#BufferAttribute} object.
 *
 * @param attribute - BufferAttribute a WebGL compliant buffer
 * @internal
 */
export declare function getBufferAttribute(attribute: BufferAttribute): THREE.BufferAttribute;
/**
 * Determines if a technique uses THREE.Object3D instances.
 * @param technique - The technique to check.
 * @returns true if technique uses THREE.Object3D, false otherwise.
 * @internal
 */
export declare function usesObject3D(technique: Technique): boolean;
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
export declare function buildObject(technique: Technique, geometry: THREE.BufferGeometry, material: THREE.Material | THREE.Material[], tile: Tile, elevationEnabled: boolean): THREE.Object3D;
/**
 * Non material properties of `BaseTechnique`.
 * @internal
 */
export declare const BASE_TECHNIQUE_NON_MATERIAL_PROPS: string[];
/**
 * Generic material type constructor.
 * @internal
 */
export declare type MaterialConstructor = new (params: any) => THREE.Material;
/**
 * Returns a `MaterialConstructor` basing on provided technique object.
 *
 * @param technique - `Technique` object which the material will be based on.
 * @param shadowsEnabled - Whether the material can accept shadows, this is required for some
 *                         techniques to decide which material to create.
 *
 * @internal
 */
export declare function getMaterialConstructor(technique: Technique, shadowsEnabled: boolean): MaterialConstructor | undefined;
/**
 * Convert metric style property to expression that accounts {@link MapView.pixelToWorld} if
 * `metricUnit === 'Pixel'`.
 * @internal
 */
export declare function buildMetricValueEvaluator(value: Expr | Value | undefined, metricUnit: string | undefined): string | number | boolean | object | null | undefined;
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
export declare function evaluateBaseColorProperty(technique: Technique, env: Env): number | undefined;
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
export declare function applySecondaryColorToMaterial(materialColor: THREE.Color, techniqueColor: Value | Expr, env?: Env): void;
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
export declare function applyBaseColorToMaterial(material: THREE.Material, materialColor: THREE.Color, technique: Technique, techniqueColor: Value, env?: Env): void;
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
export declare function evaluateColorProperty(value: Value, env?: Env): number | undefined;
//# sourceMappingURL=DecodedTileHelpers.d.ts.map