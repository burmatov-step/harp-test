import { GeometryKind, GeometryKindSet, ImageTexture, LineMarkerTechnique, PoiStackMode, PoiTechnique } from "@here/harp-datasource-protocol";
import { GlyphData, TextBufferObject, TextLayoutParameters, TextLayoutStyle, TextRenderParameters, TextRenderStyle } from "@here/harp-text-canvas";
import { Math2D } from "@here/harp-utils";
import * as THREE from "three";
import { ImageItem } from "../image/Image";
import { PickResult } from "../PickHandler";
import { PoiBuffer } from "../poi/PoiRenderer";
import { TextElementType } from "./TextElementType";
/**
 * Additional information for an icon that is to be rendered along with a {@link TextElement}.
 * @internal
 */
export interface PoiInfo {
    /**
     * Technique defining the POI or LineMarker
     */
    technique: PoiTechnique | LineMarkerTechnique;
    /**
     * Name of the {@link @here/harp-datasource-protocol#ImageTexture} or image in
     * {@link @here/harp-mapview#userImageCache}.
     */
    imageTextureName?: string;
    /**
     * Icon color override
     *
     * @see {@link @here/harp-datasource-protocol#MarkerTechniqueParams.iconColor};
     */
    iconColor?: THREE.Color;
    /**
     * Icon brightness.
     *
     * @see {@link @here/harp-datasource-protocol#MarkerTechniqueParams.iconBrightness};
     */
    iconBrightness?: number;
    /**
     * Name of the POI table {@link PoiTable}.
     */
    poiTableName?: string;
    /**
     * Name of the POI description in the {@link PoiTable}.
     */
    poiName?: string;
    /**
     * Specify stack mode. Defaults to `ShowInStack`.
     */
    stackMode?: PoiStackMode;
    /**
     * Minimum zoomLevel at which to display the label icon. No default.
     */
    iconMinZoomLevel?: number;
    /**
     * Maximum zoomLevel at which to display the label icon. No default.
     */
    iconMaxZoomLevel?: number;
    /**
     * Minimum zoomLevel at which to display the label text. No default.
     */
    textMinZoomLevel?: number;
    /**
     * Maximum zoomLevel at which to display the label text. No default.
     */
    textMaxZoomLevel?: number;
    /**
     * If true, the text icon will appear even if the text part is blocked by other labels. Defaults
     * to `false`.
     */
    textIsOptional?: boolean;
    /**
     * If true, the text will appear even if the icon is blocked by other labels or if it cannot be
     * rendered because of missing icon graphics. Defaults to `false`.
     */
    iconIsOptional?: boolean;
    /**
     * If `true`, icon is allowed to overlap other labels or icons of lower priority.
     */
    mayOverlap?: boolean;
    /**
     * If `true`, icon will reserve screen space, other markers of lower priority will not be
     * able to overlap.
     */
    reserveSpace?: boolean;
    /**
     * If isValid is `false`, the icon will no longer be placed or rendered. The reason may be a
     * missing resource. Defaults to `false`.
     */
    isValid?: boolean;
    /**
     * Reference back to owning {@link TextElement}.
     */
    textElement: TextElement;
    /**
     * @hidden
     * If false, text will not be rendered during camera movements. Defaults to `true`.
     */
    renderTextDuringMovements?: boolean;
    /**
     * @hidden
     * Direct access to {@link ImageItem} once it is resolved or `null` if not resolvable.
     */
    imageItem?: ImageItem | null;
    /**
     * @hidden
     * Direct access to {@link @here/harp-datasource-protocol#ImageTexture} once it is resolved.
     */
    imageTexture?: ImageTexture;
    /**
     * @hidden
     * Layout help: A shield group is for all [[LineMarker]]s that have the same icon and text,
     * making them the same road shield icon.
     */
    shieldGroupIndex?: number;
    /**
     * @hidden
     * Internal reference to a render batch, made up of all icons that use the same Material.
     */
    buffer?: PoiBuffer;
    /**
     * @hidden
     * Should be computed during loading/initializing of `ImageTexture`.
     */
    computedWidth?: number;
    /**
     * @hidden
     * Should be computed during loading/initializing of `ImageTexture`.
     */
    computedHeight?: number;
    /**
     * @hidden
     * Should be computed during loading/initializing of `ImageTexture`.
     */
    uvBox?: Math2D.UvBox;
    /**
     * @hidden
     * Computed from owning {@link TextElement}. Value is set when `PoiInfo` is assigned to
     * {@link TextElement}.
     */
    renderOrder?: number;
}
/**
 * Return 'true' if the POI has been successfully prepared for rendering.
 *
 * @param poiInfo - PoiInfo containing information for rendering the POI icon.
 * @internal
 */
