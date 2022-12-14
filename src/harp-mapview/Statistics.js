"use strict";

let exports = {}
exports.PerformanceStatistics = exports.FrameStatsArray = exports.FrameStats = exports.Statistics = exports.MultiStageTimer = exports.computeArrayAverage = exports.computeArrayStats = exports.SampledTimer = exports.SimpleTimer = exports.RingBuffer = void 0;
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
import * as harp_utils_1 from "@here/harp-utils"
const logger = harp_utils_1.LoggerManager.instance.create("Statistics");
/**
 * A simple ring buffer to store the last `n` values of the timer. The buffer works on
 * a First-In-First-Out (FIFO) basis.
 */
class RingBuffer {
    /**
     * Sets up the ring buffer.
     *
     * @param capacity - The buffer's capacity.
     */
    constructor(capacity) {
        this.capacity = capacity;
        this.buffer = new Array(capacity);
        this.capacity = capacity;
        this.head = this.tail = this.size = 0;
    }
    /**
     * Clears the contents, removes all elements.
     */
    clear() {
        this.head = this.tail = this.size = 0;
    }
    /**
     * Adds a single element to the ring buffer.
     *
     * @param data - Data element.
     */
    enqOne(data) {
        let next = this.head + 1;
        if (next >= this.capacity) {
            next = 0;
        }
        if (this.size < this.capacity) {
            this.size++;
        }
        this.buffer[this.head] = data;
        this.head = next;
        if (this.size === this.capacity) {
            this.tail = this.head;
        }
    }
    /**
     * Adds one or more elements.
     *
     * @param data - The elements to add.
     */
    enq(...data) {
        for (const v of data) {
            this.enqOne(v);
        }
    }
    /**
     * Obtains the oldest element (FIFO). May throw an exception if a buffer underrun occurs.
     * Before calling this method, make sure that `size > 0`.
     */
    deq() {
        if (this.size === 0) {
            throw new Error("Ringbuffer underrun");
        }
        const data = this.buffer[this.tail];
        let next = this.tail + 1;
        if (next >= this.capacity) {
            next = 0;
        }
        if (this.size > 0) {
            this.size--;
        }
        this.tail = next;
        return data;
    }
    /**
     * Obtains the oldest element (FIFO) without removing it. Throws an exception if a buffer is
     * empty. Before calling this method, make sure that `size > 0`.
     */
    get top() {
        if (this.size === 0) {
            throw new Error("Ringbuffer underrun");
        }
        return this.buffer[this.tail];
    }
    /**
     * Obtains the latest element (LIFO) without removing it. Throws an exception if a buffer is
     * empty. Before calling this method, make sure that `size > 0`.
     */
    get bottom() {
        if (this.size === 0) {
            throw new Error("Ringbuffer underrun");
        }
        let previous = this.head - 1;
        if (previous < 0) {
            previous = this.capacity - 1;
        }
        return this.buffer[previous];
    }
    /**
     * Creates an iterator for the buffer.
     */
    iterator() {
        return new RingBuffer.Iterator(this);
    }
    /**
     * Returns a copy of the buffer, where the elements are properly sorted from oldest to newest.
     */
    asArray() {
        const array = new Array();
        for (let i = 0; i < this.size; i++) {
            array.push(this.buffer[(this.tail + i) % this.capacity]);
        }
        return array;
    }
}
exports.RingBuffer = RingBuffer;
(function (RingBuffer) {
    /**
     * A local class for RingBuffer<T>
     */
    class Iterator {
        /**
         * Creates an iterator for the ring buffer.
         *
         * @param m_buffer - `Ringbuffer` to iterate over.
         * @param m_index - Start index.
         */
        constructor(m_buffer, m_index = 0) {
            this.m_buffer = m_buffer;
            this.m_index = m_index;
        }
        /**
         * Gets the iterator's current value. This function does not fail even if an overrun occurs.
         * To detect an overrun, watch the result for [[next]].
         */
        get value() {
            return this.m_buffer.buffer[(this.m_buffer.tail + this.m_index) % this.m_buffer.capacity];
        }
        /**
         * Advances the iterator to the next element.
         *
         * @returns `true` if the iterator is still valid; `false` if an overrun occurs.
         */
        next() {
            this.m_index++;
            return this.m_index < this.m_buffer.size;
        }
    }
    RingBuffer.Iterator = Iterator;
})(RingBuffer = exports.RingBuffer || (exports.RingBuffer = {}));
/**
 * A simple timer that stores only the latest measurement.
 *
 * @internal
 */
