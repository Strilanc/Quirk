/**
 * A place for a value associated with a webgl context, that needs to be re-initialized when the context is lost.
 * @template T
 */
export default class WglMortalValueSlot {
    /**
     * @param {!function(!WglContext) : T} initializer
     * @template T
     */
    constructor(initializer) {
        /**
         * @type {!(function(!WglContext): T)}
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
     * @param {!WglContext} wglContext
     * @returns T
     */
    initializedValue(wglContext) {
        if (this.lifetimeId !== wglContext.lifetimeCounter) {
            this.lifetimeId = wglContext.lifetimeCounter;
            this.mortalValue = this.initializer(wglContext);
        }

        return this.mortalValue;
    }

    /**
     * Initializes or re-initializes the stored mortal value, if necessary.
     * @param {!WglContext} wglContext
     */
    ensureInitialized(wglContext) {
        this.initializedValue(wglContext);
    }
}
