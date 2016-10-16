/**
 * A place for a value associated with a webgl context, that needs to be re-initialized when the context is lost.
 * @template T
 */
class WglMortalValueSlot {
    /**
     * @param {!function(void) : T} initializer
     * @param {!function(T) : void} deinitializer
     * @template T
     */
    constructor(initializer, deinitializer) {
        /**
         * @type {!(function(void): T)}
         * @template T
         */
        this.initializer = initializer;
        /**
         * @type {!(function(T): void)}
         * @template T
         */
        this.deinitializer = deinitializer;
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
            this.ensureDeinitialized();
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

    /**
     * Cleans up the stored mortal value, if necessary.
     */
    ensureDeinitialized() {
        if (this.lifetimeId !== undefined) {
            let val = this.mortalValue;
            this.lifetimeId = undefined;
            this.mortalValue = undefined;
            this.deinitializer(val);
        }
    }
}

export {WglMortalValueSlot}