class SimpleTimer {
    constructor(statistics, name) {
        this.statistics = statistics;
        this.name = name;
        /** `true` if timer has been started. */
        this.running = false;
    }
    /**
     * Gets the latest measurement. This function may return `undefined` if no measurement
     * was done.
     */
    get value() {
        return this.m_currentValue;
    }
    /**
     * Sets the measurement value for the amount of time that has elapsed from start() to stop().
     * Use this function to override the timer's duration.
     *
     * @param val - The timer's duration.
     */
    setValue(val) {
        this.m_currentValue = val;
    }
    /**
     * Resets the value to be able to start again.
     */
    reset() {
        this.m_currentValue = undefined;
    }
    /**
     * Starts the timer. Returns the current time, based on `Performance.now()`.
     */
    start() {
        if (!this.statistics.enabled) {
            return -1;
        }
        if (this.running) {
            throw new Error("Timer '" + this.name + "' is already running");
        }
        this.running = true;
        return (this.m_currentValue = harp_utils_1.PerformanceTimer.now());
    }
    /**
     * Stops the timer. Requires that the timer has started.
     */
    stop() {
        var _a;
        if (!this.statistics.enabled) {
            return -1;
        }
        if (!this.running) {
            throw new Error("Timer '" + this.name + "' has not been started");
        }
        else {
            // this.currentValue is a number now!
            const t = harp_utils_1.PerformanceTimer.now() - ((_a = this.m_currentValue) !== null && _a !== void 0 ? _a : 0);
            this.m_currentValue = t;
            this.setValue(t);
            this.running = false;
            return t;
        }
    }
    /**
     * Samples the timer. Requires that the timer has started.
     *
     * @returns the current timer value; `-1` if statistics are disabled.
     */
    now() {
        var _a;
        if (!this.statistics.enabled) {
            return -1;
        }
        if (!this.running) {
            throw new Error("Timer '" + this.name + "' has not been started");
        }
        else {
            const t = harp_utils_1.PerformanceTimer.now() - ((_a = this.m_currentValue) !== null && _a !== void 0 ? _a : 0);
            return t;
        }
    }
}
exports.SimpleTimer = SimpleTimer;
/**
 * A timer that stores the last `n` samples in a ring buffer.
 *
 * @internal
 */
class SampledTimer extends SimpleTimer {
    /**
     * Creates a `SampledTimer` instance. Must still be added to statistics if it should be logged!
     *
     * @param statistics - Statistics to use for management.
     * @param name - Name of the timer. Use colons to build a hierarchy.
     */
    constructor(statistics, name) {
        super(statistics, name);
        this.statistics = statistics;
        this.name = name;
        /**
         * The number of times the timer has reset.
         */
        this.numResets = 0;
        /**
         * Maximum samples until the statistics are reset and updated, which may destroy a median
         * computation.
         */
        this.maxNumSamples = 1000;
        /**
         * The array of sampled values, its length cannot exceed `maxNumSamples`.
         */
        this.samples = new RingBuffer(this.maxNumSamples);
    }
    /**
     * Resets the timer and clears all of its historical values.
     * @override
     */
    reset() {
        super.reset();
        this.getStats();
        this.samples.clear();
        this.numResets++;
    }
    /**
     * Add a single measurement to the sample.
     *
     * @param val - A measurement to add.
     * @override
     */
    setValue(val) {
        super.setValue(val);
        if (val !== undefined) {
            this.samples.enqOne(val);
        }
    }
    /**
     * Updates the `min`, `max`, `avg`, and `median` values. Currently, this function is expensive,
     * as it requires a copy of the sampled values.
     */
    getStats() {
        return computeArrayStats(this.samples.asArray());
    }
}
exports.SampledTimer = SampledTimer;
/**
 * Only exported for testing
 * @ignore
 *
 * @remarks
 * Compute the [[ArrayStats]] for the passed in array of numbers.
 *
 * @param {number[]} samples Array containing sampled values. Will be modified (!) by sorting the
 *      entries.
 * @returns {(Stats | undefined)}
 *
 * @internal
 */
