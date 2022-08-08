"use strict";
let exports = {}
exports.TextElementGroupState = void 0;
import * as  harp_utils_1 from "@here/harp-utils"
import TextElementState_1 from "./TextElementState"
import TextElementType_1 from "./TextElementType"
/**
 * `TextElementGroupState` keeps the state of a text element group and each element in it while
 * they're being rendered.
 */
class TextElementGroupState {
    /**
     * Creates the state for specified group.
     * @param group - The group of which the state will be created.
     * @param tileKey - The key of the tile to which this group belongs.
     * @param filter - Function used to do early rejection. @see [[TextElementFilter]].
     */
    constructor(group, tileKey, filter) {
        this.group = group;
        this.tileKey = tileKey;
        this.m_visited = false;
        harp_utils_1.assert(group.elements.length > 0);
        const length = group.elements.length;
        this.m_textElementStates = [];
        this.m_visited = true;
        // TODO: HARP-7648. Reduce number of allocations here:
        // a) Avoid creating the state for labels that don't pass early placement checks and make
        //    this checks more strict.
        // b) Break label state objects into a set of arrays held at group level, one for each
        //    primitive field in the label state.
        for (let i = 0; i < length; ++i) {
            const textElement = group.elements[i];
            if (textElement.type === TextElementType_1.TextElementType.LineMarker && textElement.path !== undefined) {
                const numPoints = textElement.path.length;
                for (let p = 0; p < numPoints; p++) {
                    const state = new TextElementState_1.TextElementState(textElement, p);
                    const textDistance = filter(state);
                    state.update(textDistance);
                    this.m_textElementStates.push(state);
                }
            }
            else {
                const state = new TextElementState_1.TextElementState(textElement);
                const textDistance = filter(state);
                state.update(textDistance);
                this.m_textElementStates.push(state);
            }
        }
    }
    /**
     * Indicates whether the group has been submitted to the
     * {@link TextElementsRenderer} in the current frame.
     */
    get visited() {
        return this.m_visited;
    }
    set visited(visited) {
        this.m_visited = visited;
    }
    /**
     * @returns the priority of the text elements in the group.
     */
    get priority() {
        return this.group.priority;
    }
    /**
     * Updates the fading state of all text elements within the group to the specified time.
     * @param time - The time to which the fading state will be updated.
     * @param disableFading - `true` if fading is disabled, `false` otherwise.
     */
    updateFading(time, disableFading) {
        for (const elementState of this.m_textElementStates) {
            if (elementState !== undefined) {
                elementState.updateFading(time, disableFading);
            }
        }
    }
    /**
     * Calls the specified callback for every visible text elements in the group.
     * @param visibleElementsCallback - Functions that will be called for every visible text element
     * in the group.
     */
    traverseVisibleElements(visibleElementsCallback) {
        for (const elementState of this.m_textElementStates) {
            if (elementState !== undefined && elementState.visible) {
                visibleElementsCallback(elementState);
            }
        }
    }
    /**
     * Updates the states of elements within the group.
     * @param filter - Function used to do early rejection. @see [[TextElementFilter]].
     */
    updateElements(filter) {
        for (const elementState of this.m_textElementStates) {
            const textDistance = filter(elementState);
            elementState.update(textDistance);
        }
    }
    get size() {
        return this.m_textElementStates.length;
    }
    /**
     * Returns text element states.
     * @returns Array of element states.
     */
    get textElementStates() {
        return this.m_textElementStates;
    }
}
exports.TextElementGroupState = TextElementGroupState;
export default exports
//# sourceMappingURL=TextElementGroupState.js.map