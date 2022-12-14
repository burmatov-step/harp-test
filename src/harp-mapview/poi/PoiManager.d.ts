import { DecodedTile, ImageTexture } from "@here/harp-datasource-protocol";
import { MapView } from "../MapView";
import { TextElement } from "../text/TextElement";
import { Tile } from "../Tile";
/**
 * POI manager class, responsible for loading the
 * {@link @here/harp-datasource-protocol#PoiGeometry} objects
 * from the {@link @here/harp-datasource-protocol#DecodedTile},
 * and preparing them for rendering.
 *
 * @remarks
 * Also loads and manages the texture atlases for the icons.
 */
export declare class PoiManager {
    readonly mapView: MapView;
    private static readonly m_missingPoiTableName;
    private static readonly m_missingPoiName;
    /**
     * Warn about a missing POI table name, but only once.
     * @param poiTableName - POI mapping table name.
     * @param poiTable - POI table instance.
     */
    private static notifyMissingPoiTable;
    /**
     * Warn about a missing POI name, but only once.
     * @param poiName - name of POI.
     * @param poiTableName - POI mapping table name.
     */
    private static notifyMissingPoi;
    private readonly m_imageTextures;
    private readonly m_poiShieldGroups;
    /**
     * The constructor of the `PoiManager`.
     *
     * @param mapView - The {@link MapView} instance that should display the POIs.
     */
    constructor(mapView: MapView);
    /**
     * Add all POIs from a decoded tile and store them as {@link TextElement}s in the {@link Tile}.
     *
     * Also handles LineMarkers, which is a recurring marker along a line (road).
     *
     * @param tile - Tile to add POIs to.
     * @param decodedTile - DecodedTile containing the raw
     *                      {@link @here/harp-datasource-protocol#PoiGeometry}
     *                      objects describing the POIs.
     */
    addPois(tile: Tile, decodedTile: DecodedTile): void;
    /**
     * Load the texture atlas that defines the segments of the texture that should be used for
     * specific icons.
     *
     * @remarks
     * Creates an {@link @here/harp-datasource-protocol#ImageTexture}
     * for every element in the atlas, such that it can
     * be addressed in the theme file.
     *
     * @param imageName - Name of the image from the theme (NOT the url!).
     * @param atlas - URL of the JSON file defining the texture atlas.
     * @param abortSignal - Signal to Abort the loading of the Atlas Image
     */
    addTextureAtlas(imageName: string, atlas: string, abortSignal?: AbortSignal): Promise<void>;
    /**
     * Add an {@link @here/harp-datasource-protocol#ImageTexture} such that it
     * is available as a named entity for techniques in theme files.
     *
     * @param imageTexture - {@link @here/harp-datasource-protocol#ImageTexture}
     *                       that should be available for POIs.
     */
    addImageTexture(imageTexture: ImageTexture): void;
    /**
     * Return the {@link @here/harp-datasource-protocol#ImageTexture}
     * registered under the specified name.
     *
     * @param name - Name of the {@link @here/harp-datasource-protocol#ImageTexture}.
     */
    getImageTexture(name: string): ImageTexture | undefined;
    /**
     * Update the {@link TextElement} with the information taken from the {@link PoiTable} which is
     * referenced in the {@link PoiInfo} of the pointLabel.
     *
     * If the requested {@link PoiTable} is not available yet, the function returns `false`.
     * If the {@link PoiTable} is not defined, or if the references POI has no entry in
     * the {@link PoiTable}, no action is taken, and the function returns `false`.
     *
     * If the {@link PoiTable} has been processed, it returns `true`, indicating that this function
     * doesn't have to be called again.
     *
     * @param pointLabel - The {@link TextElement} to update.
     *
     * @returns `true` if the {@link PoiTable} has been processed, and the
     *          function does not have to be called again.
     */
    updatePoiFromPoiTable(pointLabel: TextElement): boolean;
    /**
     * Clear internal state. Applicable when switching themes.
     */
    clear(): void;
    /**
     * Add the LineMarker as a POI with multiple positions sharing the same `shieldGroupIndex`.
     */
    private addLineMarker;
    /**
     * Create and add POI {@link TextElement}s to tile with a series of positions.
     */
    private addPoi;
}
//# sourceMappingURL=PoiManager.d.ts.map