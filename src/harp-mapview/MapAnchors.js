"use strict";
let exports = {}
exports.MapAnchors = void 0;
import harp_geoutils_1 from "@here/harp-geoutils"
import * as THREE from "three"
/**
 * Container holding [[MapAnchor]] objects.
 */
class MapAnchors {
    constructor() {
        this.m_anchors = [];
        this.m_priorities = [];
    }
    /**
     * All currently added [[MapAnchor]]s.
     */
    get children() {
        return this.m_anchors;
    }
    /**
     * Add a [[MapAnchor]].
     * @param mapAnchor [[MapAnchor]] instance to add.
     */
    add(mapAnchor) {
        this.m_anchors.push(mapAnchor);
    }
    /**
     * Remove a [[MapAnchor]].
     * @param mapAnchor - [[MapAnchor]] instance to remove.
     *
     * @note This method is potentially slow when removing a lot of anchors.
     * [[clear]]ing and [[add]]ing anchors should be considered in that case.
     */
    remove(mapAnchor) {
        const index = this.m_anchors.findIndex(element => element === mapAnchor);
        if (index > -1) {
            this.m_anchors.splice(index, 1);
        }
    }
    /**
     * Remove all [[MapAnchor]]s.
     */
    clear() {
        this.m_anchors.length = 0;
    }
    setPriorities(priorities) {
        this.m_priorities = priorities;
    }
    /**
     * Update the map anchors.
     * @param projection - Current projection
     * @param cameraPosition - Current camera position
     * @param rootNode - Node where normal anchors will be inserted.
     * @param overlayRootNode - Node where overlay anchors will be insterted.
     * @param priorities - Optional theme priority list
     *
     * @internal
     * @hidden
     */
    update(projection, cameraPosition, rootNode, overlayRootNode) {
        const worldPosition = new THREE.Vector3();
        this.m_anchors.forEach((mapAnchor) => {
            var _a;
            if (mapAnchor.styleSet !== undefined) {
                const priority = (_a = this.m_priorities) === null || _a === void 0 ? void 0 : _a.findIndex(entry => entry.group === mapAnchor.styleSet && entry.category === mapAnchor.category);
                if (priority !== undefined && priority !== -1) {
                    mapAnchor.renderOrder = (priority + 1) * 10;
                }
            }
            const anchor = mapAnchor.geoPosition !== undefined ? mapAnchor.geoPosition : mapAnchor.anchor;
            if (anchor !== undefined) {
                if (harp_geoutils_1.isVector3Like(anchor)) {
                    worldPosition.set(anchor.x, anchor.y, anchor.z);
                }
                else if (harp_geoutils_1.isGeoCoordinatesLike(anchor)) {
                    projection.projectPoint(anchor, worldPosition);
                }
                mapAnchor.position.copy(worldPosition).sub(cameraPosition);
            }
            if (mapAnchor.overlay === true) {
                overlayRootNode.add(mapAnchor);
            }
            else {
                rootNode.add(mapAnchor);
            }
        });
    }
}
exports.MapAnchors = MapAnchors;

export default exports
//# sourceMappingURL=MapAnchors.js.map