import { FlatTheme, Theme } from "@here/harp-datasource-protocol";
import { TileKey, TilingScheme } from "@here/harp-geoutils";
import { DataSource } from "./DataSource";
import { Tile } from "./Tile";
/**
 * Provides background geometry for all tiles.
 */
export declare class BackgroundDataSource extends DataSource {
    static readonly GROUND_RENDER_ORDER: number;
    private static readonly DEFAULT_TILING_SCHEME;
    private m_tilingScheme;
    constructor();
    updateStorageLevelOffset(): void;
    /** @override */
    setTheme(theme: Theme | FlatTheme, languages?: string[]): Promise<void>;
    setTilingScheme(tilingScheme?: TilingScheme): void;
    /** @override */
    getTilingScheme(): TilingScheme;
    /** @override */
    getTile(tileKey: TileKey): Tile | undefined;
}
//# sourceMappingURL=BackgroundDataSource.d.ts.map