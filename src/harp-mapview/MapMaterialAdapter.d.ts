import { Expr, Value } from "@here/harp-datasource-protocol";
import * as THREE from "three";
import { MapView } from "./MapView";
/**
 * @hidden
 *
 * Pick of {@link MapView} properties required to update materials used [[MapMaterialAdapter]].
 */
export declare type MapAdapterUpdateEnv = Pick<MapView, "env" | "frameNumber">;
/**
 * @hidden
 *
 * Custom, callback based property evaluator used by [[MapObjectAdapter]] to evaluate dynamic
 * properties of object/material.
 */
export declare type StylePropertyEvaluator = (context: MapAdapterUpdateEnv) => Value;
/**
 * @hidden
 *
 * Styled properties of material managed by [[MapMaterialAdapter]].
 */
export interface StyledProperties {
    [name: string]: Expr | StylePropertyEvaluator | Value | undefined;
}
/**
 * @hidden
 *
 * {@link MapView} specific data assigned to `THREE.Material` instance in installed in `userData`.
 *
 * [[MapMaterialAdapter]] is registered in `usedData.mapAdapter` property of `THREE.Material`.
 */
export declare class MapMaterialAdapter {
    /**
     * Resolve `MapMaterialAdapter` associated with `material`.
     */
    static get(material: THREE.Material): MapMaterialAdapter | undefined;
    static install(objData: MapMaterialAdapter): MapMaterialAdapter;
    static create(material: THREE.Material, styledProperties: StyledProperties): MapMaterialAdapter;
    static ensureUpdated(material: THREE.Material, context: MapAdapterUpdateEnv): boolean;
    /**
     * Associated material object.
     */
    readonly material: THREE.Material;
    /**
     * Styled material properties.
     *
     * Usually pick from [[Technique]] attributes that constitute material properties managed
     * by this adapter.
     */
    readonly styledProperties: StyledProperties;
    /**
     * Current values of styled material properties.
     *
     * Actual values valid for scope of one frame updated in [[ensureUpdated]].
     */
    readonly currentStyledProperties: {
        [name: string]: Value | undefined;
    };
    private m_lastUpdateFrameNumber;
    private readonly m_dynamicProperties;
    private readonly tmpColor;
    constructor(material: THREE.Material, styledProperties: StyledProperties);
    /**
     * Serialize contents.
     *
     * `THREE.Material.userData` is serialized during `clone`/`toJSON`, so we need to ensure that
     * we emit only "data" set of this object.
     */
    toJSON(): {
        styledProperties: StyledProperties;
    };
    /**
     * Ensure that underlying object is updated to current state of {@link MapView}.
     *
     * Updates dynamically styled properties of material by evaluating scene dependent expressions.
     *
     * Executes updates only once per frame basing on [[MapView.frameNumber]].
     *
     * @returns `true` if object performed some kind of update, `false` if no update was needed.
     */
    ensureUpdated(context: MapAdapterUpdateEnv): boolean;
    /**
     * Applies static properties to target material.
     */
    private setupStaticProperties;
    /**
     * Applies static properties to target material.
     */
    private updateDynamicProperties;
    private applyMaterialTextureProp;
    private applyMaterialGenericProp;
    private applyMaterialBaseColor;
}
//# sourceMappingURL=MapMaterialAdapter.d.ts.map