import * as THREE from "three";
import { Pass } from "./Pass";
/**
 * This enum represents the sampling level to apply to
 * a {@link MSAARenderPass} instance. At level 0,
 * only one sample is performed, which is like
 * disabling the MSAA pass.
 */
export declare enum MSAASampling {
    "Level_0" = 0,
    "Level_1" = 1,
    "Level_2" = 2,
    "Level_3" = 3,
    "Level_4" = 4,
    "Level_5" = 5
}
/**
 * {@link MapView}'s MSAA implementation.
 *
 * @remarks
 * MSAA stands for Multi Sampling Anti-Aliasing, and its concept
 * is to provide a rendering engine with additional color values for each pixel, so they can include
 * the missing bits between them on a screen. WebGL already comes with a native MSAA implementation
 * with four samples. Because of its native nature, it is more efficient and one may not want to use
 * MapView's MSAA implementation when these four samples are satisfying. However in some situations
 * they are not: on low devices, MSAA can impact the framerate and we may desire to reduce the
 * number of samples at runtime. On the other hand, when the interaction stops, the engine also
 * stops rendering the map, and because a map relies on many line-like patterns, aliasing can then
 * turn very noticeable. In such static renders, the number of samples could be dramatically
 * increased on a last frame to render.
 */
export declare class MSAARenderPass extends Pass {
    /**
     * The sampling level determines the number of samples that will be performed per frame.
     * Renders will happen `2 ^ samplingLevel` time(s). `samplingLevel` stands between `0` and `5`.
     * Therefore there can be between 1 and 32 samples.
     *
     * @default `SamplingLevel.Level_1`
     */
    samplingLevel: MSAASampling;
    private m_renderTarget;
    private readonly m_localCamera;
    private readonly m_quadScene;
    private readonly m_quadUniforms;
    private readonly m_quadMaterial;
    private readonly m_quad;
    private readonly m_tmpColor;
    /**
     * The constructor for `MSAARenderPass`. It builds an internal scene with a camera looking at a
     * quad.
     *
     * @param m_scene - The scene to render.
     * @param m_camera - The camera to render the scene through.
     */
    constructor();
    /**
     * Releases all used resources.
     */
    dispose(): void;
    /**
     * The render function of `MSAARenderPass`.
     *
     * @remarks
     * At each call of this method, and for each sample the {@link MapView}
     * camera provided in the `render method is offset within the dimension of a
     * pixel on screen. It then renders the whole scene with this offset to a local
     * `WebGLRenderTarget` instance, via a `WebGLRenderer` instance. Finally the local camera
     * created in the constructor shoots the quad and renders to the write buffer or to the frame
     * buffer. The quad material's opacity is modified so the renders can accumulate in the
     * targetted buffer.
     *
     * The number of samples can be modified at runtime through the enum [[SamplingLevel]].
     *
     * If there is no further pass, the {@link Pass.renderToScreen} flag can be set to `true` to
     * output directly to the framebuffer.
     *
     * @param renderer - The ThreeJS WebGLRenderer instance to render the scene with.
     * @param scene - The ThreeJS Scene instance to render the scene with.
     * @param camera - The ThreeJS Camera instance to render the scene with.
     * @param writeBuffer - A ThreeJS WebGLRenderTarget instance to render the scene to.
     * @param readBuffer - A ThreeJS WebGLRenderTarget instance to render the scene.
     * @override
     */
    render(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera | THREE.OrthographicCamera, writeBuffer: THREE.WebGLRenderTarget | null, readBuffer: THREE.WebGLRenderTarget): void;
    /**
     * Resize the internal render target to match the new size specified.
     *
     * @param width - New width to apply to the render target.
     * @param height - New height to apply to the render target.
     * @override
     */
    setSize(width: number, height: number): void;
    /**
     * The list of offsets to apply to the camera, per sampling level, adapted from :
     *
     * @see https://msdn.microsoft.com/en-us/library/windows/desktop/ff476218%28v=vs.85%29.aspx?f=255&MSPPError=-2147217396
     */
    static readonly OffsetVectors: number[][][];
}
//# sourceMappingURL=MSAARenderPass.d.ts.map