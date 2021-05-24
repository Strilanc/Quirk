/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * A place for a value associated with a webgl context, that needs to be re-initialized when the context is lost.
 * @template T
 */
class WglMortalValueSlot {
    /**
     * @param {!function() : T} initializer
     * @param {!function(T) : void} deinitializer
     * @template T
     */
    constructor(initializer, deinitializer) {
        /**
         * @type {!(function(): T)}
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
            this.mortalValue = this.initializer();
            this.lifetimeId = lifetimeCounter;
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