function computeArrayStats(samples) {
    if (samples.length === 0) {
        return undefined;
    }
    samples.sort((a, b) => {
        return a - b;
    });
    const min = samples[0];
    const max = samples[samples.length - 1];
    let median;
    let median75;
    let median90;
    let median95;
    let median97;
    let median99;
    let median999;
    if (samples.length === 1) {
        median75 = median90 = median95 = median97 = median99 = median999 = median = samples[0];
    }
    else if (samples.length === 2) {
        median = samples[0] * 0.5 + samples[1] * 0.5;
        median75 = median90 = median95 = median97 = median99 = median999 = samples[1];
    }
    else {
        const mid = Math.floor(samples.length / 2);
        median =
            samples.length % 2 === 0 ? samples[mid - 1] * 0.5 + samples[mid] * 0.5 : samples[mid];
        const mid75 = Math.round(samples.length * 0.75) - 1;
        median75 = samples[mid75];
        const mid90 = Math.round(samples.length * 0.9) - 1;
        median90 = samples[mid90];
        const mid95 = Math.round(samples.length * 0.95) - 1;
        median95 = samples[mid95];
        const mid97 = Math.round(samples.length * 0.97) - 1;
        median97 = samples[mid97];
        const mid99 = Math.round(samples.length * 0.99) - 1;
        median99 = samples[mid99];
        const mid999 = Math.round(samples.length * 0.999) - 1;
        median999 = samples[mid999];
    }
    let sum = 0;
    for (let i = 0, l = samples.length; i < l; i++) {
        sum += samples[i];
    }
    const avg = sum / samples.length;
    return {
        min,
        max,
        avg,
        median,
        median75,
        median90,
        median95,
        median97,
        median99,
        median999,
        numSamples: samples.length
    };
}
exports.computeArrayStats = computeArrayStats;
/**
 * Only exported for testing
 * @ignore
 *
 * @remarks
 * Compute the averages for the passed in array of numbers.
 *
 * @param {number[]} samples Array containing sampled values.
 * @returns {(Stats | undefined)}
 *
 * @internal
 */
function computeArrayAverage(samples) {
    if (samples.length === 0) {
        return undefined;
    }
    let sum = 0;
    for (let i = 0, l = samples.length; i < l; i++) {
        sum += samples[i];
    }
    const avg = sum / samples.length;
    return avg;
}
exports.computeArrayAverage = computeArrayAverage;
/**
 * Measures a sequence of connected events, such as multiple processing stages in a function.
 *
 * @remarks
 * Each stage is identified with a timer name, that must be a valid timer in the statistics
 * object. Additionally, all timers within a `MultiStageTimer` must be unique.
 *
 * Internally, the `MultiStageTimer` manages a list of timers where at the end of each stage,
 * one timer stops and the next timer starts.
 *
 * @internal
 */
