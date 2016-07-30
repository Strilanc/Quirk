/**
 * Values used by the various gate effects.
 */
export default class CircuitEvalArgs {
    /**
     * @param {!number} time
     * @param {!Controls} controls
     * @param {!WglTexture} controlsTexture
     * @param {!WglTexture} inputAmplitudesTexture
     * @param {!Map.<!string, {offset: !int, length: !int}>} letVariableRanges
     */
    constructor(time,
                controls,
                controlsTexture,
                inputAmplitudesTexture,
                letVariableRanges) {
        /** @type {!number} */
        this.time = time;
        /** @type {!Controls} */
        this.controls = controls;
        /** @type {!WglTexture} */
        this.controlsTexture = controlsTexture;
        /** @type {!WglTexture} */
        this.inputAmplitudesTexture = inputAmplitudesTexture;
        /** @type {!Map.<!string, {offset: !int, length: !int}>} */
        this.letVariableRanges = letVariableRanges;
    }

    /**
     * @returns {!CircuitEvalArgs}
     * @private
     */
    _clone() {
        return new CircuitEvalArgs(
            this.time,
            this.controls,
            this.controlsTexture,
            this.inputAmplitudesTexture,
            this.letVariableRanges);
    }

    /**
     * @param {!WglTexture} inputAmplitudesTexture
     * @returns {!CircuitEvalArgs}
     */
    withInputTexture(inputAmplitudesTexture) {
        let r = this._clone();
        r.inputAmplitudesTexture = inputAmplitudesTexture;
        return r;
    }
}
