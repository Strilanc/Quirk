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
     * @param {!WglContext} ctx
     * @returns T
     */
    initializedValue(ctx) {
        if (this.lifetimeId !== ctx.lifetimeCounter) {
            this.lifetimeId = ctx.lifetimeCounter;
            this.mortalValue = this.initializer(ctx);
        }

        return this.mortalValue;
    }

    /**
     * Initializes or re-initializes the stored mortal value, if necessary.
     * @param {!WglContext} ctx
     */
    ensureInitialized(ctx) {
        this.initializedValue(ctx);
    }
}