class MultiStageTimer {
    /**
     * Defines the `MultiStageTimer` with a list of timer names that represent its stages.
     *
     * @param statistics - The statistics object that manages the timers.
     * @param name - Name of this `MultiStageTimer`.
     * @param stages - List of timer names.
     */
    constructor(statistics, name, stages) {
        this.statistics = statistics;
        this.name = name;
        this.stages = stages;
        if (stages.length < 1) {
            throw new Error("MultiStageTimer needs stages");
        }
        stages.forEach(stage => {
            if (!statistics.hasTimer(stage)) {
                throw new Error("Unknown timer: " + stage);
            }
        });
    }
    /**
     * Gets the timer value for the last stage. If the `MultiStageTimer` did not finish its
     * last stage, the value is `undefined`.
     */
    get value() {
        return this.statistics.getTimer(this.stages[this.stages.length - 1]).value;
    }
    /**
     * Resets the timers across all stages.
     */
    reset() {
        if (!this.statistics.enabled) {
            return;
        }
        this.stages.forEach(stage => {
            this.statistics.getTimer(stage).reset();
        });
    }
    /**
     * Starts the `MultiStageTimer` at its first stage.
     */
    start() {
        var _a;
        this.stage = this.stages[0];
        return (_a = this.statistics.getTimer(this.stages[0]).value) !== null && _a !== void 0 ? _a : -1;
    }
    /**
     * Stops the `MultiStageTimer`. Returns the measurement of the last stage, which may be
     * `undefined` if not all stages started.
     */
    stop() {
        this.stage = undefined;
        return this.value !== undefined ? this.value : -1;
    }
    /**
     * Gets the current stage.
     */
    get stage() {
        return this.currentStage;
    }
    /**
     * Sets the current stage. If a new stage is provided, the current timer (if available) is
     * stopped, and the next timer is started. If the timer in the next stage is `undefined`,
     * this is equivalent to calling `stop` on the `MultiStageTimer`.
     *
     * @param stage - The next stage to start.
     */
    set stage(stage) {
        if (this.currentStage === stage) {
            return;
        }
        if (this.statistics.enabled && this.currentStage !== undefined) {
            this.statistics.getTimer(this.currentStage).stop();
        }
        this.currentStage = stage;
        if (this.statistics.enabled && this.currentStage !== undefined) {
            this.statistics.getTimer(this.currentStage).start();
        }
    }
}
exports.MultiStageTimer = MultiStageTimer;
/**
 * Manages a set of timers.
 *
 * @remarks
 * The main objective of `Statistics` is to log these timers. You can
 * disable statistics to minimize their impact on performance.
 *
 * @internal
 */
class Statistics {
    /**
     * Sets up a group of timers.
     *
     * @param name - The statistics name, for logging purposes.
     * @param enabled - If `false`, the timers do not measure the performance.
     */
    constructor(name, enabled = false) {
        this.name = name;
        this.enabled = enabled;
        this.timers = new Map();
        this.nullTimer = new SimpleTimer(this, "<null>");
    }
    /**
     * Adds a timer, based on the name specified.
     *
     * @param name - The timer's name; must be unique.
     */
    createTimer(name, keepSamples = true) {
        const timer = keepSamples ? new SampledTimer(this, name) : new SimpleTimer(this, name);
        return this.addTimer(timer);
    }
    /**
     * Adds the timer specified.
     *
     * @param timer - The timer's name, which must be unique within this statistics object.
     */
    addTimer(timer) {
        if (this.timers.get(timer.name) !== undefined) {
            throw new Error("Duplicate timer name: '" + timer.name + "'");
        }
        this.timers.set(timer.name, timer);
        return timer;
    }
    /**
     * Gets a timer by name.
     *
     * @param name - The timer's name.
     */
    getTimer(name) {
        if (!this.enabled) {
            return this.nullTimer;
        }
        const t = this.timers.get(name);
        return t === undefined ? this.nullTimer : t;
    }
    /**
     * Checks if a timer with the specified name already exists.
     *
     * @param name - The timer's name.
     * @returns `true` if a timer with `name` already exists; `false` otherwise.
     */
    hasTimer(name) {
        const t = this.timers.get(name);
        return t !== undefined;
    }
    /**
     * Resets all timers.
     */
    reset() {
        this.timers.forEach((timer) => {
            timer.reset();
        });
    }
    /**
     * Prints all values to the console.
     *
     * @param header - Optional header line.
     * @param footer - Optional footer line.
     */
    log(header, footer) {
        if (header !== undefined || this.name !== undefined) {
            logger.log(header !== undefined ? header : this.name);
        }
        let maxNameLength = 0;
        this.timers.forEach((timer) => {
            maxNameLength = Math.max(maxNameLength, timer.name.length);
        });
        // simple printing function for number limits the number of decimal points.
        const print = (v) => {
            return v !== undefined ? v.toFixed(5) : "?";
        };
        this.timers.forEach((timer) => {
            let s = timer.name + ": " + " ".repeat(maxNameLength - timer.name.length);
            s += print(timer.value);
            // sampled timers also update their stats and log them
            if (timer instanceof SampledTimer) {
                const simpleStats = timer.getStats();
                if (simpleStats !== undefined) {
                    s +=
                        `  [ min=${print(simpleStats.min)}, max=${print(simpleStats.max)}, ` +
                            `avg=${print(simpleStats.avg)}, med=${print(simpleStats.median)}, ` +
                            `med95=${print(simpleStats.median95)}, med99=${print(simpleStats.median99)}, ` +
                            `N=${print(simpleStats.numSamples)} ]`;
                }
            }
            logger.log(s);
        });
        if (footer !== undefined) {
            logger.log(footer);
        }
    }
}
exports.Statistics = Statistics;
/**
 * Class containing all counters, timers and events of the current frame.
 *
 * @internal
 */
