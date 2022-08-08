import * as THREE from "three";
import { Tile } from "../Tile";
/**
 * Creates and adds a background plane mesh for the tile.
 * @param tile - The tile to which the ground plane belongs.
 * @param renderOrder - The plane render order.
 * @param materialOrColor - The plane material or a color for a default material.
 * @param opacity - The plane opacity.
 * @param createTexCoords - Whether to create texture coordinates.
 * @param receiveShadow - Whether the plane should receive shadows.
 * @param createMultiLod - Whether to generate multiple LODs for sphere projection.
 * @internal
 */
export declare function addGroundPlane(tile: Tile, renderOrder: number, materialOrColor?: THREE.Material | THREE.Material[] | number, opacity?: number, createTexCoords?: boolean, receiveShadow?: boolean, createMultiLod?: boolean): THREE.Mesh;
//# sourceMappingURL=AddGroundPlane.d.ts.map