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
     * @param {!WglTextureTrader} stateTrader
     * @param {!Map.<!string, *>} customContextFromGates
     */
    constructor(time,
                qubitRow,
                wireCount,
                controls,
                controlsTexture,
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
        /** @type {!WglTexture} */
        this.controlsTexture = controlsTexture;
        /** @type {!WglTextureTrader} */
        this.stateTrader = stateTrader;
        /** @type {!Map.<!string, *>} */
        this.customContextFromGates = customContextFromGates;
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
}

export {CircuitEvalContext}