class FrameStats {
    constructor() {
        this.entries = new Map();
        this.messages = undefined;
    }
    /**
     * Retrieve the value of the performance number.
     *
     * @param name - Name of the performance number.
     * @returns The value of the performance number or `undefined` if it has not been declared by
     *      `setValue` before.
     */
    getValue(name) {
        return this.entries.get(name);
    }
    /**
     * Set the value of the performance number.
     *
     * @param name - Name of the performance number.
     * @param name - New value of the performance number.
     */
    setValue(name, value) {
        this.entries.set(name, value);
    }
    /**
     * Add a value to the current value of the performance number. If the performance is not known,
     * it will be initialized with `value`.
     *
     * @param name - Name of the performance number.
     * @param name - Value to be added to the performance number.
     */
    addValue(name, value) {
        const oldValue = this.entries.get(name);
        this.entries.set(name, value + (oldValue === undefined ? 0 : oldValue));
    }
    /**
     * Add a text message to the frame, like "Font XYZ has been loaded"
     *
     * @param message - The message to add.
     */
    addMessage(message) {
        if (this.messages === undefined) {
            this.messages = [];
        }
        this.messages.push(message);
    }
    /**
     * Reset all known performance values to `0` and the messages to `undefined`.
     */
    reset() {
        this.entries.forEach((value, name) => {
            this.entries.set(name, 0);
        });
        this.messages = undefined;
    }
}
exports.FrameStats = FrameStats;
/**
 * @ignore
 * Only exported for testing.
 *
 * @remarks
 * Instead of passing around an array of objects, we store the frame statistics as an object of
 * arrays. This allows convenient computations from {@link RingBuffer},
 */
class FrameStatsArray {
    constructor(capacity = 0) {
        this.capacity = capacity;
        this.frameEntries = new Map();
        this.messages = new RingBuffer(capacity);
    }
    get length() {
        return this.messages.size;
    }
    reset() {
        this.frameEntries.forEach((buffer, name) => {
            buffer.clear();
        });
        this.messages.clear();
    }
    addFrame(frameStats) {
        const currentSize = this.length;
        const frameEntries = this.frameEntries;
        frameStats.entries.forEach((value, name) => {
            let buffer = frameEntries.get(name);
            if (buffer === undefined) {
                // If there is a buffer that has not been known before, add it to the known buffers,
                // fill it up with with 0 to the size of all the other buffers to make them of equal
                // size to make PerfViz happy.
                buffer = new RingBuffer(this.capacity);
                for (let i = 0; i < currentSize; i++) {
                    buffer.enqOne(0);
                }
                this.frameEntries.set(name, buffer);
            }
            buffer.enqOne(value);
        });
        this.messages.enq(frameStats.messages);
    }
    /**
     * Prints all values to the console.
     */
    log() {
        let maxNameLength = 0;
        this.frameEntries.forEach((buffer, name) => {
            maxNameLength = Math.max(maxNameLength, name.length);
        });
        // simple printing function for number limits the number of decimal points.
        const print = (v) => {
            return v !== undefined ? v.toFixed(5) : "?";
        };
        this.frameEntries.forEach((buffer, name) => {
            let s = name + ": " + " ".repeat(maxNameLength - name.length);
            const simpleStats = computeArrayStats(buffer.asArray());
            if (simpleStats !== undefined) {
                s +=
                    `  [ min=${print(simpleStats.min)}, max=${print(simpleStats.max)}, ` +
                        `avg=${print(simpleStats.avg)}, med=${print(simpleStats.median)}, ` +
                        `med95=${print(simpleStats.median95)}, med99=${print(simpleStats.median99)}, ` +
                        `N=${print(simpleStats.numSamples)} ]`;
            }
            logger.log(s);
        });
    }
}
exports.FrameStatsArray = FrameStatsArray;
/**
 * Performance measurement central.
 *
 * @remarks
 * Maintains the current. Implemented as an instance for easy access.
 *
 * {@link FrameStats}, which holds all individual performance numbers.
 *
 * @internal
 */
