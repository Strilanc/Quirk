/**
 * A place for a value associated with a webgl context, that needs to be re-initialized when the context is lost.
 * @template T
 */
export default class WglMortalValueSlot {
    /**
     * @param {!function(!WglCache) : T} initializer
     * @template T
     */
    constructor(initializer) {
        /**
         * @type {!(function(!WglCache): T)}
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
     * @param {!WglCache} cache
     * @returns T
     */
    initializedValue(cache) {
        if (this.lifetimeId !== cache.lifetimeCounter) {
            this.lifetimeId = cache.lifetimeCounter;
            this.mortalValue = this.initializer(cache);
        }

        return this.mortalValue;
    }
}
