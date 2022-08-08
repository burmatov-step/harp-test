import { GeometryKind, GeometryKindSet } from "@here/harp-datasource-protocol";
import * as THREE from "three";
import { MapObjectAdapterParams } from "../MapObjectAdapter";
import { Tile } from "../Tile";
/**
 * Adds a THREE object to the root of the tile and register [[MapObjectAdapter]].
 *
 * Sets the owning tiles datasource.name and the `tileKey` in the `userData` property of the
 * object, such that the tile it belongs to can be identified during picking.
 *
 * @param tile - The {@link Tile} to add the object to.
 * @param object - The object to add to the root of the tile.
 * @param geometryKind - The kind of object. Can be used for filtering.
 * @param mapAdapterParams - additional parameters for [[MapObjectAdapter]]
 */
export declare function registerTileObject(tile: Tile, object: THREE.Object3D, geometryKind: GeometryKind | GeometryKindSet | undefined, mapAdapterParams?: MapObjectAdapterParams): void;
//# sourceMappingURL=RegisterTileObject.d.ts.map