class PerformanceStatistics {
    /**
     * Creates an instance of PerformanceStatistics. Overrides the current `instance`.
     *
     * @param {boolean} [enabled=true] If `false` the performance values will not be stored.
     * @param {number} [maxNumFrames=1000] The maximum number of frames that are to be stored.
     * @memberof PerformanceStatistics
     */
    constructor(enabled = true, maxNumFrames = 1000) {
        this.enabled = enabled;
        this.maxNumFrames = maxNumFrames;
        /**
         * Current frame statistics. Contains all values for the current frame. Will be cleared when
         * [[PerformanceStatistics#storeFrameInfo]] is called.
         *
         * @type {FrameStats}
         * @memberof PerformanceStatistics
         */
        this.currentFrame = new FrameStats();
        /**
         * Additional results stored for the current application run, not per frame. Only the last value
         * is stored.
         *
         * @type {(Map<string, number>)}
         */
        this.appResults = new Map();
        /**
         * Additional configuration values stored for the current application run, not per frame. Only
         * the last value is stored.
         *
         * @type {(Map<string, string>)}
         * @memberof PerformanceStatistics
         */
        this.configs = new Map();
        PerformanceStatistics.m_instance = this;
        this.m_frameEvents = new FrameStatsArray(maxNumFrames);
    }
    /**
     * Returns `true` when the maximum number of storable frames is reached.
     *
     * @readonly
     * @type {boolean}
     * @memberof PerformanceStatistics
     */
    get isFull() {
        return this.m_frameEvents.length >= this.maxNumFrames;
    }
    /**
     * Global instance to the instance. The current instance can be overridden by creating a new
     * `PerformanceStatistics`.
     */
    static get instance() {
        if (PerformanceStatistics.m_instance === undefined) {
            PerformanceStatistics.m_instance = new PerformanceStatistics(false, 0);
        }
        return PerformanceStatistics.m_instance;
    }
    /**
     * @ignore
     * Only exported for testing.
     *
     * Return the array of frame events.
     */
    get frameEvents() {
        return this.m_frameEvents;
    }
    /**
     * Clears all settings, all stored frame events as well as the current frame values.
     *
     * @memberof PerformanceStatistics
     */
    clear() {
        this.clearFrames();
        this.configs.clear();
        this.appResults.clear();
    }
    /**
     * Clears only all stored frame events as well as the current frame values.
     *
     * @memberof PerformanceStatistics
     */
    clearFrames() {
        this.m_frameEvents.reset();
        this.currentFrame.reset();
    }
    /**
     * Add the render state information from [[THREE.WebGLInfo]] to the current frame.
     * @param {THREE.WebGLInfo} webGlInfo
     */
    addWebGLInfo(webGlInfo) {
        if (webGlInfo.render !== undefined) {
            this.currentFrame.setValue("gl.numCalls", webGlInfo.render.calls === null ? 0 : webGlInfo.render.calls);
            this.currentFrame.setValue("gl.numPoints", webGlInfo.render.points === null ? 0 : webGlInfo.render.points);
            this.currentFrame.setValue("gl.numLines", webGlInfo.render.lines === null ? 0 : webGlInfo.render.lines);
            this.currentFrame.setValue("gl.numTriangles", webGlInfo.render.triangles === null ? 0 : webGlInfo.render.triangles);
        }
        if (webGlInfo.memory !== undefined) {
            this.currentFrame.setValue("gl.numGeometries", webGlInfo.memory.geometries === null ? 0 : webGlInfo.memory.geometries);
            this.currentFrame.setValue("gl.numTextures", webGlInfo.memory.textures === null ? 0 : webGlInfo.memory.textures);
        }
        if (webGlInfo.programs !== undefined) {
            this.currentFrame.setValue("gl.numPrograms", webGlInfo.programs === null ? 0 : webGlInfo.programs.length);
        }
    }
    /**
     * Add memory statistics to the current frame if available.
     * @note Currently only supported on Chrome
     */
    addMemoryInfo() {
        if (window !== undefined && window.performance !== undefined) {
            const memory = window.performance.memory;
            if (memory !== undefined) {
                this.currentFrame.setValue("memory.totalJSHeapSize", memory.totalJSHeapSize);
                this.currentFrame.setValue("memory.usedJSHeapSize", memory.usedJSHeapSize);
                this.currentFrame.setValue("memory.jsHeapSizeLimit", memory.jsHeapSizeLimit);
            }
        }
    }
    /**
     * Stores the current frame events into the array of events and clears all values.
     *
     * @returns {boolean} Returns `false` if the maximum number of storable frames has been reached.
     * @memberof PerformanceStatistics
     */
    storeAndClearFrameInfo() {
        if (this.m_frameEvents.length >= this.maxNumFrames) {
            return false;
        }
        this.m_frameEvents.addFrame(this.currentFrame);
        this.currentFrame.reset();
        return true;
    }
    /**
     * Logs all values to the logger.
     *
     * @param header - Optional header line.
     * @param footer - Optional footer line.
     */
    log(header, footer) {
        logger.log(header !== undefined ? header : "PerformanceStatistics");
        const appResults = this.appResults;
        appResults.forEach((value, name) => {
            logger.log(name, value);
        });
        const configs = this.configs;
        configs.forEach((value, name) => {
            logger.log(name, value);
        });
        this.m_frameEvents.log();
        if (footer !== undefined) {
            logger.log(footer);
        }
    }
    /**
     * Convert to a plain object that can be serialized. Required to copy the test results over to
     * nightwatch.
     */
    getAsPlainObject(onlyLastFrame = false) {
        const appResults = {};
        const configs = {};
        const frames = {};
        const plainObject = {
            configs,
            appResults,
            frames
        };
        const appResultValues = this.appResults;
        appResultValues.forEach((value, name) => {
            appResults[name] = value;
        });
        const configValues = this.configs;
        configValues.forEach((value, name) => {
            configs[name] = value;
        });
        if (onlyLastFrame) {
            for (const [name, buffer] of this.m_frameEvents.frameEntries) {
                frames[name] = buffer.bottom;
            }
        }
        else {
            for (const [name, buffer] of this.m_frameEvents.frameEntries) {
                frames[name] = buffer.asArray();
            }
        }
        plainObject.messages = this.m_frameEvents.messages.asArray();
        return plainObject;
    }
    /**
     * Convert the last frame values to a plain object that can be serialized. Required to copy the
     * test results over to nightwatch.
     */
    getLastFrameStatistics() {
        return this.getAsPlainObject(true);
    }
    /**
     * Convert to a plain object that can be serialized. Required to copy the test results over to
     * nightwatch.
     */
    getAsSimpleFrameStatistics(onlyLastFrame = false) {
        const configs = new Map();
        const appResults = new Map();
        const frames = new Map();
        const simpleStatistics = {
            configs,
            appResults,
            frames,
            messages: this.m_frameEvents.messages.asArray()
        };
        const appResultValues = this.appResults;
        appResultValues.forEach((value, name) => {
            appResults.set(name, value);
        });
        const configValues = this.configs;
        configValues.forEach((value, name) => {
            configs.set(name, value);
        });
        if (onlyLastFrame) {
            for (const [name, buffer] of this.m_frameEvents.frameEntries) {
                frames.set(name, buffer.bottom);
            }
        }
        else {
            for (const [name, buffer] of this.m_frameEvents.frameEntries) {
                frames.set(name, buffer.asArray());
            }
        }
        return simpleStatistics;
    }
}
exports.PerformanceStatistics = PerformanceStatistics;
PerformanceStatistics.m_instance = undefined;
export default exports
//# sourceMappingURL=Statistics.js.map