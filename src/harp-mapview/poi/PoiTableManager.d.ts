import { PoiStackMode, PoiTableEntryDef, PoiTableRef } from "@here/harp-datasource-protocol";
import { MapView } from "../MapView";
/**
 * Class to store and maintain individual POI information for the {@link PoiTable}.
 */
declare class PoiTableEntry implements PoiTableEntryDef {
    /**
     * Verify that the JSON description of the POI table entry is valid.
     *
     * @param jsonEntry - JSON description of the POI table entry.
     *
     * @returns `true` if the `jsonEntry` is valid.
     */
    static verifyJSON(jsonEntry: PoiTableEntryDef): boolean;
    /** Default name of the POI as the key for looking it up. */
    name?: string;
    /** Alternative names of the POI. */
    altNames?: string[];
    /** Visibility of the POI. If `false`, the POI will not be rendered. */
    visible?: boolean;
    /** Name of the icon, defined in the the texture atlases. */
    iconName?: string;
    /** Stacking mode of the POI. For future use. */
    stackMode?: PoiStackMode;
    /**
     * Priority of the POI to select the visible set in case there are more POIs than can be
     * handled.
     */
    priority?: number;
    /** Minimum zoom level to render the icon on. */
    iconMinLevel?: number;
    /** Maximum zoom level to render the icon on. */
    iconMaxLevel?: number;
    /** Minimum zoom level to render the text label on. */
    textMinLevel?: number;
    /** Maximum zoom level to render the text label on. */
    textMaxLevel?: number;
    /**
     * Setup the [[PoiTableEntry]] from the JSON description. It is assumed that the jsonEntry has
     * been verified with [[PoiTableEntry#verifyJSON]].
     *
     * @param jsonEntry - JSON description of the POI table entry. Expected to have been verified
     *                    with [[PoiTableEntry#verifyJSON]].
     */
    setup(jsonEntry: PoiTableEntryDef): void;
}
/**
 * The `PoiTable` stores individual information for each POI type.
 *
 * @remarks
 * If a {@link TextElement} has a
 * reference to a PoiTable (if TextElement.poiInfo.poiTableName is set), information for the
 * TextElement and its icon are read from the PoiTable.
 *
 * The key to look up the POI is taken from the data, in case of OSM data with TileZen data, the
 * `poiNameField` is set to `kind`, which makes the content of the field `kind` in the data the key
 * to look up the POIs in the {@link PoiTable}.
 *
 * On the side of the {@link PoiTable}, the key to look up the PoiTableEntry is either the property
 * "name" of the [[PoiTableEntry]] (which should be unique), or the alternative list of names
 * `altNames`, where each value should also be unique. If the property `useAltNamesForKey` is set to
 * `true`, the `altNames` will be used.
 */
export declare class PoiTable {
    readonly name: string;
    readonly useAltNamesForKey: boolean;
    /**
     * Stores the list of [[PoiTableEntry]]s.
     */
    private readonly poiList;
    /**
     * Dictionary to look up for [[PoiTableEntry]] quickly. The dictionary is either created for
     * the `name` property of the [[PoiTableEntry]], which will identify POI, or for all of
     * alternative the names defined in `altNames` of [[PoiTableEntry]] JSON object.
     * Value assigned to key it is the index to [[poiList]] array which contain actual
     * [[PoiTabelEntry]] objects.
     */
    private readonly poiDict;
    private m_isLoading;
    private m_loadedOk;
    /**
     * Creates an instance of PoiTable.
     *
     * @param {string} name Name of the `PoiTable`. Must be unique.
     * @param {boolean} useAltNamesForKey Pass `true` to use the contents of the property `altNames`
     *          to find a [[PoiTableEntry]] in the table.
     */
    constructor(name: string, useAltNamesForKey: boolean);
    /**
     * Returns `true` if the table is currently being loaded, `false` otherwise.
     *
     * @readonly
     */
    get isLoading(): boolean;
    /**
     * Returns `true` if the table has been loaded correctly, `false` otherwise.
     *
     * @readonly
     */
    get loadedOk(): boolean;
    /**
     * Gets [[PoiTableEntry]] for poi name specified.
     *
     * @param poiName - poi name or one of its alternative names if [[useAltNamesForKey]] is
     * set to `true`.
     * @returns [[PoiTableEntry]] object or undefined if name was not found in dictionary.
     */
    getEntry(poiName: string): PoiTableEntry | undefined;
    /**
     * Start to load the PoiTable from the specified URL. Can only be called once per table.
     *
     * @param {string} poiTableUrl URL that points to the JSON file.
     * @param {AbortSignal} abortSignal Signal to abort the loading of the poi table file
     *
     * @returns {Promise<boolean>} Promise is being resolved once the JSON file has been fetched and
     *          the `PoiTable` has been set up.
     */
    load(poiTableUrl: string, abortSignal?: AbortSignal): Promise<boolean>;
    private startLoading;
    private finishedLoading;
}
/**
 * The `PoiTableManager` manages the list of [[PoiTables]] that
 * can be defined in the {@link @here/harp-datasource-protocol#Theme} sfile.
 */
export declare class PoiTableManager {
    readonly mapView: MapView;
    private m_isLoading;
    private m_poiTables;
    private readonly m_abortControllers;
    /**
     * Creates an instance of PoiTableManager.
     * @param {MapView} mapView Owning {@link MapView}.
     */
    constructor(mapView: MapView);
    /**
     * Load the {@link PoiTable}s that are stored in the {@link MapView}s
     * {@link @here/harp-datasource-protocol#Theme}.
     *
     * @remarks
     * Note that duplicate names of {@link PoiTable}s in the
     * {@link @here/harp-datasource-protocol#Theme} will lead to inaccessible {@link PoiTable}s.
     *
     * @param poiTables - {@link @here/harp-datasource-protocol#PoiTableRef[]}
     *                containing all {@link PoiTable}s to load.
     *
     * @returns Resolved once all the {@link PoiTable}s in
     *          the {@link @here/harp-datasource-protocol#Theme} have been loaded.
     */
    loadPoiTables(poiTables?: PoiTableRef[]): Promise<void>;
    /**
     * Clear the list of {@link PoiTable}s.
     */
    clear(): void;
    /**
     * Return the map of {@link PoiTable}s.
     */
    get poiTables(): Map<string, PoiTable>;
    /**
     * Manually add a {@link PoiTable}. Normally, the [[PoiTables]]s
     * are specified in the {@link @here/harp-datasource-protocol#Theme}.
     *
     * @remarks
     * Ensure that the name is unique.
     */
    addTable(poiTable: PoiTable): void;
    /**
     * Retrieve a {@link PoiTable} by name.
     *
     * @param {(string | undefined)} poiTableName Name of the {@link PoiTable}.
     *
     * @returns {(PoiTable | undefined)} The found [[poiTable]] if it could be found, `undefined`
     *          otherwise.
     */
    getPoiTable(poiTableName: string | undefined): PoiTable | undefined;
    /**
     * Return `true` if the {@link PoiTable}s have finished loading.
     *
     * @readonly
     */
    get finishedLoading(): boolean;
    private startLoading;
    private finishLoading;
}
export {};
//# sourceMappingURL=PoiTableManager.d.ts.map