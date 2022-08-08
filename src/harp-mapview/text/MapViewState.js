"use strict";
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.MapViewState = void 0;
import  * as THREE from "three"
/**
 * View state obtained from a MapView instance.
 */
class MapViewState {
    constructor(m_mapView, m_renderedTilesChangeCheck) {
        this.m_mapView = m_mapView;
        this.m_renderedTilesChangeCheck = m_renderedTilesChangeCheck;
        this.m_lookAtVector = new THREE.Vector3();
    }
    get worldCenter() {
        return this.m_mapView.worldCenter;
    }
    get cameraIsMoving() {
        return this.m_mapView.cameraIsMoving;
    }
    get maxVisibilityDist() {
        return this.m_mapView.viewRanges.maximum;
    }
    get zoomLevel() {
        return this.m_mapView.zoomLevel;
    }
    get env() {
        return this.m_mapView.env;
    }
    get frameNumber() {
        return this.m_mapView.frameNumber;
    }
    get lookAtVector() {
        return this.m_mapView.camera.getWorldDirection(this.m_lookAtVector);
    }
    get lookAtDistance() {
        return this.m_mapView.targetDistance;
    }
    get isDynamic() {
        return this.m_mapView.isDynamicFrame;
    }
    get hiddenGeometryKinds() {
        return this.m_mapView.tileGeometryManager === undefined
            ? undefined
            : this.m_mapView.tileGeometryManager.hiddenGeometryKinds;
    }
    get renderedTilesChanged() {
        return this.m_renderedTilesChangeCheck();
    }
    get projection() {
        return this.m_mapView.projection;
    }
    get elevationProvider() {
        return this.m_mapView.elevationProvider;
    }
}
exports.MapViewState = MapViewState;
//# sourceMappingURL=MapViewState.js.map

export default exports