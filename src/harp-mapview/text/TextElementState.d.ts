import { TextPlacement } from "@here/harp-text-canvas";
import { RenderState } from "./RenderState";
import { TextElement } from "./TextElement";
/**
 * `TextElementState` keeps the current state of a text element while it's being rendered.
 */
export declare class TextElementState {
    readonly element: TextElement;
    /**
     * @hidden
     * Used during label placement to reserve space from front to back.
     */
    private m_viewDistance;
    /**
     * @hidden
     * Used during rendering.
     */
    private m_iconRenderState?;
    /**
     * @hidden
     * Used during rendering.
     */
    private m_textRenderState?;
    /**
     * @hidden
     * Used to store recently used text layout.
     */
    private m_textLayoutState?;
    /**
     * @hidden
     * Stores index into path for TextElements that are of type LineMarker.
     */
    private readonly m_lineMarkerIndex?;
    /**
     *
     * @param element - TextElement this state represents
     * @param positionIndex - Optional index for TextElements of type LineMarker.
     */
    constructor(element: TextElement, positionIndex?: number);
    get initialized(): boolean;
    /**
     * @returns `true` if any component of the element is visible, `false` otherwise.
     */
    get visible(): boolean;
    /**
     * Return the last text placement used.
     *
     * If the text wasn't yet rendered or have no alternative placements it will fallback to
     * style/theme based placement.
     *
     * @returns [[TextPlacement]] object containing vertical/horizontal align.
     */
    get textPlacement(): TextPlacement;
    /**
     * Set text placement to be used.
     *
     * This may be base text anchor placement as defined by style or alternative placement.
     *
     * @param placement - The new [[TextPlacement]] to be used.
     */
    set textPlacement(placement: TextPlacement);
    /**
     * Returns information if the text placement provided is the base one defined in style (theme).
     *
     * @param placement - The [[TextPlacement]] to check.
     * @returns [[true]] if the placement provided is exactly the same as in theme base layout,
     * [[false]] if it differs from the basic layout provided in style or
     * [[undefined]] if the layout style is not yet defined so it is hard to say.
     */
    isBaseTextPlacement(placement: TextPlacement): boolean | undefined;
    /**
     * Resets the element to an initialized state.
     */
    reset(): void;
    /**
     * Replaces given text element, inheriting its current state.
     * The predecessor text element state is erased.
     * @param predecessor - Text element state to be replaced.
     */
    replace(predecessor: TextElementState): void;
    /**
     * Returns the last computed distance of the text element to the camera.
     * @returns Distance to camera.
     */
    get viewDistance(): number | undefined;
    /**
     * Updates the text element state.
     * @param viewDistance - The new view distance to set. If `undefined`, element is considered to
     * be out of view.
     */
    update(viewDistance: number | undefined): void;
    /**
     * Sets the distance of the element to the current view center.
     * @param viewDistance - The new view distance to set. If `undefined`, element is considered to
     * be out of view.
     */
    setViewDistance(viewDistance: number | undefined): void;
    /**
     * Return the last distance that has been computed for sorting during placement. This may not be
     * the actual distance if the camera is moving, as the distance is computed only during
     * placement. If the property `alwaysOnTop` is true, the value returned is always `0`.
     *
     * @returns 0 or negative distance to camera.
     */
    get renderDistance(): number;
    /**
     * @returns The text render state.
     */
    get textRenderState(): RenderState | undefined;
    /**
     * Returns the icon render state for the case where the text element has only one icon.
     * @returns The icon render state if the text element has a single icon, otherwise undefined.
     */
    get iconRenderState(): RenderState | undefined;
    /**
     * Returns the index into the path of the TextElement if the TextElement is of type LineMarker,
     * `undefined` otherwise.
     */
    get lineMarkerIndex(): number | undefined;
    /**
     * Returns the position of the TextElement. If this TextElementState belongs to a TextElement
     * of type LineMarker, it returns the position of the marker at the references index in the
     * path of the TextElement.
     */
    get position(): THREE.Vector3;
    /**
     * Updates the fading state to the specified time.
     * @param time - The current time.
     * @param disableFading - If `True` there will be no fading transitions, i.e., state will go
     * directly from FadedIn to FadedOut and vice versa.
     */
    updateFading(time: number, disableFading: boolean): void;
    /**
     * Initialize text and icon render states
     */
    private initializeRenderStates;
}
/**
 * Test if the TextElement this {@link TextElementState} refers to is of type LineMarker.
 * @param state - Text element state to test.
 */
export declare function isLineMarkerElementState(state: TextElementState): boolean;
//# sourceMappingURL=TextElementState.d.ts.map