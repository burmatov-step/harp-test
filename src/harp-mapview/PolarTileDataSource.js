"use strict";
let exports = {}
exports.PolarTileDataSource = void 0;
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
import * as harp_datasource_protocol_1 from "@here/harp-datasource-protocol"
import * as index_decoder_1 from "@here/harp-datasource-protocol/index-decoder"
import * as harp_geoutils_1 from "@here/harp-geoutils"
import * as THREE from "three"
import DataSource_1 from "./DataSource"
import DecodedTileHelpers_1 from "./DecodedTileHelpers"
import MapObjectAdapter_1 from "./MapObjectAdapter"
import ThemeLoader_1 from "./ThemeLoader"
import Tile_1 from "./Tile"
/**
 * {@link DataSource} providing geometry for poles
 */
class PolarTileDataSource extends DataSource_1.DataSource {
    constructor({ name = "polar", styleSetName = "polar", minDataLevel, maxDataLevel, minDisplayLevel, maxDisplayLevel, storageLevelOffset = -2, geometryLevelOffset = 1, debugTiles = false }) {
        super({
            name,
            styleSetName,
            minDataLevel,
            maxDataLevel,
            minDisplayLevel,
            maxDisplayLevel,
            storageLevelOffset
        });
        this.m_tilingScheme = harp_geoutils_1.polarTilingScheme;
        this.m_maxLatitude = THREE.MathUtils.radToDeg(harp_geoutils_1.MercatorConstants.MAXIMUM_LATITUDE);
        this.m_geometryLevelOffset = geometryLevelOffset;
        this.m_debugTiles = debugTiles;
        this.cacheable = false;
        this.enablePicking = false;
    }
    /** @override */
    dispose() {
        if (this.m_northPoleEntry) {
            this.m_northPoleEntry.material.dispose();
            delete this.m_northPoleEntry;
        }
        if (this.m_southPoleEntry) {
            this.m_southPoleEntry.material.dispose();
            delete this.m_southPoleEntry;
        }
        if (this.m_styleSetEvaluator) {
            delete this.m_styleSetEvaluator;
        }
    }
    createTechiqueEntry(kind) {
        if (!this.m_styleSetEvaluator) {
            return undefined;
        }
        const env = new index_decoder_1.MapEnv({
            $geometryType: "polygon",
            $layer: "earth",
            kind
        });
        const techniques = this.m_styleSetEvaluator.getMatchingTechniques(env);
        if (techniques.length === 0) {
            return undefined;
        }
        const technique = techniques[0];
        const material = DecodedTileHelpers_1.createMaterial(this.mapView.renderer.capabilities, {
            technique,
            env: this.mapView.env
        });
        if (!material) {
            return undefined;
        }
        return { material, technique };
    }
    /** @override */
    async setTheme(theme) {
        // Seems superfluent, but the call to  ThemeLoader.load will resolve extends etc.
        theme = await ThemeLoader_1.ThemeLoader.load(theme);
        let styleSet;
        if (this.styleSetName !== undefined && theme.styles !== undefined) {
            styleSet = theme.styles[this.styleSetName];
        }
        this.m_styleSetEvaluator = new index_decoder_1.StyleSetEvaluator({
            styleSet: styleSet !== null && styleSet !== void 0 ? styleSet : [],
            definitions: theme.definitions,
            priorities: theme.priorities,
            labelPriorities: theme.labelPriorities
        });
        this.m_northPoleEntry = this.createTechiqueEntry("north_pole");
        this.m_southPoleEntry = this.createTechiqueEntry("south_pole");
        this.mapView.markTilesDirty(this);
    }
    /** @override */
    canGetTile(zoomLevel, tileKey) {
        if (zoomLevel !== tileKey.level || tileKey.level < 1) {
            return false;
        }
        const { north, south } = this.m_tilingScheme.getGeoBox(tileKey);
        return north > this.m_maxLatitude || south < -this.m_maxLatitude;
    }
    /** @override */
    shouldSubdivide(zoomLevel, tileKey) {
        if (zoomLevel <= tileKey.level) {
            return false;
        }
        const { north, south } = this.m_tilingScheme.getGeoBox(tileKey);
        return north > this.m_maxLatitude || south < -this.m_maxLatitude;
    }
    /** @override */
    getTilingScheme() {
        return this.m_tilingScheme;
    }
    /** @override */
    getTile(tileKey) {
        const tile = new Tile_1.Tile(this, tileKey);
        this.createTileGeometry(tile);
        return tile;
    }
    get geometryLevelOffset() {
        return this.m_geometryLevelOffset;
    }
    set geometryLevelOffset(geometryLevelOffset) {
        this.m_geometryLevelOffset = geometryLevelOffset;
    }
    intersectEdge(latitude, a, b) {
        const latA = a.latitude;
        const latB = b.latitude;
        let lonA = a.longitude;
        let lonB = b.longitude;
        if (Math.abs(latA) === 90) {
            lonA = lonB;
        }
        if (Math.abs(latB) === 90) {
            lonB = lonA;
        }
        const deltaLat = latB - latA;
        const deltaLon = lonB - lonA;
        const scale = (latitude - latA) / deltaLat;
        return new harp_geoutils_1.GeoCoordinates(latitude, lonA + deltaLon * scale, 0);
    }
    createTileGeometry(tile) {
        const { north, south } = tile.geoBox;
        const isNorthPole = north > 0 && south >= 0;
        const techniqueEntry = isNorthPole ? this.m_northPoleEntry : this.m_southPoleEntry;
        if (techniqueEntry === undefined) {
            tile.forceHasGeometry(true);
            return;
        }
        const srcProjection = this.m_tilingScheme.projection;
        const dstProjection = this.projection;
        const maxLat = this.m_maxLatitude;
        const poleLat = isNorthPole ? maxLat : -maxLat;
        const box = this.m_tilingScheme.boundingBoxGenerator.getWorldBox(tile.tileKey);
        const pBL = srcProjection.unprojectPoint(new THREE.Vector3(box.min.x, box.min.y, 0));
        const pBR = srcProjection.unprojectPoint(new THREE.Vector3(box.max.x, box.min.y, 0));
        const pTR = srcProjection.unprojectPoint(new THREE.Vector3(box.max.x, box.max.y, 0));
        const pTL = srcProjection.unprojectPoint(new THREE.Vector3(box.min.x, box.max.y, 0));
        let points;
        let needsGeometryCut = false;
        // special case where tile contains half of the hemisphere
        if (tile.tileKey.level === 1) {
            const isLeftHalf = box.min.x === 0;
            const poleX = isLeftHalf ? box.max.x : box.min.x;
            const poleY = (box.max.y + box.min.y) / 2;
            const pPole = srcProjection.unprojectPoint(new THREE.Vector3(poleX, poleY, 0));
            // coordinates are not used, needed for right position
            const pXX = isLeftHalf ? pBL : pBR;
            points = isNorthPole
                ? isLeftHalf
                    ? [pPole, pTR, pXX, pBR]
                    : [pPole, pBL, pXX, pTL]
                : isLeftHalf
                    ? [pPole, pBR, pXX, pTR]
                    : [pPole, pTL, pXX, pBL];
            needsGeometryCut = true;
        }
        else {
            // ccw for north, cw for south
            points = isNorthPole ? [pBL, pBR, pTR, pTL] : [pBL, pTL, pTR, pBR];
            const lats = points.map(p => p.latitude);
            const lmax = Math.max(...lats);
            const lmin = Math.min(...lats);
            const isAllPointsOut = isNorthPole ? lmax < poleLat : lmin > poleLat;
            if (isAllPointsOut) {
                return;
            }
            const isSomePointsOut = isNorthPole ? lmin < poleLat : lmax > poleLat;
            needsGeometryCut = isSomePointsOut;
            if (needsGeometryCut) {
                const nearest = lats.indexOf(isNorthPole ? lmax : lmin);
                if (nearest !== 0) {
                    for (let i = 0; i < nearest; i++) {
                        points.push(points.shift());
                    }
                }
            }
        }
        if (needsGeometryCut) {
            const centerX = (box.min.x + box.max.x) / 2;
            const centerY = (box.min.y + box.max.y) / 2;
            const center = srcProjection.unprojectPoint(new THREE.Vector3(centerX, centerY, 0));
            harp_geoutils_1.TransverseMercatorUtils.alignLongitude(points, center);
            // points aligned as follows:
            // a - nearest to the pole, always in
            // b - next to nearest
            // c - farthes from the pole, always out
            // d - prev from nearest
            const a = points[0];
            const b = points[1];
            const c = points[2];
            const d = points[3];
            const inPointB = Math.abs(b.latitude) >= maxLat;
            const inPointD = Math.abs(d.latitude) >= maxLat;
            const cutStart = inPointB
                ? this.intersectEdge(poleLat, b, c)
                : this.intersectEdge(poleLat, a, b);
            const cutEnd = inPointD
                ? this.intersectEdge(poleLat, d, c)
                : this.intersectEdge(poleLat, a, d);
            points.splice(inPointB ? 2 : 1, 4, cutStart);
            const level = tile.tileKey.level - this.storageLevelOffset + this.m_geometryLevelOffset;
            const subdivisions = 1 << Math.max(0, level);
            const step = 360 / subdivisions;
            const cutIndexStart = Math.floor((cutStart.longitude + 180) / step);
            const cutIndexEnd = Math.ceil((cutEnd.longitude + 180) / step);
            for (let i = cutIndexStart + 1; i < cutIndexEnd; i++) {
                points.push(new harp_geoutils_1.GeoCoordinates(poleLat, i * step - 180, 0));
            }
            points.push(cutEnd);
            if (inPointD) {
                points.push(d);
            }
        }
        const geometry = new THREE.BufferGeometry();
        const vertices = points.map(point => {
            const projected = dstProjection.projectPoint(point, new THREE.Vector3());
            projected.sub(tile.center);
            return projected;
        });
        geometry.setFromPoints(vertices);
        const indices = [];
        for (let i = 1; i < vertices.length - 1; i++) {
            isNorthPole ? indices.push(0, i, i + 1) : indices.push(0, i + 1, i);
        }
        geometry.setIndex(indices);
        const mesh = new THREE.Mesh(geometry, techniqueEntry.material);
        mesh.userData = {
            dataSource: this.name,
            tileKey: tile.tileKey
        };
        if (this.m_debugTiles) {
            const color = Math.round(Math.abs(Math.sin(11 * tile.tileKey.mortonCode())) * 0xffffff);
            mesh.material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5 });
            tile.objects.push(new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color, wireframe: true })));
        }
        MapObjectAdapter_1.MapObjectAdapter.create(mesh, {
            dataSource: this,
            technique: techniqueEntry.technique,
            kind: [isNorthPole ? harp_datasource_protocol_1.StandardGeometryKind.Water : harp_datasource_protocol_1.StandardGeometryKind.Background]
        });
        tile.objects.push(mesh);
    }
}
exports.PolarTileDataSource = PolarTileDataSource;

export default exports
//# sourceMappingURL=PolarTileDataSource.js.map