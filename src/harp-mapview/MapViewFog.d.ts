import { Fog } from "@here/harp-datasource-protocol";
import * as THREE from "three";
import { MapView } from "./MapView";
/**
 * Manages the fog display in {@link MapView}.
 */
export declare class MapViewFog {
    private m_scene;
    private m_enabled;
    private m_fog;
    private m_fogIsDefined;
    private m_cachedFog;
    /**
     * Constructs a `MapViewFog` instance.
     *
     * @param m_scene - The scene used in {@link MapView} that contains the map objects.
     */
    constructor(m_scene: THREE.Scene);
    /**
     * Allows for disabling the fog, even if it is defined in the theme. Use this property for
     * custom views like the demo app's debug camera. However, if the theme does not define a
     * fog, enabling this property here has no effect.
     *
     * @param value - A boolean that specifies whether the fog should be enabled or disabled.
     */
    set enabled(enableFog: boolean);
    /**
     * Returns the current fog status, enabled or disabled.
     */
    get enabled(): boolean;
    /**
     * Sets the fog depending on the {@link @here/harp-datasource-protocol#Theme}
     * instance provided. This function is called when a
     * theme is loaded. Fog is added only if the theme contains a fog definition with a:
     * - `color` property, used to set the fog color.
     * - `startRatio` property, used to set the start distance of the fog as a ratio of the far
     * clipping plane distance.
     *
     * @param theme - A {@link @here/harp-datasource-protocol#Theme} instance.
     */
    reset(fog?: Fog): void;
    /**
     * Updates the fog at runtime, depending on the camera.
     *
     * @param camera - An instance of a `THREE.Camera` with a `far` property.
     */
    update(mapView: MapView, viewDistance?: number): void;
    /**
     * Handles fog addition.
     */
    private add;
    /**
     * Handles fog removal.
     */
    private remove;
    /**
     * ThreeJS lets users manage the `RawShaderMaterial` themselves, so they need to be modified
     * explicitly.
     *
     * @see https://github.com/mrdoob/three.js/blob/dev/src/renderers/webgl/WebGLProgram.js#L298
     */
    private setFogInRawShaderMaterials;
}
//# sourceMappingURL=MapViewFog.d.ts.map