"use strict";
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TileDataAccessor = void 0;
const harp_datasource_protocol_1 = require("@here/harp-datasource-protocol");
const harp_utils_1 = require("@here/harp-utils");
const TileGeometry_1 = require("./TileGeometry");
const logger = harp_utils_1.LoggerManager.instance.create("TileDataAccessor");
/**
 * An accessor for all geometries in a tile.
 *
 * @remarks
 * This class uses a client-provided {@link ITileDataVisitor}
 * to visit all objects, based on filtering options specified
 * by both, the `TileDataAccessor` and
 * the visitor itself.
 */
class TileDataAccessor {
    /**
     * Constructs a `TileDataAccessor` instance.
     *
     * @param tile - The tile to access.
     * @param visitor - The visitor.
     * @param options - Options for the tile.
     */
    constructor(tile, visitor, options) {
        this.tile = tile;
        this.visitor = visitor;
        const wantsAll = options.wantsAll === true;
        this.m_wantsPoints = wantsAll || !(options.wantsPoints === false);
        this.m_wantsLines = wantsAll || !(options.wantsLines === false);
        this.m_wantsAreas = wantsAll || !(options.wantsAreas === false);
        this.m_wantsObject3D = wantsAll || !(options.wantsObject3D === false);
    }
    /**
     * Calls the visitor on all objects in the tile.
     */
    visitAll() {
        const objects = this.tile.objects;
        for (const object of objects) {
            this.visitObject(object);
        }
    }
    /**
     * Visits a single object. This function should normally be called during visiting.
     *
     * @param object - The object to visit.
     */
    visitObject(object) {
        const featureData = object.userData !== undefined
            ? object.userData.feature
            : undefined;
        // early opt out if there is no feature data, or if the feature data has only a single id
        // and the visitor wants to ignore that featureId
        if (featureData === undefined ||
            (featureData.objInfos !== undefined &&
                featureData.objInfos.length === 1 &&
                !this.visitor.wantsFeature(harp_datasource_protocol_1.getFeatureId(featureData.objInfos[0])))) {
            return;
        }
        const geometryType = featureData.geometryType;
        if (geometryType === undefined) {
            logger.warn("#visitObject: visiting object failed, no geometryType", object);
            return;
        }
        harp_utils_1.assert(featureData.objInfos !== undefined, "featureData.ids missing");
        harp_utils_1.assert(featureData.starts !== undefined, "featureData.starts missing");
        harp_utils_1.assert(Array.isArray(featureData.starts), "featureData.starts is not an array");
        if (featureData.objInfos !== undefined && featureData.starts !== undefined) {
            harp_utils_1.assert(featureData.objInfos.length === featureData.starts.length, "featureData.ids and featureData.starts have unequal length");
        }
        switch (geometryType) {
            case harp_datasource_protocol_1.GeometryType.Point:
            case harp_datasource_protocol_1.GeometryType.Text:
                if (!this.m_wantsPoints) {
                    return;
                }
                break;
            case harp_datasource_protocol_1.GeometryType.SolidLine:
            case harp_datasource_protocol_1.GeometryType.ExtrudedLine:
            case harp_datasource_protocol_1.GeometryType.TextPath:
                if (!this.m_wantsLines) {
                    return;
                }
                break;
            case harp_datasource_protocol_1.GeometryType.Polygon:
            case harp_datasource_protocol_1.GeometryType.ExtrudedPolygon:
                if (!this.m_wantsAreas) {
                    return;
                }
                break;
            case harp_datasource_protocol_1.GeometryType.Object3D:
                if (!this.m_wantsObject3D) {
                    return;
                }
                break;
            default:
                logger.warn("#visitObject: invalid geometryType");
        }
        if (object.type !== "Mesh") {
            logger.warn("#visitObject: visiting object failed, not of type 'Mesh'", object);
            return;
        }
        const mesh = object;
        this.visitMesh(mesh, featureData);
    }
    /**
     * Gets the `BufferGeometry` from the specified object. This function requires the
     * attribute `position` in `BufferGeometry` to be set.
     *
     * @param object - The object from which to get the geometry.
     * @returns the geometry of the object, or `undefined`.
     */
    getBufferGeometry(object) {
        const geometry = object.geometry;
        if (geometry.type !== "BufferGeometry") {
            logger.warn("#visitObject: object does not have BufferGeometry");
            return undefined;
        }
        const bufferGeometry = geometry;
        // we know its a BufferAttribute because it is a BufferGeometry
        const position = bufferGeometry.getAttribute("position");
        if (!position) {
            logger.warn("#visitLines: BufferGeometry has no position attribute");
            return undefined;
        }
        return bufferGeometry;
    }
    /**
     * Obtains an accessor for the nonindexed geometry. This function may return `undefined`
     * if the accessor is not implemented.
     *
     * @param geometryType - The type of geometry.
     * @param object - The object for which to access the attributes and geometry.
     * @param bufferGeometry - The object's `BufferGeometry`.
     * @returns an accessor for a specified object, if available.
     */
    getGeometryAccessor(geometryType, object, bufferGeometry) {
        switch (geometryType) {
            case harp_datasource_protocol_1.GeometryType.Point:
            case harp_datasource_protocol_1.GeometryType.Text:
                // return new RoBufferedGeometryLineAccessor(object, geometryType, bufferGeometry);
                return undefined;
            case harp_datasource_protocol_1.GeometryType.SolidLine:
            case harp_datasource_protocol_1.GeometryType.ExtrudedLine:
            case harp_datasource_protocol_1.GeometryType.TextPath:
                return new TileGeometry_1.BufferedGeometryLineAccessor(object, geometryType, bufferGeometry);
            case harp_datasource_protocol_1.GeometryType.Polygon:
            case harp_datasource_protocol_1.GeometryType.ExtrudedPolygon:
                // return new RoBufferedGeometryLineAccessor(object, geometryType, bufferGeometry);
                return undefined;
            case harp_datasource_protocol_1.GeometryType.Object3D:
                return new TileGeometry_1.BufferedGeometryObject3dAccessor(object, geometryType, bufferGeometry);
            default:
                logger.warn("#getGeometryAccessor: invalid geometryType");
        }
        return undefined;
    }
    /**
     * Obtains an accessor for the indexed geometry. This function may return `undefined`
     * if the accessor is not implemented.
     *
     * @param geometryType - The type of geometry.
     * @param object - The object for which to access the attributes and geometry.
     * @param bufferGeometry - The object's `BufferGeometry`.
     * @returns an accessor for a specified object, if available.
     */
    getIndexedGeometryAccessor(geometryType, object, bufferGeometry) {
        switch (geometryType) {
            case harp_datasource_protocol_1.GeometryType.Point:
            case harp_datasource_protocol_1.GeometryType.Text:
                // return new RoBufferedGeometryLineAccessor(object, geometryType, bufferGeometry);
                return undefined;
            case harp_datasource_protocol_1.GeometryType.SolidLine:
            case harp_datasource_protocol_1.GeometryType.ExtrudedLine:
            case harp_datasource_protocol_1.GeometryType.TextPath:
                return new TileGeometry_1.IndexedBufferedGeometryLineAccessor(object, geometryType, bufferGeometry);
            case harp_datasource_protocol_1.GeometryType.Polygon:
            case harp_datasource_protocol_1.GeometryType.ExtrudedPolygon:
                // return new RoBufferedGeometryLineAccessor(object, geometryType, bufferGeometry);
                return undefined;
            case harp_datasource_protocol_1.GeometryType.Object3D:
                // return new RoBufferedGeometryLineAccessor(object, geometryType, bufferGeometry);
                return undefined;
            default:
                logger.warn("#getIndexedGeometryAccessor: invalid geometryType");
        }
        return undefined;
    }
    /**
     * Visit the object.
     *
     * @param meshObject - Object of type `Mesh`.
     * @param featureData - Dataset stored along with the object.
     */
    visitMesh(meshObject, featureData) {
        const { objInfos, starts } = featureData;
        const geometryType = featureData.geometryType;
        // make linter happy: we already know that these both are valid
        if (objInfos === undefined || starts === undefined || geometryType === undefined) {
            return;
        }
        let geometryAccessor;
        for (let featureIndex = 0; featureIndex < objInfos.length; featureIndex++) {
            const featureId = harp_datasource_protocol_1.getFeatureId(objInfos[featureIndex]);
            if (!this.visitor.wantsFeature(featureId)) {
                continue;
            }
            const featureStart = starts[featureIndex];
            let featureEnd = -1;
            // lazy creation of accessor, in case featureId was not wanted...
            if (geometryAccessor === undefined) {
                const bufferGeometry = this.getBufferGeometry(meshObject);
                if (bufferGeometry === undefined) {
                    continue;
                }
                if (bufferGeometry.index !== null) {
                    geometryAccessor = this.getIndexedGeometryAccessor(geometryType, meshObject, bufferGeometry);
                }
                else {
                    geometryAccessor = this.getGeometryAccessor(geometryType, meshObject, bufferGeometry);
                }
                if (geometryAccessor === undefined) {
                    logger.warn("#visitObject: no accessor geometryType", geometryType);
                    continue;
                }
            }
            featureEnd =
                featureIndex < starts.length - 1
                    ? starts[featureIndex + 1]
                    : geometryAccessor.getCount();
            // setup/update the accessor for the new range of the object
            geometryAccessor.setRange(featureStart, featureEnd);
            switch (geometryType) {
                case harp_datasource_protocol_1.GeometryType.Point:
                case harp_datasource_protocol_1.GeometryType.Text:
                    this.visitor.visitPoint(featureId);
                    break;
                case harp_datasource_protocol_1.GeometryType.SolidLine:
                case harp_datasource_protocol_1.GeometryType.ExtrudedLine:
                case harp_datasource_protocol_1.GeometryType.TextPath:
                    harp_utils_1.assert(TileGeometry_1.isLineAccessor(geometryAccessor));
                    this.visitor.visitLine(featureId, geometryAccessor);
                    break;
                case harp_datasource_protocol_1.GeometryType.Polygon:
                case harp_datasource_protocol_1.GeometryType.ExtrudedPolygon:
                    this.visitor.visitArea(featureId);
                    break;
                case harp_datasource_protocol_1.GeometryType.Object3D:
                    harp_utils_1.assert(TileGeometry_1.isObject3dAccessor(geometryAccessor));
                    this.visitor.visitObject3D(featureId, geometryAccessor);
                    break;
                default:
                    logger.warn("#visitObject: invalid geometryType");
            }
        }
    }
}
exports.TileDataAccessor = TileDataAccessor;
//# sourceMappingURL=TileDataAccessor.js.map