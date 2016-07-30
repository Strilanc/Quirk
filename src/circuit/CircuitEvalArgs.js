/**
 * Values used by the various gate effects.
 */
export default class CircuitEvalArgs {
    /**
     * @param {!number} time
     * @param {undefined|!int} row
     * @param {!Controls} controls
     * @param {!WglTexture} controlsTexture
     * @param {undefined|!WglTexture} stateTexture
     * @param {!Map.<!string, *>} customContextFromGates
     */
    constructor(time,
                row,
                controls,
                controlsTexture,
                stateTexture,
                customContextFromGates) {
        /** @type {!number} */
        this.time = time;
        /** @type {undefined|!int} */
        this.row = row;
        /** @type {!Controls} */
        this.controls = controls;
        /** @type {!WglTexture} */
        this.controlsTexture = controlsTexture;
        /** @type {undefined|!WglTexture} */
        this.stateTexture = stateTexture;
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
            this.controls,
            this.controlsTexture,
            this.stateTexture,
            this.customContextFromGates);
    }

    /**
     * @param {!WglTexture} newStateTexture
     * @returns {!CircuitEvalArgs}
     */
    withStateTexture(newStateTexture) {
        let r = this._clone();
        r.stateTexture = newStateTexture;
        return r;
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
