"use strict";
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.TextElementStateCache = void 0;
import * as harp_utils_1 from "@here/harp-utils"
import TextElementGroupState_1 from "./TextElementGroupState"
import TextElementState_1 from "./TextElementState"
import TextElementType_1 from "./TextElementType"
const logger = harp_utils_1.LoggerManager.instance.create("TextElementsStateCache", { level: harp_utils_1.LogLevel.Log });
/**
 * Label distance tolerance squared in meters. Point labels with the same name that are closer in
 * world space than this value are treated as the same label. Used to identify duplicate labels in
 * overlapping tiles and label replacements at different storage levels.
 */
function getDedupSqDistTolerance(zoomLevel) {
    // Defining here a minimum tolerance of 10m at zoom level 13 or higher.
    const minSqTol = 100;
    const minSqTolLevel = 13;
    const maxLevelDelta = 4;
    const levelDelta = Math.min(maxLevelDelta, minSqTolLevel - Math.min(minSqTolLevel, Math.floor(zoomLevel)));
    // Distance tolerance computed applying a factor over an arbitrary minimum tolerance for a
    // chosen zoom level. The factor is an exponential function on zoom level delta wrt minimum
    // tolerance zoom level.
    // error = sqrt(sqError) = sqrt(minSqError* 2^(4d)) = minError*2^(2d)
    return minSqTol << (levelDelta << 2);
}
const tmpCachedDuplicate = {
    entries: [],
    index: -1
};
function getCacheKey(element) {
    return element.hasFeatureId() ? element.featureId : element.text;
}
/**
 * Finds a duplicate for a text element among a list of candidates using their feature ids.
 * @param elementState - The state of the text element for which the duplicate will be found.
 * @param candidates - The list of candidates to check.
 * @returns The index of the candidate chosen as duplicate, or `undefined` if none was found.
 */
function findDuplicateById(elementState, candidates) {
    // Cached entries with same feature id found, find the entry with the same tile offset.
    const element = elementState.element;
    const duplicateIndex = candidates.findIndex(entry => entry.element.tileOffset === element.tileOffset);
    if (duplicateIndex === -1) {
        return -1;
    }
    const candidateElement = candidates[duplicateIndex];
    const candidate = candidateElement.element;
    harp_utils_1.assert(element.featureId === candidate.featureId);
    if (candidate.text !== element.text) {
        // Labels with different text shouldn't share the same feature id. This points to
        // an issue on the map data side. Submit a ticket to the corresponding map backend
        // issue tracking system if available (e.g. OLPRPS project in JIRA for OMV),
        // indicating affected labels including tile keys, texts and feature id.
        logger.debug(`Text feature id ${element.featureId} collision between "${element.text} and \
             ${candidate.text}`);
        return undefined;
    }
    return duplicateIndex;
}
// Duplicate criteria for path labels. Candidates are better the longer their paths are.
function isBetterPathDuplicate(newCandidate, _newDistance, oldCandidate, _oldDistance) {
    if (newCandidate.pathLengthSqr === undefined) {
        return false;
    }
    if (oldCandidate.pathLengthSqr === undefined) {
        return false;
    }
    return newCandidate.pathLengthSqr > oldCandidate.pathLengthSqr;
}
// Duplicate criteria for point labels. Candidates are better the nearer they are to the label being
// tested for duplicates.
function isBetterPointDuplicate(_newCandidate, newDistance, _oldCandidate, oldDistance) {
    return newDistance < oldDistance;
}
/**
 * Finds a duplicate for a text element among a list of candidates using their text and distances.
 * @param elementState - The state of the text element for which the duplicate will be found.
 * @param candidates - The list of candidates to check.
 * @param zoomLevel - Current zoom level.
 * @returns The index of the candidate chosen as duplicate, or `undefined` if none was found.
 */
