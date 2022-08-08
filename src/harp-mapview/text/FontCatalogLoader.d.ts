import { FontCatalogConfig } from "@here/harp-datasource-protocol";
import { FontCatalog } from "@here/harp-text-canvas";
declare type FontCatalogCallback = (name: string, catalog: FontCatalog) => void;
export declare function loadFontCatalog(fontCatalogConfig: FontCatalogConfig, onSuccess: FontCatalogCallback, onError?: (error: Error) => void): Promise<void>;
export {};
//# sourceMappingURL=FontCatalogLoader.d.ts.map