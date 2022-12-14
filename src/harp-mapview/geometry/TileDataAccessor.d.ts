import { GeometryType } from "@here/harp-datasource-protocol";
import * as THREE from "three";
import { Tile, TileFeatureData } from "../Tile";
import { IGeometryAccessor, ILineAccessor, IObject3dAccessor } from "./TileGeometry";
/**
 * Interface for a client visitor that is used to visit all `THREE.Object`s in a tile.
 */
export interface ITileDataVisitor {
    tile: Tile;
    /**
     * Should return `true` if the visitor wants to visit the object with the specified
     * `featureId`. This function is called before the type of the object is even known.
     * @remarks Number ids are deprecated in favor of strings.
     */
    wantsFeature(featureId: number | string | undefined): boolean;
    /**
     * Should return `true` if the visitor wants to visit the point with the specified
     * `featureId`.
     * @remarks Number ids are deprecated in favor of strings.
     */
    wantsPoint(featureId: number | string | undefined): boolean;
    /**
     * Should return `true` if the visitor wants to visit the line with the specified
     * `featureId`.
     * @remarks Number ids are deprecated in favor of strings.
     */
    wantsLine(featureId: number | string | undefined): boolean;
    /**
     * Should return `true` if the visitor wants to visit the area object with the specified
     * `featureId`.
     * @remarks Number ids are deprecated in favor of strings.
     */
    wantsArea(featureId: number | string | undefined): boolean;
    /**
     * Should return `true` if the visitor wants to visit the object with the specified
     * `featureId`.
     * @remarks Number ids are deprecated in favor of strings.
     */
    wantsObject3D(featureId: number | string | undefined): boolean;
    /**
     * Visits a point object with the specified `featureId`; use `pointAccessor` to get the
     * object's properties.
     * @remarks Number ids are deprecated in favor of strings.
     */
    visitPoint(featureId: number | string | undefined): void;
    /**
     * Visits a line object with the specified `featureId`; use `pointAccessor` to get the
     * object's properties.
     * @remarks Number ids are deprecated in favor of strings.
     */
    visitLine(featureId: number | string | undefined, lineAccessor: ILineAccessor): void;
    /**
     * Visit an area object with the specified `featureId`; use `pointAccessor` to get the
     * object's properties.
     * @remarks Number ids are deprecated in favor of strings.
     */
    visitArea(featureId: number | string | undefined): void;
    /**
     * Visits a 3D object with the specified `featureId`; use `pointAccessor` to get the
     * object's properties.
     * @remarks Number ids are deprecated in favor of strings.
     */
    visitObject3D(featureId: number | string | undefined, object3dAccessor: IObject3dAccessor): void;
}
/**
 * An interface that provides options for {@link TileDataAccessor}.
 */
export interface TileDataAccessorOptions {
    /** Limit to objects that have `featureID`s. */
    onlyWithFeatureIds?: boolean;
    /** Sets and overrides `wantPoints`, `wantLines`, `wantAreas`, `wantObject3D`. */
    wantsAll?: boolean;
    /** `true` to visit points. */
    wantsPoints?: boolean;
    /** `true` to visit lines. */
    wantsLines?: boolean;
    /** `true` to visit area objects. */
    wantsAreas?: boolean;
    /** `true` to visit general 3D objects. */
    wantsObject3D?: boolean;
}
/**
 * An accessor for all geometries in a tile.
 *
 * @remarks
 * This class uses a client-provided {@link ITileDataVisitor}
 * to visit all objects, based on filtering options specified
 * by both, the `TileDataAccessor` and
 * the visitor itself.
 */
export declare class TileDataAccessor {
    tile: Tile;
    private readonly visitor;
    private readonly m_wantsPoints;
    private readonly m_wantsLines;
    private readonly m_wantsAreas;
    private readonly m_wantsObject3D;
    /**
     * Constructs a `TileDataAccessor` instance.
     *
     * @param tile - The tile to access.
     * @param visitor - The visitor.
     * @param options - Options for the tile.
     */
    constructor(tile: Tile, visitor: ITileDataVisitor, options: TileDataAccessorOptions);
    /**
     * Calls the visitor on all objects in the tile.
     */
    visitAll(): void;
    /**
     * Visits a single object. This function should normally be called during visiting.
     *
     * @param object - The object to visit.
     */
    protected visitObject(object: THREE.Object3D): void;
    /**
     * Gets the `BufferGeometry` from the specified object. This function requires the
     * attribute `position` in `BufferGeometry` to be set.
     *
     * @param object - The object from which to get the geometry.
     * @returns the geometry of the object, or `undefined`.
     */
    protected getBufferGeometry(object: THREE.Mesh): THREE.BufferGeometry | undefined;
    /**
     * Obtains an accessor for the nonindexed geometry. This function may return `undefined`
     * if the accessor is not implemented.
     *
     * @param geometryType - The type of geometry.
     * @param object - The object for which to access the attributes and geometry.
     * @param bufferGeometry - The object's `BufferGeometry`.
     * @returns an accessor for a specified object, if available.
     */
    protected getGeometryAccessor(geometryType: GeometryType, object: THREE.Mesh, bufferGeometry: THREE.BufferGeometry): IGeometryAccessor | undefined;
    /**
     * Obtains an accessor for the indexed geometry. This function may return `undefined`
     * if the accessor is not implemented.
     *
     * @param geometryType - The type of geometry.
     * @param object - The object for which to access the attributes and geometry.
     * @param bufferGeometry - The object's `BufferGeometry`.
     * @returns an accessor for a specified object, if available.
     */
    protected getIndexedGeometryAccessor(geometryType: GeometryType, object: THREE.Mesh, bufferGeometry: THREE.BufferGeometry): IGeometryAccessor | undefined;
    /**
     * Visit the object.
     *
     * @param meshObject - Object of type `Mesh`.
     * @param featureData - Dataset stored along with the object.
     */
    protected visitMesh(meshObject: THREE.Mesh, featureData: TileFeatureData): void;
}
//# sourceMappingURL=TileDataAccessor.d.ts.map