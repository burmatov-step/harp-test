import { FlatTheme, Theme } from "@here/harp-datasource-protocol";
import { UriResolver } from "@here/harp-utils";
import { MapViewImageCache } from "./image/MapViewImageCache";
import { MapView } from "./MapView";
/**
 * Class handling theme updates for MapView
 */
export declare class MapViewThemeManager {
    private readonly m_mapView;
    private readonly m_uriResolver?;
    private readonly m_imageCache;
    private m_updatePromise;
    private m_abortControllers;
    private m_theme;
    constructor(m_mapView: MapView, m_uriResolver?: UriResolver | undefined);
    setTheme(theme: Theme | FlatTheme | string): Promise<Theme>;
    getTheme(): Promise<Theme>;
    isUpdating(): boolean;
    /**
     * @deprecated
     * A helper for the deprecated MapView.theme getter, remove when
     * after deprecation
     */
    get theme(): Theme;
    private loadTheme;
    private updateTheme;
    updateCache(): void;
    get imageCache(): MapViewImageCache;
    dispose(): void;
    private loadPoiTables;
    private cancelThemeUpdate;
    private createAbortController;
    private updateImages;
}
//# sourceMappingURL=MapViewThemeManager.d.ts.map