"use strict";
/*
 * Copyright (C) 2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.CameraUtils = void 0;
import * as harp_utils_1 from "@here/harp-utils";
import * as THREE from "three";
import FovCalculation_1 from "./FovCalculation";
// In centered projections the principal point is at NDC origin, splitting vertical and horizontal
// fovs in two equal halves.
function isCenteredProjection(principalPoint) {
    return principalPoint.x === 0 && principalPoint.y === 0;
}
/**
 * Computes the fov on the positive side of NDC x or y dimension (i.e. either right or top fov).
 * @param focalLength - Focal length in pixels. It must be larger than 0.
 * @param ppOffset - Principal point NDC offset either in y or x dimension.
 * @param viewportSide - Viewport height or width in pixels, must be same dimension as ppOffset.
 * @returns side fov in radians.
 */
function computePosSideFov(focalLength, ppOffset, viewportSide) {
    // see diagram in computeFocalLengthFromFov().
    harp_utils_1.assert(focalLength > 0, "Focal length must be larger than 0");
    return Math.atan(((1 - ppOffset) * viewportSide * 0.5) / focalLength);
}
/**
 * Computes the vertical or horizontal fov.
 * @param focalLength - Focal length in pixels. It must be larger than 0.
 * @param ppOffset - Principal point NDC offset in y (vertical fov) or x dimension (horizontal fov).
 * @param viewportSide - Viewport height or width in pixels, must be same dimension as ppOffset.
 * @returns vertical or horizontal fov in radians.
 */
function computeFov(focalLength, ppOffset, viewportSide) {
    harp_utils_1.assert(focalLength > 0, "Focal length must be larger than 0");
    // For uncentered fov, compute the two fov sides separately. The fov on the negative NDC
    // side is computed in the same way as that for the positive side but flipping the offset sign.
    return ppOffset === 0
        ? 2 * Math.atan((0.5 * viewportSide) / focalLength)
        : computePosSideFov(focalLength, ppOffset, viewportSide) +
            computePosSideFov(focalLength, -ppOffset, viewportSide);
}
function getFovs(camera) {
    return camera.userData.fovs;
}
/**
 * Saves camera vertical fov and focal length. For off-center projections, saves side fovs as well.
 */
function setCameraParams(camera, ppalPoint, focalLength, viewportHeight, verticalFov) {
    const viewportWidth = viewportHeight * camera.aspect;
    let hFov = computeFov(focalLength, ppalPoint.x, viewportWidth);
    if (hFov < FovCalculation_1.MIN_FOV_RAD || hFov > FovCalculation_1.MAX_FOV_RAD) {
        // Invalid horizontal fov, clamp and compute again focal length and vertical fov.
        hFov = THREE.MathUtils.clamp(hFov, FovCalculation_1.MIN_FOV_RAD, FovCalculation_1.MAX_FOV_RAD);
        const focalLength = computeFocalLengthFromFov(hFov, viewportWidth, ppalPoint.x);
        verticalFov = computeFov(focalLength, ppalPoint.y, viewportHeight);
    }
    camera.fov = THREE.MathUtils.radToDeg(verticalFov);
    if (isCenteredProjection(ppalPoint)) {
        delete camera.userData.fovs;
    }
    else {
        const width = viewportHeight * camera.aspect;
        camera.userData.fovs = {
            top: computePosSideFov(focalLength, ppalPoint.y, viewportHeight),
            right: computePosSideFov(focalLength, ppalPoint.x, width),
            horizontal: hFov
        };
    }
    camera.userData.focalLength = focalLength;
}
/**
 * Computes a camera's focal length from vertical fov and viewport height or horizontal fov and
 * viewport width.
 * @beta
 *
 * @param fov - Vertical or horizontal field of view in radians.
 * @param viewportSide - Viewport height if fov is vertical, otherwise viewport width.
 * @param ppOffset - Principal point offset in y direction if fov is vertical,
 * otherwise in x direction.
 * @returns focal length in pixels.
 */
