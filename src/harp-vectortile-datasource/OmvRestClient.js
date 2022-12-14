"use strict";
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.OmvRestClient = exports.AuthenticationTypeAccessToken = exports.AuthenticationTypeTomTomV1 = exports.AuthenticationTypeBearer = exports.AuthenticationMethod = exports.APIFormat = void 0;
import * as harp_mapview_decoder_1 from "@here/harp-mapview-decoder"
import * as harp_transfer_manager_1 from "@here/harp-transfer-manager"
import * as harp_utils_1 from "@here/harp-utils"
const logger = harp_utils_1.LoggerManager.instance.create("OmvRestClient");
var APIFormat;
(function (APIFormat) {
    /**
     * Use the REST API format of HERE Vector Tiles Server component version 1.
     *
     * @remarks
     * Documentation:
     *  https://developer.here.com/documentation/vector-tiles-api/dev_guide/index.html
     *
     * Usage:
     *
     *     <OmvRestClientParams.baseUrl>/<zoom>/<X>/<Y>/omv
     *
     * If [[OmvRestClientParams.authenticationToken]] is provided, it will be added as HTTP header:
     *
     *     Authorization: Bearer $authenticationToken
     *
     * Format definition:
     * `//http|s://<base-url>/{API version}/{layers}/{projection}/{z}/{x}/{y}/{format}`
     *
     * Default authentication method used: [[AuthenticationTypeBearer]].
     */
    APIFormat[APIFormat["HereV1"] = 0] = "HereV1";
    /**
     * Use the REST API format of Mapbox Vector Tile API v4.
     *
     * @remarks
     * Usage:
     * `<OmvRestClientParams.baseUrl>/<zoom>/<X>/<Y>.mvt?access_token=<OmvRestClientParams.authenticationCode>`
     *
     * Format definition:
     * `http|s://<base-url>/v4/{map_id}/{z}/{x}/{y}{@2x}.{format}?[style]&access_token={access_token}`
     *
     * Sample URL:
     * `http://a.tiles.mapbox.com/v4/mapbox.mapbox-streets-v7/14/4823/6160.mvt?access_token=your-mapbox-access-token`
     *
     * Default authentication method used: [[AuthenticationTypeAccessToken]].
     */
    APIFormat[APIFormat["MapboxV4"] = 1] = "MapboxV4";
    /**
     * Use the REST API format of XYZ Vector Tile API in MVT format.
     *
     * @remarks
     * Usage:
     * `<OmvRestClientParams.baseUrl>/tiles/omsbase/256/<zoom>/<X>/<Y>.mvt?access_token=<OmvRestClientParams.authenticationCode>`
     *
     * Format definition:
     * `http|s://<base-url>/tiles/{layers}/{z}/{x}/{y}/{format}?access_token={access_token}`
     *
     * Sample URL:
     * `https://xyz.api.here.com/tiles/osmbase/256/all/16/19293/24641.mvt?access_token=your-xyz-access-token`
     *
     * Default authentication method used: [[AuthenticationTypeAccessToken]].
     */
    APIFormat[APIFormat["XYZMVT"] = 2] = "XYZMVT";
    /**
     * Use the REST API format of XYZ Vector Tile API in JSON format.
     *
     * @remarks
     * Usage:
     * `<OmvRestClientParams.baseUrl>/tiles/omsbase/256/<zoom>/<X>/<Y>.mvt?access_token=<OmvRestClientParams.authenticationCode>`
     *
     * Format definition:
     * `http|s://<base-url>/tiles/{layers}/{z}/{x}/{y}/{format}?access_token={access_token}`
     *
     * Sample URL:
     * `https://xyz.api.here.com/tiles/osmbase/256/all/16/19293/24641.json?access_token=your-xyz-api-key`
     *
     * Default authentication method used: [[AuthenticationTypeAccessToken]].
     */
    APIFormat[APIFormat["XYZJson"] = 3] = "XYZJson";
    /**
     * Use the REST API format of XYZ Vector Tile API in OMV format.
     *
     * @remarks
     * Usage:
     * `<OmvRestClientParams.baseUrl>/tiles/herebase.02/<zoom>/<X>/<Y>/omv?access_token=<OmvRestClientParams.authenticationCode>`
     *
     * Format definition:
     * `http|s://<base-url>/tiles/herebase.02/{z}/{x}/{y}/{format}?access_token={access_token}`
     *
     * Sample URL:
     * `https://xyz.api.here.com/tiles/herebase.02/14/2649/6338/omv?access_token=your-xyz-access-token`
     *
     * Default authentication method used: [[AuthenticationTypeAccessToken]].
     */
    APIFormat[APIFormat["XYZOMV"] = 4] = "XYZOMV";
    /**
     * Use the REST API format of Tomtoms Vector Tile API v1.
     *
     * @remarks
     * Usage:
     * `<OmvRestClientParams.baseUrl>/<zoom>/<X>/<Y>.pbf?key=<OmvRestClientParams.authenticationCode>`
     *
     * Format definition:
     * `<http|https>://<baseURL>/map/<versionNumber>/tile/<layer>/<style>/<zoom>/<X>/<Y>.<format>?key=<apiKey>[&view=<view>][&language=<language>]`
     *
     * Sample URL:
     * `http://api.tomtom.com/map/1/tile/basic/main/0/0/0.pbf?key=<apiKey>`
     *
     * Default authentication method used: [[AuthenticationTypeTomTomV1]].
     */
    APIFormat[APIFormat["TomtomV1"] = 5] = "TomtomV1";
    /**
     * Use the REST API format of XYZ Space Vector Tile API in OMV format.
     *
     * @remarks
     * Usage:
     * `<OmvRestClientParams.baseUrl>/hub/spaces/<space-id>/tile/web/<zoom>_<X>_<Y>.mvt?access_token=<OmvRestClientParams.authenticationCode>`
     *
     * Format definition:
     * `http|s://<base-url>/hub/spaces/{spaceId}/tile/web/{z}_{x}_{y}.mvt?access_token={access_token}`
     *
     * Sample URL:
     * `https://xyz.api.here.com/hub/spaces/your-space-id/tile/web/{z}_{x}_{y}.mvt?access_token=your-access-token`
     *
     * Default authentication method used: [[AuthenticationTypeAccessToken]].
     */
    APIFormat[APIFormat["XYZSpace"] = 6] = "XYZSpace";
})(APIFormat = exports.APIFormat || (exports.APIFormat = {}));
var AuthenticationMethod;
(function (AuthenticationMethod) {
    AuthenticationMethod[AuthenticationMethod["QueryString"] = 0] = "QueryString";
    AuthenticationMethod[AuthenticationMethod["AuthorizationHeader"] = 1] = "AuthorizationHeader";
})(AuthenticationMethod = exports.AuthenticationMethod || (exports.AuthenticationMethod = {}));
/**
 * Authentication method, where token will be provided as HTTP Header:
 *
 *    Authorization: Bearer $authenticationToken
 */
