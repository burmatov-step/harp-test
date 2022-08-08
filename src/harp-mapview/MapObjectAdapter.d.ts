import { GeometryKind, Pickability, Technique } from "@here/harp-datasource-protocol";
import * as THREE from "three";
import { DataSource } from "./DataSource";
import { MapAdapterUpdateEnv } from "./MapMaterialAdapter";
/**
 * @hidden
 *
 * Construction params of `MapObjectAdapter`.
 */
export interface MapObjectAdapterParams {
    dataSource?: DataSource;
    technique?: Technique;
    kind?: GeometryKind[];
    level?: number;
    pickability?: Pickability;
}
/**
 * @hidden
 *
 * {@link MapView} specific data assigned to `THREE.Object3D` instance in installed in `userData`.
 *
 * `MapObjectAdapter` is registered in `usedData.mapAdapter` property of `THREE.Object3D`.
 */
export declare class MapObjectAdapter {
    /**
     * Resolve `MapObjectAdapter` associated with `object`.
     */
    static get(object: THREE.Object3D): MapObjectAdapter | undefined;
    static install(objData: MapObjectAdapter): MapObjectAdapter;
    static create(object: THREE.Object3D, params: MapObjectAdapterParams): MapObjectAdapter;
    static ensureUpdated(object: THREE.Object3D, context: MapAdapterUpdateEnv): boolean;
    /**
     * Associated scene object.
     */
    readonly object: THREE.Object3D;
    /**
     * [[Technique]] that constituted this object.
     */
    readonly technique?: Technique;
    /**
     * [[GeometryKind]] of `object`.
     */
    readonly kind: GeometryKind[] | undefined;
    readonly dataSource?: DataSource;
    /**
     * Which level this object exists on, must match the TileKey's level.
     */
    readonly level: number | undefined;
    private readonly m_pickability;
    private m_lastUpdateFrameNumber;
    private m_notCompletlyTransparent;
    constructor(object: THREE.Object3D, params: MapObjectAdapterParams);
    /**
     * Serialize contents.
     *
     * `THREE.Object3d.userData` is serialized during `clone`/`toJSON`, so we need to ensure that
     * we emit only "data" set of this object.
     */
    toJSON(): {
        kind: string[] | undefined;
        technique: import("@here/harp-datasource-protocol").SquaresTechnique | import("@here/harp-datasource-protocol").CirclesTechnique | import("@here/harp-datasource-protocol").PoiTechnique | import("@here/harp-datasource-protocol").LineMarkerTechnique | import("@here/harp-datasource-protocol").LineTechnique | import("@here/harp-datasource-protocol").SegmentsTechnique | import("@here/harp-datasource-protocol").SolidLineTechnique | import("@here/harp-datasource-protocol").FillTechnique | import("@here/harp-datasource-protocol").StandardTechnique | import("@here/harp-datasource-protocol").TerrainTechnique | import("@here/harp-datasource-protocol").BasicExtrudedLineTechnique | import("@here/harp-datasource-protocol").StandardExtrudedLineTechnique | import("@here/harp-datasource-protocol").ExtrudedPolygonTechnique | import("@here/harp-datasource-protocol").ShaderTechnique | import("@here/harp-datasource-protocol").TextTechnique | import("@here/harp-datasource-protocol").LabelRejectionLineTechnique | undefined;
    };
    /**
     * Ensure that underlying object is updated to current state of {@link MapView}.
     *
     * Updates object and attachments like materials to current state by evaluating scene dependent
     * expressions.
     *
     * Executes updates only once per frame basing on [[MapView.frameNumber]].
     *
     * Delegates updates of materials to [[MapMaterialAdapter.ensureUpdated]].
     *
     * @returns `true` if object performed some kind of update, `false` if no update was needed.
     */
    ensureUpdated(context: MapAdapterUpdateEnv): boolean;
    /**
     * Whether underlying `THREE.Object3D` is actually visible in scene.
     */
    isVisible(): boolean;
    /**
     * Whether underlying `THREE.Object3D` should be pickable by {@link PickHandler}.
     */
    isPickable(): boolean;
    get pickability(): Pickability;
    private updateMaterials;
    private getObjectMaterials;
}
//# sourceMappingURL=MapObjectAdapter.d.ts.map