function findDuplicateByText(elementState, candidates, zoomLevel) {
    const element = elementState.element;
    const maxSqDistError = getDedupSqDistTolerance(zoomLevel);
    const entryCount = candidates.length;
    const elementPosition = elementState.position;
    const elementVisible = elementState.visible;
    const isLineMarker = TextElementState_1.isLineMarkerElementState(elementState);
    let dupIndex = -1;
    let duplicate;
    let dupDistSquared = Infinity;
    const isBetterDuplicate = element.type === TextElementType_1.TextElementType.PathLabel ? isBetterPathDuplicate : isBetterPointDuplicate;
    for (let i = 0; i < entryCount; ++i) {
        const candidateEntry = candidates[i];
        const cachedElement = candidateEntry.element;
        const areDiffType = element.type !== cachedElement.type ||
            isLineMarker !== TextElementState_1.isLineMarkerElementState(candidateEntry);
        const areBothVisible = elementVisible && candidateEntry.visible;
        if (areDiffType || areBothVisible) {
            // Two text elements with different type or visible at the same time are always
            // considered distinct.
            continue;
        }
        const distSquared = elementPosition.distanceToSquared(cachedElement.position);
        if (distSquared > maxSqDistError) {
            // Cached text element is too far away to be a duplicate.
            continue;
        }
        if (duplicate === undefined ||
            isBetterDuplicate(cachedElement, distSquared, duplicate, dupDistSquared)) {
            dupIndex = i;
            duplicate = cachedElement;
            dupDistSquared = distSquared;
        }
    }
    return dupIndex;
}
/**
 * Caches the state of text element groups currently rendered as well as the text element states
 * belonging to them, including their fading state and text deduplication information.
 */
