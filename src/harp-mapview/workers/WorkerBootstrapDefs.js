"use strict";
/*
 * Copyright (C) 2019-2021 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
let exports = {}
exports.isWorkerBootstrapResponse = exports.isWorkerBootstrapRequest = void 0;
function isWorkerBootstrapRequest(message) {
    return (message &&
        message.type === "worker-bootstrap-request" &&
        Array.isArray(message.dependencies));
}
exports.isWorkerBootstrapRequest = isWorkerBootstrapRequest;
function isWorkerBootstrapResponse(message) {
    return (message &&
        message.type === "worker-bootstrap-response" &&
        Array.isArray(message.resolvedDependencies));
}
exports.isWorkerBootstrapResponse = isWorkerBootstrapResponse;

export default exports
//# sourceMappingURL=WorkerBootstrapDefs.js.map