export declare function poiIsRenderable(poiInfo: PoiInfo): boolean;
export interface TextPickResult extends PickResult {
    /**
     * Text of the picked {@link TextElement}
     */
    text?: string;
}
/**
 * State of loading.
 */
export declare enum LoadingState {
    Requested = 0,
    Loaded = 1,
    Initialized = 2
}
/**
 * `TextElement` is used to create 2D text elements (for example, labels).
 * @internal
 */
export declare class TextElement {
    readonly text: string;
    readonly points: THREE.Vector3[] | THREE.Vector3;
    readonly renderParams: TextRenderParameters | TextRenderStyle;
    readonly layoutParams: TextLayoutParameters | TextLayoutStyle;
    priority: number;
    xOffset: number;
    yOffset: number;
    featureId?: string | number | undefined;
    style?: string | undefined;
    fadeNear?: number | undefined;
    fadeFar?: number | undefined;
    readonly tileOffset?: number | undefined;
    readonly offsetDirection?: number | undefined;
    readonly dataSourceName?: string | undefined;
    readonly dataSourceOrder?: number | undefined;
    /**
     * Text elements with this priority are placed on screen before any others.
     */
    static readonly HIGHEST_PRIORITY: number;
    /**
     * Determines visibility. If set to `false`, it will not be rendered.
     */
    visible: boolean;
    /**
     * Determines minimum zoom level for visibility. Can be used to reduce the number of visible
     * `TextElement`s based on zoom level.
     */
    minZoomLevel?: number;
    /**
     * Determines maximum zoom level for visibility. Can be used to reduce the number of visible
     * `TextElement`s based on zoom level.
     */
    maxZoomLevel?: number;
    /**
     * If `true`, label is allowed to overlap other labels or icons of lower priority.
     * @default `false`
     */
    mayOverlap?: boolean;
    /**
     * If `true`, label will reserve screen space, other markers of lower priority will not be
     * able to overlap.
     * @default `true`
     */
    reserveSpace?: boolean;
    /**
     * If `true`, the label will always be rendered on top. If overlapping with other labels, the
     * render order is undefined;
     * @default `false`
     */
    alwaysOnTop?: boolean;
    /**
     * Ignore distance limit. Used for label in labeled-icons.
     */
    ignoreDistance?: boolean;
    /**
     * Scaling factor of text. Defaults to 0.5, reducing the size ot 50% in the distance.
     */
    distanceScale: number;
    /**
     * Optional user data. Will be retrieved during picking.
     */
    userData?: any;
    /**
     * If specified, determines the render order between `TextElement`s. The number different
     * renderOrders should be as small as possible, because every specific `renderOrder` may result
     * in one or more draw calls.
     *
     * TextElements with the same integer `renderOrder` will be rendered in the same batch.
     *
     * The `renderOrder` of `TextElement`s are only relative to other `TextElement`s, and not other
     * map elements.
     *
     * A `TextElement` with a higher `renderOrder` will be rendered after a `TextElement` with a
     * lower `renderOrder`.
     */
    renderOrder: number;
    /**
     * Specified kind of geometry. One kind is set as default in the technique, and can be
     * overridden in the style.
     */
    kind?: GeometryKind | GeometryKindSet;
    /**
     * @hidden
     * Used during rendering.
     */
    loadingState?: LoadingState;
    /**
     * If set to `true` the geometry has been already overlaid on elevation.
     */
    elevated: boolean;
    /**
     * @hidden
     * Array storing the style {@link @here/harp-text-canvas#GlyphData} for
     * this `TextElement` to speed up label placement in
     * {@link TextElementsRenderer}. Valid after `loadingState` is `Initialized`.
     */
    glyphs?: GlyphData[];
    /**
     * @hidden
     * Array storing the casing (`true`: uppercase, `false`: lowercase)
     * for this `TextElement`.
     * Used by labels in {@link TextElementsRenderer} to support
     * `SmallCaps`. Valid after `loadingState`
     * is `Initialized`.
     */
    glyphCaseArray?: boolean[];
    /**
     * Screen space bounds for this `TextElement`.
     *
     * @remarks
     * Used by point labels in {@link TextElementsRenderer}.
     * Valid after `loadingState` is `Initialized`.
     */
    bounds?: THREE.Box2;
    /**
     * @hidden
     * Pre-computed text vertex buffer. Used by point labels in {@link TextElementsRenderer}. Valid
     * after label becomes visible for the first time.
     */
    textBufferObject?: TextBufferObject;
    /**
     * @hidden
     * If `true`, the estimated bounding box of the path is too small for the label to fit, so it is
     * being ignored for rendering in the latest frame.
     */
    dbgPathTooSmall?: boolean;
    pathLengthSqr?: number;
    /**
     * Time to fade in text in milliseconds.
     * @default [[DEFAULT_FADE_TIME]] 800
     */
    textFadeTime?: number;
    type: TextElementType;
    private m_poiInfo?;
    private m_renderStyle?;
    private m_layoutStyle?;
    /**
     * Creates a new `TextElement`.
     *
     * @param text - The text to display.
     * @param points - The position or a list of points for a curved text, both in world space.
     * @param renderParams - `TextElement` text rendering parameters.
     * @param layoutParams - `TextElement` text layout parameters.
     * @param priority - The priority of the `TextElement. Elements with the highest priority get
     *              placed first, elements with priority of `0` are placed last, elements with a
     *              negative value are always rendered, ignoring priorities and allowing overrides.
     * @param xOffset - Optional X offset of this `TextElement` in screen coordinates.
     * @param yOffset - Optional Y offset of this `TextElement` in screen coordinates.
     * @param featureId - Optional string to identify feature (originated from {@link DataSource}).
     *                  Number ids are deprecated in favor of strings.
     * @param fadeNear - Distance to the camera (0.0 = camera position, 1.0 = farPlane) at which the
     *              label starts fading out (opacity decreases).
     * @param fadeFar - Distance to the camera (0.0 = camera position, 1.0 = farPlane) at which the
     *              label becomes transparent. A value of <= 0.0 disables fading.
     * @param offsetDirection - Direction represented as an angle in degrees clockwise from north to
     * offset the icon in world space.
     */
    constructor(text: string, points: THREE.Vector3[] | THREE.Vector3, renderParams: TextRenderParameters | TextRenderStyle, layoutParams: TextLayoutParameters | TextLayoutStyle, priority?: number, xOffset?: number, yOffset?: number, featureId?: string | number | undefined, style?: string | undefined, fadeNear?: number | undefined, fadeFar?: number | undefined, tileOffset?: number | undefined, offsetDirection?: number | undefined, dataSourceName?: string | undefined, dataSourceOrder?: number | undefined);
    /**
     * The text element position or the first point of the path used to render a curved text, both
     * in world space.
     */
    get position(): THREE.Vector3;
    /**
     * The list of points in world space used to render the text along a path or `undefined`.
     */
    get path(): THREE.Vector3[] | undefined;
    /**
     * If `true`, `TextElement` is allowed to overlap other labels or icons of lower priority.
     *
     * @default `false`
     */
    get textMayOverlap(): boolean;
    set textMayOverlap(mayOverlap: boolean);
    /**
     * If `true`, `TextElement` will reserve screen space, other markers of lower priority will not
     * be able to overlap.
     *
     * @default `true`
     */
    get textReservesSpace(): boolean;
    set textReservesSpace(reserveSpace: boolean);
    /**
     * Contains additional information about icon to be rendered along with text.
     */
    get poiInfo(): PoiInfo | undefined;
    set poiInfo(poiInfo: PoiInfo | undefined);
    /**
     * @returns The style used to render this text element, undefined if not set yet.
     */
    get renderStyle(): TextRenderStyle | undefined;
    /**
     * Sets style used for text rendering.
     * @param style - The style to use.
     */
    set renderStyle(style: TextRenderStyle | undefined);
    /**
     * @returns The style used to layout this text element, undefined if not set yet.
     */
    get layoutStyle(): TextLayoutStyle | undefined;
    /**
     * Sets the style used for text layout.
     * @param style - The style to use.
     */
    set layoutStyle(style: TextLayoutStyle | undefined);
    /**
     * @returns Whether this text element has a valid feature id.
     */
    hasFeatureId(): boolean;
    /**
     * Disposes of any allocated resources.
     */
    dispose(): void;
}
//# sourceMappingURL=TextElement.d.ts.map