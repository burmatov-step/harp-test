"use strict";
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.CameraMovementDetector = void 0;
import * as three_1 from "three";
import Utils_1 from "./Utils";
/**
 * The default value for camera movement throttling, in milliseconds.
 */
const DEFAULT_THROTTLING_TIMEOUT = 300;
/**
 * The `CameraMovementDetector` class checks for changes in camera position and orientation, to
 * detect continuous movements without the animation mode activated in {@link MapView}. If the
 * interaction is not continuous enough, you can use a throttling timer to reduce the number of
 * callbacks.
 */
class CameraMovementDetector {
    /**
     * Initializes the detector with timeout value and callbacks. {@link MapView} also provides
     * events for client code to be notified when these cues occur.
     *
     * @param m_throttlingTimeout - The delay, in milliseconds, between the last user interaction
     * detected and the call to `m_movementFinishedFunc`; the default is `300`.
     * @param m_movementStartedFunc - Callback function, called when the user starts interacting.
     * @param m_movementFinishedFunc - Callback function, called when the user stops interacting.
     */
    constructor(m_throttlingTimeout, m_movementStartedFunc, m_movementFinishedFunc) {
        this.m_throttlingTimeout = m_throttlingTimeout;
        this.m_movementStartedFunc = m_movementStartedFunc;
        this.m_movementFinishedFunc = m_movementFinishedFunc;
        this.m_lastCameraPos = new three_1.Vector3();
        this.m_newCameraPos = new three_1.Vector3();
        this.m_throttlingTimerId = undefined;
        this.m_movementDetectorDeadline = 0;
        this.onDeadlineTimer = () => {
            this.m_throttlingTimerId = undefined;
            const now = performance.now();
            if (now >= this.m_movementDetectorDeadline) {
                this.movementFinished();
            }
            else {
                this.startMovementFinishedTimer(now);
            }
        };
        if (this.m_throttlingTimeout === undefined) {
            this.m_throttlingTimeout = DEFAULT_THROTTLING_TIMEOUT;
        }
    }
    /**
     * Checks if the camera has moved since the last time it was checked. The
     * `m_movementStartedFunc` is called when a movement starts. If no movement
     * is detected, a timer for `m_movementFinishedFunc` starts.
     *
     * @param mapView - [[Mapview]]'s position and camera are checked for modifications.
     */
    checkCameraMoved(mapView, now) {
        const newAttitude = Utils_1.MapViewUtils.extractAttitude(mapView, mapView.camera);
        const newCameraPos = mapView.camera.getWorldPosition(this.m_newCameraPos);
        if (this.m_lastAttitude === undefined) {
            this.m_lastCameraPos.copy(newCameraPos);
            this.m_lastAttitude = newAttitude;
            return false;
        }
        const cameraMoved = !this.m_lastCameraPos.equals(newCameraPos) ||
            newAttitude.yaw !== this.m_lastAttitude.yaw ||
            newAttitude.pitch !== this.m_lastAttitude.pitch ||
            newAttitude.roll !== this.m_lastAttitude.roll;
        if (cameraMoved) {
            this.m_lastCameraPos.copy(newCameraPos);
            this.m_lastAttitude = newAttitude;
        }
        if (cameraMoved !== this.m_cameraMovedLastFrame) {
            if (cameraMoved) {
                this.movementStarted();
            }
            this.m_cameraMovedLastFrame = cameraMoved;
        }
        if (cameraMoved) {
            // Start timer
            this.m_movementDetectorDeadline = now + this.m_throttlingTimeout;
            this.startMovementFinishedTimer(now);
        }
        return this.m_cameraMovedLastFrame;
    }
    /**
     * Reset the saved camera position. Next time checkCameraMoved is called, it will return
     * `false`.
     */
    clear(mapView) {
        const newCameraPos = mapView.camera.getWorldPosition(this.m_newCameraPos);
        this.m_lastCameraPos.set(newCameraPos.x, newCameraPos.y, newCameraPos.z);
        const newAttitude = Utils_1.MapViewUtils.extractAttitude(mapView, mapView.camera);
        this.m_lastAttitude = newAttitude;
    }
    /**
     * Force change of camera position. Next time checkCameraMoved is called, it will return `true`.
     */
    forceMoved() {
        this.m_lastCameraPos.set(Number.NaN, Number.NaN, Number.NaN);
    }
    /**
     * Returns `true` if the camera of this {@link MapView} is currently moving. In this case the
     * `m_movementFinishedFunc` is waiting to be called after the throttling timer runs out.
     */
    get cameraIsMoving() {
        return this.m_throttlingTimerId !== undefined;
    }
    /**
     * Disposes resources and kills the throttling timer.
     */
    dispose() {
        this.removeMovementFinishedTimer();
        this.m_movementStartedFunc = undefined;
        this.m_movementFinishedFunc = undefined;
    }
    /**
     * Returns `true` if the camera has moved in the last frame.
     */
    get cameraMovedLastFrame() {
        return this.m_cameraMovedLastFrame === true;
    }
    movementStarted() {
        if (this.m_movementStartedFunc !== undefined) {
            this.m_movementStartedFunc();
        }
    }
    movementFinished() {
        this.removeMovementFinishedTimer();
        if (this.m_movementFinishedFunc !== undefined) {
            this.m_movementFinishedFunc();
        }
    }
    startMovementFinishedTimer(now) {
        if (this.m_throttlingTimerId === undefined) {
            const remainingTime = Math.max(0, this.m_movementDetectorDeadline - now);
            this.m_throttlingTimerId = setTimeout(this.onDeadlineTimer, remainingTime);
        }
    }
    removeMovementFinishedTimer() {
        if (this.m_throttlingTimerId !== undefined) {
            clearTimeout(this.m_throttlingTimerId);
            this.m_throttlingTimerId = undefined;
        }
    }
}
exports.CameraMovementDetector = CameraMovementDetector;
export default exports
//# sourceMappingURL=CameraMovementDetector.js.map