"use strict";
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.debugContext = exports.DebugContext = void 0;
import * as THREE from "three"
const isNode = typeof window === "undefined";
/**
 * A `DebugOption` is a pair that consists of an option value and an array of change listeners.
 * Listeners are called up when setting the option's value.
 */
class DebugOption extends THREE.EventDispatcher {
    /**
     * Constructs the `DebugOption`.
     *
     * @param value - The value of the option.
     */
    constructor(value) {
        super();
        this.value = value;
    }
    /**
     * Updates the value of a given option.
     *
     * @param value - The new value for the option.
     * @param name - The name of the option to set.
     */
    set(value, name) {
        this.value = value;
        this.dispatchEvent({ type: DebugOption.SET_EVENT_TYPE, name, value });
    }
}
DebugOption.SET_EVENT_TYPE = "set";
/**
 * Maintains a map of [[DebugOption]]s. You can add listeners to debug options by passing their
 * names.
 */
class DebugContext {
    /**
     * Builds a `DebugContext`.
     */
    constructor() {
        this.m_optionsMap = new Map();
        // If we have a `window` object, we store the context in it to make it available in the
        // console.
        if (!isNode && typeof window !== "undefined" && window) {
            const debugInfo = window;
            debugInfo.__debugContext = this;
        }
    }
    /**
     * Sets the value of an option. Calls change listeners of that option, even if the value has
     * not been changed. The change listeners provided here are not called during this set
     * operation.
     *
     * @param name - Name of the option.
     * @param value - Value of the option.
     */
    setValue(name, value) {
        let opt = this.m_optionsMap.get(name);
        if (!opt) {
            opt = new DebugOption(value);
            this.m_optionsMap.set(name, opt);
        }
        else {
            opt.set(value, name);
        }
    }
    /**
     * Gets the option value.
     *
     * @param name - Name of option.
     */
    getValue(name) {
        const opt = this.m_optionsMap.get(name);
        return opt ? opt.value : undefined;
    }
    /**
     * Determines if the option is registered.
     *
     * @param name - Name of option.
     */
    hasOption(name) {
        return this.m_optionsMap.get(name) !== undefined;
    }
    /**
     * Adds a listener to a debug option.
     *
     * @param name - Name of the option that requires a listener.
     * @param listener - The listener function to add.
     */
    addEventListener(name, listener) {
        const opt = this.m_optionsMap.get(name);
        if (opt) {
            opt.addEventListener(DebugOption.SET_EVENT_TYPE, listener);
        }
        else {
            throw Error("Unknown option: " + name);
        }
    }
    /**
     * Checks for a listener in a debug option.
     *
     * @param name - Name of the option to check for.
     * @param listener - The listener function to check for.
     */
    hasEventListener(name, listener) {
        const opt = this.m_optionsMap.get(name);
        if (opt) {
            return opt.hasEventListener(DebugOption.SET_EVENT_TYPE, listener);
        }
        else {
            throw Error("Unknown option: " + name);
        }
    }
    /**
     * Removes a listener from a debug option.
     *
     * @param name - Name of the option from which to remove a listener.
     * @param listener - The listener function to remove.
     */
    removeEventListener(name, listener) {
        const opt = this.m_optionsMap.get(name);
        if (opt) {
            opt.removeEventListener(DebugOption.SET_EVENT_TYPE, listener);
        }
        else {
            throw Error("Unknown option: " + name);
        }
    }
    /**
     * Provides access to the options map. This method is useful for creating an automatic
     * browser GUI.
     */
    get options() {
        return this.m_optionsMap;
    }
    /**
     * Clears away all debug options. Currently, `THREE.EventDispatcher` does not provide an API
     * to remove all event listeners.
     */
    clear() {
        this.m_optionsMap.forEach(option => {
            option.set(undefined, "");
        });
    }
}
exports.DebugContext = DebugContext;
exports.debugContext = new DebugContext();

export default exports
//# sourceMappingURL=DebugContext.js.map