import { DecodedTile, GeometryKindSet, IndexedTechnique, TextPathGeometry } from "@here/harp-datasource-protocol";
import * as THREE from "three";
import { Tile } from "../Tile";
/**
 * Parameters that control fading.
 */
export interface FadingParameters {
    fadeNear?: number;
    fadeFar?: number;
}
/**
 * Parameters that control fading for extruded buildings with fading edges.
 */
export interface PolygonFadingParameters extends FadingParameters {
    color?: string | number;
    colorMix?: number;
    lineFadeNear?: number;
    lineFadeFar?: number;
}
/**
 * Support class to create geometry for a {@link Tile} from a {@link @here/harp-datasource-protocol#DecodedTile}.
 * @internal
 */
export declare class TileGeometryCreator {
    private static m_instance;
    /**
     * The `instance` of the `TileGeometryCreator`.
     *
     * @returns TileGeometryCreator
     */
    static get instance(): TileGeometryCreator;
    /**
     *  Creates an instance of TileGeometryCreator. Access is allowed only through `instance`.
     */
    private constructor();
    /**
     * Apply `enabledKinds` and `disabledKinds` to all techniques in the `decodedTile`. If a
     * technique is identified as disabled, its property `enabled` is set to `false`.
     *
     * @param decodedTile - The decodedTile containing the actual tile map data.
     * @param enabledKinds - Optional [[GeometryKindSet]] used to specify which object kinds should be
     *      created.
     * @param disabledKinds - Optional [[GeometryKindSet]] used to filter objects that should not be
     *      created.
     */
    initDecodedTile(decodedTile: DecodedTile, enabledKinds?: GeometryKindSet | undefined, disabledKinds?: GeometryKindSet | undefined): void;
    /**
     * Called after the `Tile` has been decoded. It is required to call `initDecodedTile` before
     * calling this method.
     *
     * @see [[TileGeometryCreator#initDecodedTile]]
     *
     * @param tile - The {@link Tile} to process.
     * @param decodedTile - The decodedTile containing the actual tile map data.
     * @returns Promise resolved when all textures are ready to render.
     */
    createAllGeometries(tile: Tile, decodedTile: DecodedTile): Promise<void>;
    createLabelRejectionElements(tile: Tile, decodedTile: DecodedTile): void;
    /**
     * Processes the given tile and assign default values for geometry kinds,
     * render orders and label priorities.
     *
     * @param {Tile} tile
     * @param {(GeometryKindSet | undefined)} enabledKinds
     * @param {(GeometryKindSet | undefined)} disabledKinds
     */
    processTechniques(tile: Tile, enabledKinds: GeometryKindSet | undefined, disabledKinds: GeometryKindSet | undefined): void;
    /**
     * Splits the text paths that contain sharp corners.
     *
     * @param tile - The {@link Tile} to process paths on.
     * @param textPathGeometries - The original path geometries that may have defects.
     * @param textFilter -: Optional filter. Should return true for any text technique that is
     *      applicable.
     */
    prepareTextPaths(textPathGeometries: TextPathGeometry[], decodedTile: DecodedTile, textFilter?: (technique: IndexedTechnique) => boolean): TextPathGeometry[];
    /**
     * Creates {@link TextElement} objects from the decoded tile and list of materials specified. The
     * priorities of the {@link TextElement}s are updated to simplify label placement.
     *
     * @param tile - The {@link Tile} to create the testElements on.
     * @param decodedTile - The {@link @here/harp-datasource-protocol#DecodedTile}.
     * @param textFilter -: Optional filter. Should return true for any text technique that is
     *      applicable.
     */
    createTextElements(tile: Tile, decodedTile: DecodedTile, textFilter?: (technique: IndexedTechnique) => boolean): void;
    /**
     * Creates `Tile` objects from the decoded tile and list of materials specified.
     *
     * @param tile - The {@link Tile} to create the geometry on.
     * @param decodedTile - The {@link @here/harp-datasource-protocol#DecodedTile}.
     * @param onTextureCreated - Callback for each texture created, getting a promise that will be
     * resolved once the texture is loaded. Texture is not uploaded to GPU.
     * @param techniqueFilter -: Optional filter. Should return true for any technique that is
     *      applicable.
     */
    createObjects(tile: Tile, decodedTile: DecodedTile, onTextureCreated: (texture: Promise<THREE.Texture>) => void, techniqueFilter?: (technique: IndexedTechnique) => boolean): void;
    /**
     * Prepare the {@link Tile}s pois. Uses the {@link PoiManager} in {@link MapView}.
     */
    preparePois(tile: Tile, decodedTile: DecodedTile): void;
    /**
     * Gets the attachments of the given {@link @here/harp-datasource-protocol#DecodedTile}.
     *
     * @param decodedTile - The {@link @here/harp-datasource-protocol#DecodedTile}.
     */
    private getAttachments;
    private setupTerrainMaterial;
    private addUserData;
    /**
     * Gets the fading parameters for several kinds of objects.
     */
    private getFadingParams;
    /**
     * Gets the fading parameters for several kinds of objects.
     */
    private getPolygonFadingParams;
}
//# sourceMappingURL=TileGeometryCreator.d.ts.map