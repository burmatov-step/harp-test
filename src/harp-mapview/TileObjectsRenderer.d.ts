import { MapEnv } from "@here/harp-datasource-protocol";
import { Tile } from "./Tile";
export declare class TileObjectRenderer {
    private readonly m_env;
    private readonly m_renderer;
    private readonly m_renderOrderStencilValues;
    private m_stencilValue;
    constructor(m_env: MapEnv, m_renderer: THREE.WebGLRenderer);
    render(tile: Tile, storageLevel: number, zoomLevel: number, cameraPosition: THREE.Vector3, rootNode: THREE.Object3D): void;
    prepareRender(): void;
    /**
     * Prepares the sorting of tile objects.
     */
    setupRenderer(): void;
    private updateStencilRef;
    private allocateStencilValue;
    private getStencilValue;
    /**
     * Process dynamic updates of [[TileObject]]'s style.
     *
     * @returns `true` if object shall be used in scene, `false` otherwise
     */
    private processTileObject;
    /**
     * Process the features owned by the given `TileObject`.
     *
     * @param tile - The {@link Tile} owning the `TileObject`'s features.
     * @param storageLevel - The storage level of the `Tile` containing the object,
     * @param zoomLevel - The current zoom level of `MapView`.
     * @param object - The `TileObject` to process.
     * @returns `false` if the given `TileObject` should not be added to the scene.
     */
    private processTileObjectFeatures;
}
//# sourceMappingURL=TileObjectsRenderer.d.ts.map