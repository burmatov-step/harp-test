"use strict";
let exports = {}
exports.VectorTileDataSource = void 0;
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
import * as harp_datasource_protocol_1 from "@here/harp-datasource-protocol"
import * as harp_geoutils_1 from "@here/harp-geoutils"
import harp_mapview_1 from "../harp-mapview/Tile"
import * as harp_mapview_decoder_1 from "@here/harp-mapview-decoder"
import * as harp_utils_1 from "@here/harp-utils"
import OmvDecoderDefs_1 from "./OmvDecoderDefs"
import OmvRestClient_1 from "./OmvRestClient"
const logger = harp_utils_1.LoggerManager.instance.create("VectorTileDataSource");

/**
 * A helper function to retrieve the [[DataProvider]] from the
 * {@link VectorTileDataSource}s parameters.
 *
 * @param params - The parameters passed into the OmvDataSource.
 */
function getDataProvider(params) {
    var _a;
    if (params.dataProvider) {
        return params.dataProvider;
    }
    else if ((_a = params.baseUrl) !== null && _a !== void 0 ? _a : params.url) {
        return new OmvRestClient_1.OmvRestClient(params);
    }
    else {
        throw new Error("OmvDataSource: missing url, baseUrl or dataProvider params");
    }
}
let missingOmvDecoderServiceInfoEmitted = false;
/**
 * The default vector tile service.
 */
const hereVectorTileBaseUrl = "https://vector.hereapi.com/v2/vectortiles/base/mc";
/**
 * Default options for the HERE Vector Tile service.
 */
const hereVectorTileDefaultOptions = {
    baseUrl: hereVectorTileBaseUrl,
    apiFormat: OmvRestClient_1.APIFormat.XYZOMV,
    styleSetName: "tilezen",
    authenticationMethod: {
        method: OmvRestClient_1.AuthenticationMethod.QueryString,
        name: "apikey"
    },
    copyrightInfo: [
        {
            id: "here.com",
            year: new Date().getFullYear(),
            label: "HERE",
            link: "https://legal.here.com/terms"
        }
    ]
};
const defaultOptions = new Map([
    [hereVectorTileBaseUrl, hereVectorTileDefaultOptions]
]);
/**
 * Tests if the given object has custom data provider.
 * @param object -
 */
function hasCustomDataProvider(object) {
    return object.dataProvider !== undefined;
}
/**
 * Add service specific default values.
 *
 * @param params - The configuration settings of the data source.
 */
function completeDataSourceParameters(params) {
    var _a;
    if (!hasCustomDataProvider(params) && params.url === undefined) {
        const baseUrl = (_a = params.baseUrl) !== null && _a !== void 0 ? _a : hereVectorTileBaseUrl;
        const completedParams = Object.assign(Object.assign({}, defaultOptions.get(baseUrl)), params);
        return Object.assign(Object.assign({}, completedParams), { tilingScheme: harp_geoutils_1.webMercatorTilingScheme, dataProvider: new OmvRestClient_1.OmvRestClient(completedParams) });
    }
    return Object.assign(Object.assign({}, params), { tilingScheme: harp_geoutils_1.webMercatorTilingScheme, dataProvider: getDataProvider(params) });
}
/**
 * `VectorTileDataSource` is used for the visualization of vector tiles.
 *
 * @example
 * ```typescript
 *    const dataSource = new VectorTileDataSource({
 *        baseUrl: "https://vector.hereapi.com/v2/vectortiles/base/mc",
 *        authenticationCode: apikey
 *    });
 *    mapView.addDataSource(dataSource);
 *   ```
 */
