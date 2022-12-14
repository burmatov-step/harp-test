import { TaskQueue } from "@here/harp-utils";
import THREE = require("three");
export declare class MapViewTaskScheduler extends THREE.EventDispatcher {
    private m_maxFps;
    private readonly m_taskQueue;
    private m_throttlingEnabled;
    constructor(m_maxFps?: number);
    set maxFps(fps: number);
    get maxFps(): number;
    get taskQueue(): TaskQueue;
    get throttlingEnabled(): boolean;
    set throttlingEnabled(enabled: boolean);
    /**
     * Sends a request to the [[MapView]] to redraw the scene.
     */
    requestUpdate(): void;
    /**
     * Processes the pending Tasks of the underlying [[TaskQueue]]
     * !! This should run at the end of the renderLoop, so the calculations of the available
     * frame time are better estimated
     *
     * @param frameStartTime the start time of the current frame, is used to calculate the
     * still available time in the frame to process Tasks
     *
     */
    processPending(frameStartTime: number): void;
    /**
     * Removes all tasks that have been queued.
     */
    clearQueuedTasks(): void;
    private spaceInFrame;
}
//# sourceMappingURL=MapViewTaskScheduler.d.ts.map