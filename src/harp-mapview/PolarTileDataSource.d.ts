import { FlatTheme, Technique, Theme } from "@here/harp-datasource-protocol";
import { TileKey, TilingScheme } from "@here/harp-geoutils";
import * as THREE from "three";
import { DataSource, DataSourceOptions } from "./DataSource";
import { Tile } from "./Tile";
export interface PolarTileDataSourceOptions extends DataSourceOptions {
    /**
     * Optional level offset of regular tiles from reference datasource to align tiles to.
     * Default is -1.
     */
    geometryLevelOffset?: number;
    /**
     * Enable debug display for generated tiles.
     * Default is false.
     */
    debugTiles?: boolean;
}
interface TechniqueEntry {
    technique: Technique;
    material: THREE.Material;
}
/**
 * {@link DataSource} providing geometry for poles
 */
export declare class PolarTileDataSource extends DataSource {
    private readonly m_tilingScheme;
    private readonly m_maxLatitude;
    private m_geometryLevelOffset;
    private readonly m_debugTiles;
    private m_styleSetEvaluator?;
    private m_northPoleEntry?;
    private m_southPoleEntry?;
    constructor({ name, styleSetName, minDataLevel, maxDataLevel, minDisplayLevel, maxDisplayLevel, storageLevelOffset, geometryLevelOffset, debugTiles }: PolarTileDataSourceOptions);
    /** @override */
    dispose(): void;
    createTechiqueEntry(kind: string): TechniqueEntry | undefined;
    /** @override */
    setTheme(theme: Theme | FlatTheme): Promise<void>;
    /** @override */
    canGetTile(zoomLevel: number, tileKey: TileKey): boolean;
    /** @override */
    shouldSubdivide(zoomLevel: number, tileKey: TileKey): boolean;
    /** @override */
    getTilingScheme(): TilingScheme;
    /** @override */
    getTile(tileKey: TileKey): Tile;
    get geometryLevelOffset(): number;
    set geometryLevelOffset(geometryLevelOffset: number);
    private intersectEdge;
    private createTileGeometry;
}
export {};
//# sourceMappingURL=PolarTileDataSource.d.ts.map