class TextElementStateCache {
    constructor() {
        this.m_referenceMap = new Map();
        // Cache for point labels which may have duplicates in same tile or in neighboring tiles.
        this.m_textMap = new Map();
    }
    /**
     * Gets the state corresponding to a given text element group or sets a newly created state if
     * not found. It updates the states of the text elements belonging to the group using the
     * specified parameters.
     * @param textElementGroup - The group of which the state will be obtained.
     * @param tileKey - The key of the tile to which the group belongs.
     * @param textElementFilter - Filter used to decide if a text element must be initialized,
     * @see [[TextElementGroupState]] construction.
     * @returns Tuple with the group state as first element and a boolean indicating whether the
     * state was found in cache (`true`) or newly created (`false`) as second element.
     */
    getOrSet(textElementGroup, tileKey, textElementFilter) {
        let groupState = this.get(textElementGroup);
        if (groupState !== undefined) {
            groupState.updateElements(textElementFilter);
            return [groupState, true];
        }
        groupState = new TextElementGroupState_1.TextElementGroupState(textElementGroup, tileKey, textElementFilter);
        this.set(textElementGroup, groupState);
        return [groupState, false];
    }
    get size() {
        return this.m_referenceMap.size;
    }
    /**
     * @hidden
     * @returns Size of internal cache for deduplication for debugging purposes.
     */
    get cacheSize() {
        return this.m_textMap.size;
    }
    /**
     * @returns All text element group states in the cache by group priority.
     */
    get sortedGroupStates() {
        if (this.m_sortedGroupStates === undefined) {
            this.m_sortedGroupStates = Array.from(this.m_referenceMap.values());
            this.m_sortedGroupStates.sort((a, b) => {
                return b.group.priority - a.group.priority;
            });
        }
        harp_utils_1.assert(this.m_referenceMap.size === this.m_sortedGroupStates.length);
        return this.m_sortedGroupStates;
    }
    /**
     * Updates state of all cached groups, discarding those that are not needed anymore.
     * @param time - The current time.
     * @param disableFading - `True` if fading is currently disabled, `false` otherwise.
     * @param findReplacements - `True` to replace each visible unvisited text element with a
     * visited duplicate.
     * @param zoomLevel - Current zoom level.
     * @returns `True` if any textElementGroup was evicted from cache, false otherwise.
     */
    update(time, disableFading, findReplacements, zoomLevel) {
        const replaceCallback = findReplacements
            ? this.replaceElement.bind(this, zoomLevel)
            : undefined;
        let anyEviction = false;
        for (const [key, groupState] of this.m_referenceMap.entries()) {
            if (groupState.visited) {
                groupState.updateFading(time, disableFading);
            }
            else {
                if (findReplacements) {
                    groupState.traverseVisibleElements(replaceCallback);
                }
                this.m_referenceMap.delete(key);
                this.m_sortedGroupStates = undefined;
                anyEviction = true;
            }
        }
        return anyEviction;
    }
    /**
     * Clears visited state for all text element groups in cache.
     */
    clearVisited() {
        for (const groupState of this.m_referenceMap.values()) {
            groupState.visited = false;
        }
    }
    clearTextCache() {
        this.m_textMap.clear();
    }
    /**
     * Clears the whole cache contents.
     */
    clear() {
        this.m_referenceMap.clear();
        this.m_sortedGroupStates = undefined;
        this.m_textMap.clear();
    }
    /**
     * Removes duplicates for a given text element.
     *
     * @param zoomLevel - Current zoom level.
     * @param elementState - State of the text element to deduplicate.
     * @returns True if it's the remaining element after deduplication, false if it's been marked
     * as duplicate.
     */
    deduplicateElement(zoomLevel, elementState) {
        const cacheResult = this.findDuplicate(elementState, zoomLevel);
        if (cacheResult === undefined) {
            // Text not found so far, add this element to cache.
            this.m_textMap.set(getCacheKey(elementState.element), [elementState]);
            return true;
        }
        if (cacheResult.index === -1) {
            // No duplicate found among elements with same text,add this one to cache.
            cacheResult.entries.push(elementState);
            return true;
        }
        // Duplicate found, check whether there's a label already visible and keep that one.
        const cachedDuplicate = cacheResult.entries[cacheResult.index];
        if (!cachedDuplicate.visible && elementState.visible) {
            // New label is visible, substitute the cached label.
            cacheResult.entries[cacheResult.index] = elementState;
            cachedDuplicate.reset();
            return true;
        }
        return false;
    }
    /**
     * Replaces a visible unvisited text element with a visited duplicate.
     * @param zoomLevel - Current zoom level.
     * @param elementState - State of the text element to deduplicate.
     * @returns `true` if an item from the cache has been reused and its state has been replaced,
     * `false` otherwise.
     */
    replaceElement(zoomLevel, elementState) {
        harp_utils_1.assert(elementState.visible);
        const cacheResult = this.findDuplicate(elementState, zoomLevel);
        if (cacheResult === undefined || cacheResult.index === -1) {
            // No replacement found;
            return false;
        }
        const replacement = cacheResult.entries[cacheResult.index];
        harp_utils_1.assert(!replacement.visible);
        replacement.replace(elementState);
        return true;
    }
    /**
     * Gets the state corresponding to a given text element group.
     * @param textElementGroup - The group of which the state will be obtained.
     * @returns The group state if cached, otherwise `undefined`.
     */
    get(textElementGroup) {
        const groupState = this.m_referenceMap.get(textElementGroup);
        if (groupState !== undefined) {
            groupState.visited = true;
        }
        return groupState;
    }
    /**
     * Sets a specified state for a given text element group.
     * @param textElementGroup -  The group of which the state will be set.
     * @param textElementGroupState - The state to set for the group.
     */
    set(textElementGroup, textElementGroupState) {
        harp_utils_1.assert(textElementGroup.elements.length > 0);
        this.m_referenceMap.set(textElementGroup, textElementGroupState);
        this.m_sortedGroupStates = undefined;
    }
    findDuplicate(elementState, zoomLevel) {
        // Point labels may have duplicates (as can path labels), Identify them
        // and keep the one we already display.
        const element = elementState.element;
        const cachedEntries = this.m_textMap.get(getCacheKey(element));
        if (cachedEntries === undefined) {
            // No labels found with the same key.
            return undefined;
        }
        tmpCachedDuplicate.entries = cachedEntries;
        const index = element.hasFeatureId()
            ? findDuplicateById(elementState, cachedEntries)
            : findDuplicateByText(elementState, cachedEntries, zoomLevel);
        if (index === undefined) {
            // Feature id collision, try finding duplicates using text as key.
            element.featureId = undefined;
            return this.findDuplicate(elementState, zoomLevel);
        }
        tmpCachedDuplicate.index = index;
        return tmpCachedDuplicate;
    }
}
exports.TextElementStateCache = TextElementStateCache;
export default exports
//# sourceMappingURL=TextElementStateCache.js.map