exports.AuthenticationTypeBearer = {
    method: AuthenticationMethod.AuthorizationHeader,
    name: "Bearer"
};
/**
 * TomTomV1 API compatible authorization method, where token will be provided as HTTP Header:
 *
 *    Authorization: Bearer $authenticationToken
 */
exports.AuthenticationTypeTomTomV1 = {
    method: AuthenticationMethod.QueryString,
    name: "key"
};
exports.AuthenticationTypeAccessToken = {
    method: AuthenticationMethod.QueryString,
    name: "access_token"
};
/**
 * REST client supporting getting protobuf OMV Tile from REST-based servers.
 */
class OmvRestClient extends harp_mapview_decoder_1.DataProvider {
    constructor(params) {
        super();
        this.params = params;
        this.downloadManager =
            params.downloadManager === undefined
                ? harp_transfer_manager_1.TransferManager.instance()
                : params.downloadManager;
        this.urlParams = params.urlParams === undefined ? {} : params.urlParams;
    }
    /** Overriding abstract method, in this case doing nothing. */
    async connect() {
        // not needed
    }
    /** Overriding abstract method, in this case always returning `true`. */
    ready() {
        return true;
    }
    /**
     * Asynchronously fetches a tile from this restful server.
     *
     * @remarks
     * **Note:** In case of an HTTP Error, rejected promise is returned
     * with an error.
     *
     * @example
     * ```typescript
     * const response = layer.getTile(tileKey);
     * if (!response.ok) {
     *     // a network error happened
     *     console.error("Unable to download tile", response.statusText);
     *     return;
     * }
     *
     * // the response is ok and contains data, access it e.g. as arrayBuffer:
     * const payload = await response.arrayBuffer();
     * ```
     *
     * @param tileKey - The tile key of the tile.
     * @param tileRequestInit - Optional request options to be passed to fetch when downloading a
     * tile.
     * @returns A `Promise` of the HTTP response that contains the payload of the requested tile.
     */
    async getTile(tileKey, abortSignal) {
        const init = { signal: abortSignal };
        let tileUrl = this.dataUrl(tileKey);
        const authenticationCode = await this.getActualAuthenticationCode();
        tileUrl = this.applyAuthCode(tileUrl, init, authenticationCode);
        tileUrl = this.addQueryParams(tileUrl, this.urlParams);
        if (this.params.apiFormat === APIFormat.XYZJson) {
            return await this.downloadManager.downloadJson(tileUrl, init);
        }
        return await this.downloadManager.downloadArrayBuffer(tileUrl, init);
    }
    /**
     * Destroys this `OmvRestClient`.
     */
    dispose() {
        // to be overloaded by subclasses
    }
    /**
     * Get actual authentication code/token for this request according to configuration.
     */
    async getActualAuthenticationCode() {
        if (typeof this.params.authenticationCode === "string") {
            return this.params.authenticationCode;
        }
        else if (this.params.authenticationCode !== undefined) {
            return await this.params.authenticationCode();
        }
        else if (this.params.getBearerToken !== undefined) {
            return await this.params.getBearerToken();
        }
        else {
            return undefined;
        }
    }
    /**
     * Get default authentication method basing on apiFormat and other params.
     */
    getDefaultAuthMethod() {
        if (this.params.getBearerToken !== undefined) {
            return exports.AuthenticationTypeBearer;
        }
        switch (this.params.apiFormat) {
            case APIFormat.HereV1:
                return exports.AuthenticationTypeBearer;
            case APIFormat.MapboxV4:
            case APIFormat.XYZOMV:
            case APIFormat.XYZMVT:
            case APIFormat.XYZSpace:
            case APIFormat.XYZJson:
                return exports.AuthenticationTypeAccessToken;
            case APIFormat.TomtomV1:
                return exports.AuthenticationTypeTomTomV1;
            default:
                logger.warn(`#getDefaultAuthMethod: Not supported API format: ${this.params.apiFormat}`);
                return undefined;
        }
    }
    /**
     * Apply authentication code/token using configured (or default) authentication method.
     *
     * @param url -
     * @param init - request extra data
     * @param authenticationCode - authentication/token to be applied
     * @return new url to be used
     */
    applyAuthCode(url, init, authenticationCode) {
        var _a, _b, _c;
        if (authenticationCode === undefined) {
            return url;
        }
        const authMethod = (_a = this.params.authenticationMethod) !== null && _a !== void 0 ? _a : this.getDefaultAuthMethod();
        if (authMethod === undefined) {
            return url;
        }
        if (authMethod.method === AuthenticationMethod.AuthorizationHeader) {
            if (init.headers === undefined) {
                init.headers = new Headers();
            }
            const authType = (_b = authMethod.name) !== null && _b !== void 0 ? _b : "Bearer";
            init.headers.append("Authorization", `${authType} ${authenticationCode}`);
        }
        else if (authMethod.method === AuthenticationMethod.QueryString) {
            const attrName = (_c = authMethod.name) !== null && _c !== void 0 ? _c : "access_token";
            const authParams = {};
            authParams[attrName] = authenticationCode;
            url = this.addQueryParams(url, authParams);
        }
        return url;
    }
    /**
     * Get actual tile URL depending on configured API format.
     */
    dataUrl(tileKey) {
        if (this.params.url !== undefined) {
            return this.params.url
                .replace("{x}", String(tileKey.column))
                .replace("{y}", String(tileKey.row))
                .replace("{z}", String(tileKey.level));
        }
        let path = [`/${tileKey.level}`, tileKey.column, tileKey.row].join(this.params.apiFormat === APIFormat.XYZSpace ||
            this.params.apiFormat === APIFormat.XYZJson
            ? "_"
            : "/");
        switch (this.params.apiFormat) {
            case APIFormat.HereV1:
            case APIFormat.XYZOMV:
                path += "/omv";
                break;
            case APIFormat.MapboxV4:
                path += ".mvt";
                break;
            case APIFormat.XYZMVT:
                path += ".mvt";
                break;
            case APIFormat.XYZJson:
                break;
            case APIFormat.XYZSpace:
                path += ".mvt";
                break;
            case APIFormat.TomtomV1:
                path += ".pbf";
                break;
            default:
                logger.warn(`Not supported API format: ${this.params.apiFormat}`);
                break;
        }
        return this.params.baseUrl + path;
    }
    addQueryParams(url, queryParams) {
        let queryString = "";
        let sep = url.includes("?") ? "&" : "?";
        for (const prop in queryParams) {
            if (!queryParams.hasOwnProperty(prop)) {
                continue;
            }
            queryString += `${sep}${encodeURIComponent(prop)}=${encodeURIComponent(queryParams[prop])}`;
            if (sep === "?") {
                sep = "&";
            }
        }
        return url + queryString;
    }
}
exports.OmvRestClient = OmvRestClient;
//# sourceMappingURL=OmvRestClient.js.map
export default exports