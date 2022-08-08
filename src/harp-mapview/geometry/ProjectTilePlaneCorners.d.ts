import { Projection } from "@here/harp-geoutils";
import * as THREE from "three";
import { Tile } from "../Tile";
/**
 * Coordinates of a tile's corners.
 * @internal
 * @hidden
 */
export interface TileCorners {
    se: THREE.Vector3;
    sw: THREE.Vector3;
    ne: THREE.Vector3;
    nw: THREE.Vector3;
}
/**
 * Returns the corners of the tile's geo bounding box projected using a given projection.
 * @param tile - The tile whose corners will be projected.
 * @param projection - The projection to be used.
 * @returns The projected tile corners.
 * @internal
 * @hidden
 */
export declare function projectTilePlaneCorners(tile: Tile, projection: Projection): TileCorners;
//# sourceMappingURL=ProjectTilePlaneCorners.d.ts.map