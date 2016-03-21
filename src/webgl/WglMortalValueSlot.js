/**
 * A place for a value associated with a webgl context, that needs to be re-initialized when the context is lost.
 * @template T
 */
export default class WglMortalValueSlot {
    /**
     * @param {!function(void) : T} initializer
     * @template T
     */
    constructor(initializer) {
        /**
         * @type {!(function(void): T)}
         * @template T
         */
        this.initializer = initializer;
        /**
         * @type {undefined|!int}
         * @private
         */
        this.lifetimeId = undefined;
        /**
         * @type {undefined|T}
         * @template T
         * @private
         */
        this.mortalValue = undefined;
    }

    /**
     * Returns the mortal value stored in the slot, initializing or re-initializing it if necessary.
     * @param {!int} lifetimeCounter
     * @returns T
     */
    initializedValue(lifetimeCounter) {
        if (this.lifetimeId !== lifetimeCounter) {
            this.lifetimeId = lifetimeCounter;
            this.mortalValue = this.initializer();
        }

        return this.mortalValue;
    }

    /**
     * Initializes or re-initializes the stored mortal value, if necessary.
     * @param {!int} lifetimeCounter
     */
    ensureInitialized(lifetimeCounter) {
        this.initializedValue(lifetimeCounter);
    }
}
