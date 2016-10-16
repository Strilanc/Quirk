/**
 * Values used by the various gate effects.
 */
class CircuitEvalArgs {
    /**
     * @param {!number} time
     * @param {undefined|!int} qubitRow
     * @param {!int} wireCount
     * @param {!Controls} controls
     * @param {!WglTexture} controlsTexture
     * @param {undefined|!WglTextureTrader} stateTrader
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
        /** @type {undefined|!WglTextureTrader} */
        this.stateTrader = stateTrader;
        /** @type {!Map.<!string, *>} */
        this.customContextFromGates = customContextFromGates;
    }

    /**
     * @returns {!CircuitEvalArgs}
     * @private
     */
    _clone() {
        return new CircuitEvalArgs(
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
     * @returns {!CircuitEvalArgs}
     */
    withRow(row) {
        let r = this._clone();
        r.row = row;
        return r;
    }
}

export {CircuitEvalArgs}
