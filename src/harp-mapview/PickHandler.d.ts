import { Technique } from "@here/harp-datasource-protocol";
import { TileKey } from "@here/harp-geoutils";
import * as THREE from "three";
import { IntersectParams } from "./IntersectParams";
import { MapView } from "./MapView";
/**
 * Describes the general type of a picked object.
 */
export declare enum PickObjectType {
    /**
     * Unspecified.
     */
    Unspecified = 0,
    /**
     * A point object.
     */
    Point = 1,
    /**
     * A line object.
     */
    Line = 2,
    /**
     * An area object.
     */
    Area = 3,
    /**
     * The text part of a {@link TextElement}
     */
    Text = 4,
    /**
     * The Icon of a {@link TextElement}.
     */
    Icon = 5,
    /**
     * Any general 3D object, for example, a landmark.
     */
    Object3D = 6
}
/**
 * A general pick result. You can access the details of a picked geometry from the property
 * `intersection`, which is available if a geometry was hit. If a road was hit, a [[RoadPickResult]]
 * is returned, which has additional information, but no `intersection`.
 */
export interface PickResult {
    /**
     * General type of object.
     */
    type: PickObjectType;
    /**
     * A 2D point in screen coordinates, or a 3D point in world coordinates.
     */
    point: THREE.Vector2 | THREE.Vector3;
    /**
     * Distance from the camera to the picking point; used to determine the closest object.
     */
    distance: number;
    /**
     * Uniquely identifies the data source which provided the picked object.
     */
    dataSourceName: string | undefined;
    /**
     * Data source order, useful for sorting a collection of picking results.
     * A number for objects/features coming from tiles (as those have data sources attached),
     * an undefined when objects are added via "mapView.mapAnchors.add(object)" - those are treated as
     * base layer objects during picking (same as "dataSourceOrder: 0").
     */
    dataSourceOrder: number | undefined;
    /**
     * Render order of the intersected object.
     */
    renderOrder?: number;
    /**
     * An optional feature ID of the picked object.
     * @remarks The ID may be assigned by the object's {@link DataSource}, for example in case of
     * Optimized Map Vector (OMV) and GeoJSON data sources.
     */
    featureId?: number | string;
    /**
     * Defined for geometry only.
     */
    intersection?: THREE.Intersection;
    /**
     * Defined for roads or if `enableTechniqueInfo` option is enabled.
     */
    technique?: Technique;
    /**
     * Optional user data that has been defined in the picked object.
     *
     * @remarks
     * This object points directly to
     * information contained in the original {@link TileFeatureData}
     * stored in {@link MapView}, and should
     * not be modified.
     */
    userData?: any;
    /**
     * The tile key containing the picked object.
     */
    tileKey?: TileKey;
}
/**
 * Handles the picking of scene geometry and roads.
 * @internal
 */
export declare class PickHandler {
    readonly mapView: MapView;
    readonly camera: THREE.Camera;
    enablePickTechnique: boolean;
    private readonly m_pickingRaycaster;
    constructor(mapView: MapView, camera: THREE.Camera, enablePickTechnique?: boolean);
    /**
     * Does a raycast on all objects in the scene; useful for picking.
     *
     * @param x - The X position in CSS/client coordinates, without the applied display ratio.
     * @param y - The Y position in CSS/client coordinates, without the applied display ratio.
     * @param parameters - The intersection test behaviour may be adjusted by providing an instance
     * of {@link IntersectParams}.
     * @returns the list of intersection results.
     */
    intersectMapObjects(x: number, y: number, parameters?: IntersectParams): PickResult[];
    /**
     * Returns a ray caster using the supplied screen positions.
     *
     * @param x - The X position in css/client coordinates (without applied display ratio).
     * @param y - The Y position in css/client coordinates (without applied display ratio).
     *
     * @return Raycaster with origin at the camera and direction based on the supplied x / y screen
     * points.
     */
    raycasterFromScreenPoint(x: number, y: number): THREE.Raycaster;
    private createResult;
    private getIntersectedTiles;
    private addObjInfo;
    private setupRaycaster;
}
//# sourceMappingURL=PickHandler.d.ts.map