function computeFocalLengthFromFov(fov, viewportSide, ppOffset) {
    //               C <- Projection center
    //              /|-_
    //             / |  -_                      pfov = fov along positive NDC side (tfov or rfov)
    //            /  |    -_                    nfov = fov along negative NDC side (bfov or lfov)
    //           /   |      -_
    //          /    |        -_
    //         /pfov |  nfov    -_
    //        /      |            -_
    //       /       |              -_
    //    a /        |focal length(f) -_ b
    //     /         |                  -_
    //    /          |  Principal point   -_
    //   /           | /      (pp)          -_
    // A/____________P________________________-_B  Viewport
    //  <------------><------------------------>
    //  (1-ppOff)*s/2      (1+ppOff)*s/2
    //  <-------------------------------------->
    //     s = viewportSide (height or width)
    //
    // Diagram of fov splitting (potentially asymmetric) along a viewport side (height or width).
    // For viewport height, fov is split into top (tfov) and bottom (bfov) fovs. For width, it's
    // split into right fov (rfov) and left fov (lfov).
    // Case 1. Symmetric fov split. Principal point is centered (centered projection):
    const halfSide = viewportSide / 2;
    const ppCentered = ppOffset === 0;
    if (ppCentered) {
        return halfSide / Math.tan(fov / 2);
    }
    // Case 2. Asymmetric fov split. Off-center perspective projection:
    const eps = 1e-6;
    const ppOffsetSq = ppOffset ** 2;
    if (Math.abs(fov - Math.PI / 2) < eps) {
        // Case 2a. Special case for (close to) right angle fov, tangent approaches infinity:
        // 3 right triangles: ACB, APC, BPC. Use pythagorean theorem on each to get 3 equations:
        // a^2 = f^2 + (1-ppOff)*s/2
        // b^2 = f^2 + (1+ppOff)*s/2
        // h^2 = a^2 + b^2
        // Substitute a^2 and b^2 in third equation and solve for f to get:
        // f = (s/2) * sqrt(1-ppOff^2)
        return halfSide * Math.sqrt(1 - ppOffsetSq);
    }
    // Case 2b. General asymmetric fov case:
    // (1)   tan(pfov) = (1-ppOff)*s / (2*f)
    // (2)   tan(nfov) = (1+ppOff)*s / (2*f)
    // Use formula for the tan of the sum of two angles:
    // (3)   tan(fov) = tan(pfov+nfov) = (tan(pfov) + tan(nfov)) / (1 - (tan(pfov) * tan(nfov)))
    // Substitute (1) and (2) in (3) and solve for f to get a quadratic equation:
    // 4*(tan(fov))^2 - 4*s*f - tan(fov)(1-ppOff^2)*s^2 = 0 , solving for f:
    // f = (s/2) * (1 +/- sqrt(1 + tan(fov)(1-ppOff^2)^2)) / tan(fov)
    // ppOff (principal point offset) is in [-1,1], so there's two real solutions (radicant is >=1)
    // and we choose the positive solution on each case:
    // a) tan(fov) > 0, fov in (0,pi/2) -> f = (s/2) * (1 + sqrt(1 + tan(fov)^2(1-ppOff^2))) / tan(fov)
    // b) tan(fov) < 0, fov in (pi/2,pi) -> f = (s/2) * (1 - sqrt(1 + tan(fov)^2(1-ppOff^2))) / tan(fov)
    const tanFov = Math.tan(fov);
    const sign = Math.sign(tanFov);
    const sqrt = Math.sqrt(1 + tanFov ** 2 * (1 - ppOffsetSq));
    const f = (halfSide * (1 + sign * sqrt)) / tanFov;
    harp_utils_1.assert(f >= 0, "Focal length must be larger than 0");
    return f;
}
var CameraUtils;
(function (CameraUtils) {
    /**
     * Returns the camera's focal length.
     * @beta
     *
     * @param camera - The camera.
     * @returns The focal length in pixels or `undefined` if not set.
     */
    function getFocalLength(camera) {
        var _a;
        return (_a = camera.userData) === null || _a === void 0 ? void 0 : _a.focalLength;
    }
    CameraUtils.getFocalLength = getFocalLength;
    /**
     * Sets a camera's focal length.
     * @remarks The camera's vertical fov will be updated to achieve the given viewport height.
     * @beta
     *
     * @param camera
     * @param focalLength - Focal length in pixels. It must be larger than 0.
     * @param viewportHeight - Viewport height in pixels, used to compute vertical fov.
     * @returns The new camera's focal length in pixels.
     */
    function setFocalLength(camera, focalLength, viewportHeight) {
        const ppalPoint = getPrincipalPoint(camera);
        const vFov = computeFov(focalLength, ppalPoint.y, viewportHeight);
        if (vFov < FovCalculation_1.MIN_FOV_RAD || vFov > FovCalculation_1.MAX_FOV_RAD) {
            // Invalid vertical fov, clamp and compute again focal length.
            setVerticalFov(camera, vFov, viewportHeight);
        }
        else {
            setCameraParams(camera, ppalPoint, focalLength, viewportHeight, vFov);
        }
        // focal length might change in setCameraParams due to horizontal fov restrictions.
        return getFocalLength(camera);
    }
    CameraUtils.setFocalLength = setFocalLength;
    /**
     * Returns the camera's vertical field of view.
     * @param camera - The camera.
     * @returns The vertical fov in radians.
     */
    function getVerticalFov(camera) {
        return THREE.MathUtils.degToRad(camera.fov);
    }
    CameraUtils.getVerticalFov = getVerticalFov;
    /**
     * Sets a camera's vertical fov.
     * @remarks The camera's focal length will be updated to achieve the given viewport height.
     * @beta
     *
     * @param camera
     * @param verticalFov - Vertical field of view in radians. It'll be clamped to
     *                      [{@link MIN_FOV_RAD}, {@link MAX_FOV_RAD}].
     * @param viewportHeight - Viewport height in pixels, used to compute focal length.
     * @returns The new camera's vertical fov in radians.
     */
    function setVerticalFov(camera, verticalFov, viewportHeight) {
        verticalFov = THREE.MathUtils.clamp(verticalFov, FovCalculation_1.MIN_FOV_RAD, FovCalculation_1.MAX_FOV_RAD);
        const ppalPoint = getPrincipalPoint(camera);
        const focalLength = computeFocalLengthFromFov(verticalFov, viewportHeight, ppalPoint.y);
        setCameraParams(camera, ppalPoint, focalLength, viewportHeight, verticalFov);
        // vertical fov might change in setCameraParams due to horizontal fov restrictions.
        return getVerticalFov(camera);
    }
    CameraUtils.setVerticalFov = setVerticalFov;
    /**
     * Calculates object's screen size based on the focal length and it's camera distance.
     * @beta
     *
     * @param focalLength - Focal length in pixels (see {@link setVerticalFov})
     * @param distance - Object distance in world space.
     * @param worldSize - Object size in world space.
     * @return object size in screen space.
     */
    function convertWorldToScreenSize(focalLength, distance, worldSize) {
        return (focalLength * worldSize) / distance;
    }
    CameraUtils.convertWorldToScreenSize = convertWorldToScreenSize;
    /**
     * Calculates object's world size based on the focal length and it's camera distance.
     * @beta
     *
     * @param focalLength - Focal length in pixels (see {@link setVerticalFov})
     * @param distance - Object distance in world space.
     * @param screenSize - Object size in screen space.
     * @return object size in world space.
     */
    function convertScreenToWorldSize(focalLength, distance, screenSize) {
        return (distance * screenSize) / focalLength;
    }
    CameraUtils.convertScreenToWorldSize = convertScreenToWorldSize;
    /**
     * Returns the camera's principal point (intersection of principal ray and image plane)
     * in NDC coordinates.
     * @beta
     * @see https://en.wikipedia.org/wiki/Pinhole_camera_model
     * @remarks This point coincides with the principal vanishing point. By default it's located at
     * the image center (NDC coords [0,0]), and the resulting projection is centered or symmetric.
     * But it may be offset (@see THREE.PerspectiveCamera.setViewOffset) for some use cases such as
     * multiview setups (e.g. stereoscopic rendering), resulting in an asymmetric perspective
     * projection.
     * @param camera - The camera.
     * @param result - Optional vector where the principal point coordinates will be copied.
     * @returns A vector containing the principal point NDC coordinates.
     */
    function getPrincipalPoint(camera, result = new THREE.Vector2()) {
        result.x = -camera.projectionMatrix.elements[8];
        result.y = -camera.projectionMatrix.elements[9];
        return result;
    }
    CameraUtils.getPrincipalPoint = getPrincipalPoint;
    /**
     * Sets the camera's principal point (intersection of principal ray and image plane)
     * in NDC coordinates.
     * @beta
     * @see {@link getPrincipalPoint}
     * @param camera - The camera.
     * @param ndcCoords - The principal point's NDC coordinates, each coordinate can have values in
     * the open interval (-1,1).
     */
    function setPrincipalPoint(camera, ndcCoords) {
        // We only need to set to proper elements in the projection matrix:
        // camera.projectionMatrix.elements[8] = -ndcCoords.x
        // camera.projectionMatrix.elements[9] = -ndcCoords.y
        // However, this can't be done directly, otherwise it'd be overwritten on the next call to
        // camera.updateProjectionMatrix(). The only way to set the principal point is through a
        // THREE.js camera method for multi-view setup, see:
        // https://threejs.org/docs/#api/en/cameras/PerspectiveCamera.setViewOffset
        const height = 1;
        const width = camera.aspect;
        // Principal point splits fov in two angles that must be strictly less than 90 degrees
        // (each one belongs to a right triangle). Setting the principal point at the edges (-1 or
        // 1) would make it impossible to achieve an fov >= 90. Thus, clamp the principal point
        // coordinates to values slightly smaller than 1.
        const maxNdcCoord = 1 - 1e-6;
        camera.setViewOffset(width, height, (-THREE.MathUtils.clamp(ndcCoords.x, -maxNdcCoord, maxNdcCoord) * width) / 2, (THREE.MathUtils.clamp(ndcCoords.y, -maxNdcCoord, maxNdcCoord) * height) / 2, width, height);
    }
    CameraUtils.setPrincipalPoint = setPrincipalPoint;
    /**
     * Returns the camera's horizontal field of view.
     * @param camera - The camera.
     * @returns The horizontal fov in radians.
     */
    function getHorizontalFov(camera) {
        var _a, _b;
        // If horizontal fov is not stored in camera, assume centered projection and compute
        // it from the vertical fov.
        return ((_b = (_a = getFovs(camera)) === null || _a === void 0 ? void 0 : _a.horizontal) !== null && _b !== void 0 ? _b : 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * camera.aspect));
    }
    CameraUtils.getHorizontalFov = getHorizontalFov;
    /**
     * Returns top fov angle for a given perspective camera.
     * @beta
     * @remarks In symmetric projections, the principal point coincides with the image center, and
     * the vertical and horizontal FOVs are each split at that point in two equal halves.
     * However, in asymmetric projections the principal point is not at the image center, and thus
     * each fov is split unevenly in two parts:
     *
     *    Symmetric projection        Asymmetric projection
     * -------------------------   --------------------------
     * |           ^           |   |       ^                |
     * |           |           |   |       |tFov            |
     * |           |tFov       |   | lFov  v      rFov      |
     * |           |           |   |<----->x<-------------->|
     * |    lFov   v   rFov    |   |  ppal ^ point          |
     * |<--------->x<--------->|   |       |    o           |
     * | ppal point=img center |   |       | img center     |
     * |           ^           |   |       |                |
     * |           |bFov       |   |       |bFov            |
     * |           |           |   |       |                |
     * |           v           |   |       v                |
     * -------------------------   --------------------------
     *
     * @param camera - The camera.
     * @returns The top fov angle in radians.
     */
    function getTopFov(camera) {
        var _a, _b;
        return (_b = (_a = getFovs(camera)) === null || _a === void 0 ? void 0 : _a.top) !== null && _b !== void 0 ? _b : THREE.MathUtils.degToRad(camera.fov / 2);
    }
    CameraUtils.getTopFov = getTopFov;
    /**
     * Returns bottom fov angle for a given perspective camera.
     * @see {@link CameraUtils.getTopFov}
     * @beta
     * @param camera - The camera.
     * @returns The bottom fov angle in radians.
     */
    function getBottomFov(camera) {
        return THREE.MathUtils.degToRad(camera.fov) - getTopFov(camera);
    }
    CameraUtils.getBottomFov = getBottomFov;
    /**
     * Returns right fov angle for a given perspective camera.
     * @see {@link CameraUtils.getTopFov}
     * @beta
     * @param camera - The camera.
     * @returns The right fov angle in radians.
     */
    function getRightFov(camera) {
        var _a, _b;
        return (_b = (_a = getFovs(camera)) === null || _a === void 0 ? void 0 : _a.right) !== null && _b !== void 0 ? _b : getHorizontalFov(camera) / 2;
    }
    CameraUtils.getRightFov = getRightFov;
    /**
     * Returns left fov angle for a given perspective camera.
     * @see {@link CameraUtils.getTopFov}
     * @beta
     * @param camera - The camera.
     * @returns The left fov angle in radians.
     */
    function getLeftFov(camera) {
        var _a;
        return ((_a = getFovs(camera)) === null || _a === void 0 ? void 0 : _a.right) !== undefined
            ? getHorizontalFov(camera) - getRightFov(camera)
            : getHorizontalFov(camera) / 2;
    }
    CameraUtils.getLeftFov = getLeftFov;
})(CameraUtils = exports.CameraUtils || (exports.CameraUtils = {}));
//# sourceMappingURL=CameraUtils.js.map

export default exports