class VectorTileDataSource extends harp_mapview_decoder_1.TileDataSource {
    constructor(m_params) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        super((_a = m_params.tileFactory) !== null && _a !== void 0 ? _a : new harp_mapview_decoder_1.TileFactory(harp_mapview_1.Tile), Object.assign({ styleSetName: (_b = m_params.styleSetName) !== null && _b !== void 0 ? _b : "omv", concurrentDecoderServiceName: (_c = m_params.concurrentDecoderServiceName) !== null && _c !== void 0 ? _c : OmvDecoderDefs_1.VECTOR_TILE_DECODER_SERVICE_TYPE, minDataLevel: (_d = m_params.minDataLevel) !== null && _d !== void 0 ? _d : 1, maxDataLevel: (_e = m_params.maxDataLevel) !== null && _e !== void 0 ? _e : 17, storageLevelOffset: (_f = m_params.storageLevelOffset) !== null && _f !== void 0 ? _f : -1 }, completeDataSourceParameters(m_params)));
        this.m_params = m_params;
        this.cacheable = true;
        this.addGroundPlane =
            m_params.addGroundPlane === undefined || m_params.addGroundPlane === true;
        let roundUpCoordinatesIfNeeded = m_params.roundUpCoordinatesIfNeeded;
        if (roundUpCoordinatesIfNeeded === undefined &&
            ((_g = m_params) === null || _g === void 0 ? void 0 : _g.baseUrl) === hereVectorTileBaseUrl) {
            roundUpCoordinatesIfNeeded = true;
        }
        this.m_decoderOptions = {
            showMissingTechniques: this.m_params.showMissingTechniques === true,
            filterDescription: this.m_params.filterDescr,
            gatherFeatureAttributes: this.m_params.gatherFeatureAttributes === true,
            featureModifiers: this.m_params.featureModifierId
                ? [this.m_params.featureModifierId]
                : undefined,
            politicalView: this.m_params.politicalView,
            skipShortLabels: this.m_params.skipShortLabels,
            storageLevelOffset: (_h = m_params.storageLevelOffset) !== null && _h !== void 0 ? _h : -1,
            enableElevationOverlay: this.m_params.enableElevationOverlay === true,
            roundUpCoordinatesIfNeeded
        };
        this.maxGeometryHeight = harp_utils_1.getOptionValue(m_params.maxGeometryHeight, harp_geoutils_1.EarthConstants.MAX_BUILDING_HEIGHT);
        this.minGeometryHeight = harp_utils_1.getOptionValue(m_params.minGeometryHeight, 0);
    }
    /** @override */
    async connect() {
        try {
            await super.connect();
        }
        catch (error) {
            // error is a string if the promise was rejected.
            if (error.message &&
                harp_datasource_protocol_1.WorkerServiceProtocol.isUnknownServiceError(error) &&
                !missingOmvDecoderServiceInfoEmitted) {
                logger.info("Unable to create decoder service in worker. Use " +
                    " 'OmvTileDecoderService.start();' in decoder script.");
                missingOmvDecoderServiceInfoEmitted = true;
            }
            throw typeof error === "string" ? new Error(error) : error;
        }
        this.configureDecoder(undefined, this.m_decoderOptions);
    }
    /**
     * Remove the current data filter.
     * Will be applied to the decoder, which might be shared with other omv datasources.
     */
    removeDataFilter() {
        this.configureDecoder(undefined, {
            filterDescription: null
        });
    }
    /**
     * Set a new data filter. Can also be done during
     * the creation of an {@link VectorTileDataSource}.
     * Will be applied to the decoder, which might be shared with other omv datasources.
     *
     * @param filterDescription - Data filter description created with
     * [[OmvFeatureFilterDescriptionBuilder]].
     */
    setDataFilter(filterDescription) {
        this.m_decoderOptions.filterDescription =
            filterDescription !== null ? filterDescription : undefined;
        this.configureDecoder(undefined, {
            filterDescription,
            featureModifiers: this.m_decoderOptions.featureModifiers,
            politicalView: this.m_decoderOptions.politicalView
        });
    }
    /** @override */
    shouldPreloadTiles() {
        return true;
    }
    /** @override */
    setPoliticalView(politicalView) {
        // Just in case users mess with letters' casing.
        politicalView = politicalView === null || politicalView === void 0 ? void 0 : politicalView.toLowerCase();
        if (this.m_decoderOptions.politicalView !== politicalView) {
            this.m_decoderOptions.politicalView = politicalView;
            this.configureDecoder(undefined, {
                filterDescription: this.m_decoderOptions.filterDescription,
                featureModifiers: this.m_decoderOptions.featureModifiers,
                politicalView: politicalView !== undefined ? politicalView : ""
            });
        }
    }
    /** @override */
    get storageLevelOffset() {
        return super.storageLevelOffset;
    }
    /** @override */
    set storageLevelOffset(levelOffset) {
        super.storageLevelOffset = levelOffset;
        this.m_decoderOptions.storageLevelOffset = this.storageLevelOffset;
        this.configureDecoder(undefined, {
            storageLevelOffset: this.storageLevelOffset
        });
    }
    /** @override */
    setEnableElevationOverlay(enable) {
        if (this.m_decoderOptions.enableElevationOverlay !== enable) {
            this.m_decoderOptions.enableElevationOverlay = enable;
            this.configureDecoder(undefined, {
                enableElevationOverlay: enable
            });
        }
    }
    configureDecoder(options, customOptions) {
        this.clearCache();
        this.decoder.configure(options, customOptions);
        this.mapView.markTilesDirty(this);
    }
}
exports.VectorTileDataSource = VectorTileDataSource;
//# sourceMappingURL=VectorTileDataSource.js.map

export default exports