import { Light, Sky } from "@here/harp-datasource-protocol";
import THREE = require("three");
import { MapView, MapViewOptions } from "./MapView";
import { MapViewFog } from "./MapViewFog";
export declare const DEFAULT_CLEAR_COLOR = 16777215;
export declare type MapViewEnvironmentOptions = Pick<MapViewOptions, "addBackgroundDatasource" | "backgroundTilingScheme">;
/**
 * Class handling the Scene Environment, like fog, sky, background datasource, clearColor etc
 *  for MapView
 */
export declare class MapViewEnvironment {
    private readonly m_mapView;
    private readonly m_fog;
    private m_skyBackground?;
    private m_createdLights?;
    private m_overlayCreatedLights?;
    private readonly m_backgroundDataSource?;
    constructor(m_mapView: MapView, options: MapViewEnvironmentOptions);
    get lights(): THREE.Light[];
    get fog(): MapViewFog;
    updateBackgroundDataSource(): void;
    clearBackgroundDataSource(): void;
    update(): void;
    updateClearColor(clearColor?: string, clearAlpha?: number): void;
    updateSkyBackground(sky?: Sky, clearColor?: string): void;
    updateLighting(lights?: Light[]): void;
    /**
     * Update the directional light camera. Note, this requires the cameras to first be updated.
     */
    updateLights(): void;
    private addNewSkyBackground;
    private removeSkyBackGround;
    private updateSkyBackgroundColors;
    /**
     * Transfer from view space to camera space.
     * @param viewPos - position in view space, result is stored here.
     */
    private viewToLightSpace;
}
//# sourceMappingURL=MapViewEnvironment.d.ts.map