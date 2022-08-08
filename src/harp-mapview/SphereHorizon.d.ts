import * as THREE from "three";
export declare enum CanvasSide {
    Bottom = 0,
    Right = 1,
    Top = 2,
    Left = 3
}
export declare function nextCanvasSide(side: CanvasSide): CanvasSide;
export declare function previousCanvasSide(side: CanvasSide): CanvasSide;
/**
 * Class computing horizon tangent points and intersections with canvas for spherical projection.
 *
 * @remarks
 *
 * The horizon for a sphere is a circle formed by all intersections of tangent lines passing through
 * the camera with said sphere. It lies on a plane perpendicular to the sphere normal at the camera
 * and it's center is at the line segment joining the sphere center and the camera.
 *
 * The further the camera is, the nearer the horizon center gets to the sphere center, only reaching
 * the sphere center when the camera is at infinity. In other words, the horizon observed from a
 * finite distance is always smaller than a great circle (a circle with the sphere radius, dividing
 * the sphere in two hemispheres, and therefore it's radius is smaller than the sphere's.
 *
 * @internal
 */
export declare class SphereHorizon {
    private readonly m_camera;
    private readonly m_cornerIntersects;
    private readonly m_matrix;
    private readonly m_radius;
    private readonly m_normalToTangentAngle;
    private readonly m_distanceToHorizonCenter;
    private readonly m_intersections;
    private m_isFullyVisible;
    private readonly m_cameraPitch;
    /**
     * Constructs the SphereHorizon for the given camera.
     *
     * @param m_camera - The camera used as a reference to compute the horizon.
     * @param m_cornerIntersects - Array with a boolean for each canvas corner telling whether it
     * intersects with the world. Corners are in ccw-order starting with bottom left.
     */
    constructor(m_camera: THREE.PerspectiveCamera, m_cornerIntersects: boolean[]);
    /**
     * Gets the world coordinates of a point in the horizon corresponding to the given parameter.
     *
     * @param t - Parameter value in [0,1] corresponding to the point in the horizon circle at
     * angle t*(arcEnd - arcStart)*2*pi counter clockwise.
     * @param arcStart - Start of the arc covered by parameter t, corresponds to angle
     * arcStart*2*pi.
     * @param arcEnd - End of the arc covered by parameter t, corresponds to angle arcEnd*2*pi.
     * @param target - Optional target where resulting world coordinates will be set.
     * @returns the resulting point in world space.
     */
    getPoint(t: number, arcStart?: number, arcEnd?: number, target?: THREE.Vector3): THREE.Vector3;
    /**
     * Subdivides and arc of the horizon circle, providing the world coordinates of the divisions.
     *
     * @param callback - Function called for every division point, getting the point world
     * coordinates as parameter.
     * @param tStart - Angular parameter of the arc's start point [0,1].
     * @param tEnd - Angular parameter of the arc's end point [0,1].
     * @param maxNumPoints - Number of division points for the whole horizon. Smaller arcs will
     * be assigned a proportionally smaller number of points.
     */
    getDivisionPoints(callback: (point: THREE.Vector3) => void, tStart?: number, tEnd?: number, maxNumPoints?: number): void;
    /**
     * Indicates whether the horizon circle is fully visible.
     * @returns 'True' if horizon is fully visible, false otherwise.
     */
    get isFullyVisible(): boolean;
    /**
     * Gets the horizon intersections with the specified canvas side, specified in angular
     * parameters [0,1].
     * @returns the intersections with the canvas.
     */
    getSideIntersections(side: CanvasSide): number[];
    private isTangentVisible;
    private getTangentOnSide;
    private computeIntersections;
    /**
     * Computes horizon intersections with top or bottom canvas side.
     *
     * @returns positions of the intersections in the horizon circle, first left, then right
     * Values are in range [0,1].
     */
    private computeTBIntersections;
    /**
     * Computes horizon intersections with left or right canvas side.
     *
     * @returns positions of the intersections in the horizon circle, first top, then bottom
     * (or undefined if not visible). Values are in range [-0.5,0.5].
     */
    private computeLRIntersections;
}
//# sourceMappingURL=SphereHorizon.d.ts.map