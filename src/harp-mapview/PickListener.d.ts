import { IntersectParams } from "./IntersectParams";
import { PickResult } from "./PickHandler";
/**
 * Collects results from a picking (intersection) test.
 *
 * @internal
 */
export declare class PickListener {
    private readonly m_parameters?;
    private m_results;
    private m_sorted;
    private m_finished;
    /**
     * Constructs a new `PickListener`.
     *
     * @param m_parameters - Optional parameters to customize picking behaviour.
     */
    constructor(m_parameters?: IntersectParams | undefined);
    /**
     * Adds a pick result.
     *
     * @param result - The result to be added.
     */
    addResult(result: PickResult): void;
    /**
     * Indicates whether the listener is satisfied with the results already provided.
     * @returns `True` if the listener doesn't expect more results, `False` otherwise.
     */
    get done(): boolean;
    /**
     * Orders the collected results by distance first, then by reversed render order
     * (topmost/highest render order first), and limits the number of results to the maximum
     * accepted number, see {@link IntersectParams.maxResultCount}.
     */
    finish(): void;
    /**
     * Returns the collected results. {@link PickListener.finish} should be called first to ensure
     * the proper sorting and result count.
     * @returns The pick results.
     */
    get results(): PickResult[];
    /**
     * Returns the closest result collected so far, following the order documented in
     * {@link PickListener.finish}
     * @returns The closest pick result, or `undefined` if no result was collected.
     */
    get closestResult(): PickResult | undefined;
    /**
     * Returns the furthest result collected so far, following the order documented in
     * {@link PickListener.results}
     * @returns The furthest pick result, or `undefined` if no result was collected.
     */
    get furthestResult(): PickResult | undefined;
    private get maxResults();
    private sortResults;
}
//# sourceMappingURL=PickListener.d.ts.map