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

import {WglConfiguredShader} from "../webgl/WglConfiguredShader.js"

/**
 * Values used by the various gate effects.
 *
 * The current state is stored *and updated* via the stateTrader field.
 */
class CircuitEvalContext {
    /**
     * @param {!number} time
     * @param {undefined|!int} qubitRow
     * @param {!int} wireCount
     * @param {!Controls} controls
     * @param {!WglTexture} controlsTexture
     * @param {!Controls} rawControls The controls of the gate column, made available so that before/after operations
     *     can use this information (even though they are not themselves controlled).
     * @param {!WglTextureTrader} stateTrader
     * @param {!Map.<!string, *>} customContextFromGates
     */
    constructor(time,
                qubitRow,
                wireCount,
                controls,
                controlsTexture,
                rawControls,
                stateTrader,
                customContextFromGates) {
        /** @type {!number} */
        this.time = time;
        /**
         * The top-level row that we're working relative to.
         * @type {undefined|!int}
         */
        this.row = qubitRow;
        /** @type {!int} */
        this.wireCount = wireCount;
        /** @type {!Controls} */
        this.controls = controls;
        /** @type {!Controls} */
        this.rawControls = rawControls;
        /** @type {!WglTexture} */
        this.controlsTexture = controlsTexture;
        /** @type {!WglTextureTrader} */
        this.stateTrader = stateTrader;
        /** @type {!Map.<!string, *>} */
        this.customContextFromGates = customContextFromGates;
    }

    /**
     * @param {!WglConfiguredShader|!function(!CircuitEvalContext) : !WglConfiguredShader} operation
     * @return {void}
     */
    applyOperation(operation) {
        let configuredShader = operation instanceof WglConfiguredShader ? operation : operation(this);
        this.stateTrader.shadeAndTrade(configuredShader);
    }

    /**
     * @returns {!CircuitEvalContext}
     * @private
     */
    _clone() {
        return new CircuitEvalContext(
            this.time,
            this.row,
            this.wireCount,
            this.controls,
            this.controlsTexture,
            this.rawControls,
            this.stateTrader,
            this.customContextFromGates);
    }

    /**
     * @param {!int} row
     * @returns {!CircuitEvalContext}
     */
    withRow(row) {
        let r = this._clone();
        r.row = row;
        return r;
    }

    /**
     * @param {!string} letter
     * @param {!int} offset
     * @param {!int} length
     * @returns {!CircuitEvalContext}
     */
    withInputSetToRange(letter, offset, length) {
        let r = this._clone();
        r.customContextFromGates = new Map(r.customContextFromGates);
        r.customContextFromGates.set(`Input Range ${letter}`, {offset, length});
        return r;
    }

    /**
     * @param {!string} letter
     * @param {!int} value
     * @returns {!CircuitEvalContext}
     */
    withInputSetToConstant(letter, value) {
        let r = this._clone();
        r.customContextFromGates = new Map(r.customContextFromGates);
        r.customContextFromGates.delete(`Input Range ${letter}`);
        r.customContextFromGates.set(`Input Default ${letter}`, value);
        return r;
    }

    /**
     * @param {!string} letter
     * @param {!string} other
     * @returns {!CircuitEvalContext}
     */
    withInputSetToOtherInput(letter, other) {
        let r = this._clone();

        r.customContextFromGates = new Map(r.customContextFromGates);

        for (let key of ['Range', 'Default']) {
            let otherVal = r.customContextFromGates.get(`Input ${key} ${other}`);
            if (otherVal !== undefined) {
                r.customContextFromGates.set(`Input ${key} ${letter}`, otherVal);
            } else {
                r.customContextFromGates.delete(`Input ${key} ${letter}`);
            }
        }

        return r;
    }
}

export {CircuitEvalContext}
