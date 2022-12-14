"use strict";
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UrlCopyrightProvider = void 0;
const harp_transfer_manager_1 = require("@here/harp-transfer-manager");
const CopyrightCoverageProvider_1 = require("./CopyrightCoverageProvider");
/**
 * Copyright provider which retrieves copyright coverage information from provided URL.
 */
class UrlCopyrightProvider extends CopyrightCoverageProvider_1.CopyrightCoverageProvider {
    /**
     * Default constructor.
     *
     * @param m_fetchURL - URL to fetch copyrights data from.
     * @param m_baseScheme - Scheme to get copyrights from.
     * @param m_requestHeaders - Optional request headers for requests(e.g. Authorization)
     */
    constructor(m_fetchURL, m_baseScheme, m_requestHeaders, m_transferManager = harp_transfer_manager_1.TransferManager.instance()) {
        super();
        this.m_fetchURL = m_fetchURL;
        this.m_baseScheme = m_baseScheme;
        this.m_requestHeaders = m_requestHeaders;
        this.m_transferManager = m_transferManager;
    }
    /**
     * Sets request headers.
     * @param headers -
     */
    setRequestHeaders(headers) {
        this.m_requestHeaders = headers;
    }
    /**
     * @inheritdoc
     * @override
     */
    getCopyrightCoverageData(abortSignal) {
        if (this.m_cachedCopyrightResponse !== undefined) {
            return this.m_cachedCopyrightResponse;
        }
        this.m_cachedCopyrightResponse = this.m_transferManager
            .downloadJson(this.m_fetchURL, {
            headers: this.m_requestHeaders,
            signal: abortSignal
        })
            .then(json => json[this.m_baseScheme])
            .catch(error => {
            this.logger.error(error);
            return [];
        });
        return this.m_cachedCopyrightResponse;
    }
}
exports.UrlCopyrightProvider = UrlCopyrightProvider;
//# sourceMappingURL=UrlCopyrightProvider.js.map