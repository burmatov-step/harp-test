"use strict";
let exports = {}
exports.MapViewTaskScheduler = void 0;
/*
 * Copyright (C) 2020-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
import * as harp_utils_1 from "@here/harp-utils"
import * as THREE from "three"
import MapView_1 from "./MapView"
import Statistics_1 from "./Statistics"
const DEFAULT_MAX_FPS = 60;
const DEFAULT_PROCESSING_ESTIMATE_TIME = 2;
const UPDATE_EVENT = { type: "update" };
class MapViewTaskScheduler extends THREE.EventDispatcher {
    constructor(m_maxFps = DEFAULT_MAX_FPS) {
        super();
        this.m_maxFps = m_maxFps;
        this.m_throttlingEnabled = false;
        this.m_taskQueue = new harp_utils_1.TaskQueue({
            groups: [MapView_1.TileTaskGroups.FETCH_AND_DECODE, MapView_1.TileTaskGroups.CREATE],
            prioSortFn: (a, b) => {
                return a.getPriority() - b.getPriority();
            }
        });
        this.maxFps = m_maxFps;
    }
    set maxFps(fps) {
        this.m_maxFps = fps <= 0 ? DEFAULT_MAX_FPS : fps;
    }
    get maxFps() {
        return this.m_maxFps;
    }
    get taskQueue() {
        return this.m_taskQueue;
    }
    get throttlingEnabled() {
        return this.m_throttlingEnabled === true;
    }
    set throttlingEnabled(enabled) {
        this.m_throttlingEnabled = enabled;
    }
    /**
     * Sends a request to the [[MapView]] to redraw the scene.
     */
    requestUpdate() {
        this.dispatchEvent(UPDATE_EVENT);
    }
    /**
     * Processes the pending Tasks of the underlying [[TaskQueue]]
     * !! This should run at the end of the renderLoop, so the calculations of the available
     * frame time are better estimated
     *
     * @param frameStartTime the start time of the current frame, is used to calculate the
     * still available time in the frame to process Tasks
     *
     */
    processPending(frameStartTime) {
        const stats = Statistics_1.PerformanceStatistics.instance;
        const currentFrameEvent = stats.enabled ? stats.currentFrame : undefined;
        let startTime;
        if (stats.enabled) {
            startTime = harp_utils_1.PerformanceTimer.now();
        }
        //update the task queue, to remove expired and sort with priority
        this.m_taskQueue.update();
        let numItemsLeft = this.taskQueue.numItemsLeft();
        currentFrameEvent === null || currentFrameEvent === void 0 ? void 0 : currentFrameEvent.setValue("TaskScheduler.numPendingTasks", numItemsLeft);
        if (this.throttlingEnabled) {
            // get the available time in this frame to achieve a max fps rate
            let availableTime = this.spaceInFrame(frameStartTime);
            // get some buffer to balance the inaccurate estimates
            availableTime = availableTime > 2 ? availableTime - 2 : availableTime;
            currentFrameEvent === null || currentFrameEvent === void 0 ? void 0 : currentFrameEvent.setValue("TaskScheduler.estimatedAvailableTime", availableTime);
            let counter = 0;
            // check if ther is still time available and tasks left
            while (availableTime > 0 && numItemsLeft > 0) {
                counter++;
                // create a processing condition for the tasks
                function shouldProcess(task) {
                    var _a, _b;
                    // if there is a time estimate use it, otherwise default to 1 ms
                    // TODO: check whats a sane default, 1 seems to do it for now
                    availableTime -= (_b = (_a = task.estimatedProcessTime) === null || _a === void 0 ? void 0 : _a.call(task)) !== null && _b !== void 0 ? _b : DEFAULT_PROCESSING_ESTIMATE_TIME;
                    // always process at least 1 Task, so in the worst case the fps over tiles
                    // paradigma is sacrificed to not have an empty screen
                    if (availableTime > 0 || counter === 1) {
                        return true;
                    }
                    return false;
                }
                // process the CREATE tasks first, as they will have a faster result on the
                // visual outcome and have already spend time in the application during
                // fetching and decoding
                // fetching has lower priority as it wont make to much of a difference if not
                // called at the exact frame, and the tile might expire in the next anyway
                [MapView_1.TileTaskGroups.CREATE, MapView_1.TileTaskGroups.FETCH_AND_DECODE].forEach(tag => {
                    if (this.m_taskQueue.numItemsLeft(tag)) {
                        //TODO:
                        // * if one tag task does not fit another might, how to handle this?
                        // *    ** what if a task of another group could fit instead
                        // * whats the average of time we have here at this point in the programm?
                        this.m_taskQueue.processNext(tag, shouldProcess);
                    }
                });
                numItemsLeft = this.m_taskQueue.numItemsLeft();
            }
            // if there is tasks left in the TaskQueue, request an update to be able to process them
            // in a next frame
            numItemsLeft = this.m_taskQueue.numItemsLeft();
            if (numItemsLeft > 0) {
                currentFrameEvent === null || currentFrameEvent === void 0 ? void 0 : currentFrameEvent.setValue("TaskScheduler.pendingTasksNotYetProcessed", numItemsLeft);
                this.requestUpdate();
            }
        }
        else {
            //if throttling is disabled, process all pending tasks
            this.m_taskQueue.processNext(MapView_1.TileTaskGroups.CREATE, undefined, this.m_taskQueue.numItemsLeft(MapView_1.TileTaskGroups.CREATE));
            this.m_taskQueue.processNext(MapView_1.TileTaskGroups.FETCH_AND_DECODE, undefined, this.m_taskQueue.numItemsLeft(MapView_1.TileTaskGroups.FETCH_AND_DECODE));
        }
        if (stats.enabled) {
            currentFrameEvent === null || currentFrameEvent === void 0 ? void 0 : currentFrameEvent.setValue("TaskScheduler.pendingTasksTime", harp_utils_1.PerformanceTimer.now() - startTime);
        }
    }
    /**
     * Removes all tasks that have been queued.
     */
    clearQueuedTasks() {
        this.m_taskQueue.clear();
    }
    spaceInFrame(frameStartTime) {
        const passedTime = (performance || Date).now() - frameStartTime;
        return Math.max(1000 / this.m_maxFps - passedTime, 0);
    }
}
exports.MapViewTaskScheduler = MapViewTaskScheduler;

export default exports
//# sourceMappingURL=MapViewTaskScheduler.js.map