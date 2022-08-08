"use strict";
let exports = {}
exports.loadFontCatalog = void 0;
import * as harp_text_canvas_1 from "@here/harp-text-canvas"
import * as harp_utils_1 from "@here/harp-utils"
const logger = harp_utils_1.LoggerManager.instance.create("FontCatalogLoader");
async function loadFontCatalog(fontCatalogConfig, onSuccess, onError) {
    return await harp_text_canvas_1.FontCatalog.load(fontCatalogConfig.url, 1024)
        .then(onSuccess.bind(undefined, fontCatalogConfig.name))
        .catch((error) => {
        logger.error("Failed to load FontCatalog: ", fontCatalogConfig.name, error);
        if (onError) {
            onError(error);
        }
    });
}
exports.loadFontCatalog = loadFontCatalog;
export default exports
//# sourceMappingURL=FontCatalogLoader.js.map