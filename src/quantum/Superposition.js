import WglDirector from "src/webgl/WglDirector.js"
import WglTexture from "src/webgl/WglTexture.js"
import Shades from "src/quantum/Shades.js"
import * as Util from "src/base/Util.js"
import Seq from "src/base/Seq.js"

export default class Superposition {
    /**
     * @param {!WglTexture} amplitudesTexture
     */
    constructor(amplitudesTexture) {
        /** @type {!WglTexture} */
        this.amplitudesTexture = amplitudesTexture;
    }

    /**
     * Determines the number of qubits in the superposition.
     * @returns {!int}
     */
    qubitCount() {
        return countQubits(this.amplitudesTexture);
    };

    /**
     * Creates a superposition with the given amplitudes for each possible state.
     * @param {!(!Complex[])} amplitudes
     * @returns {!Superposition}
     */
    static fromAmplitudes(amplitudes) {
        Util.need(Util.isPowerOf2(amplitudes.length), "isPowerOf2(amplitudes.length)");

        let dataArray = new Float32Array(amplitudes.length * 4);
        for (let i = 0; i < amplitudes.length; i++) {
            dataArray[i*4] = amplitudes[i].real;
            dataArray[i*4 + 1] = amplitudes[i].imag;
        }

        let result = alloc(Util.bitSize(amplitudes.length - 1));
        Shades.renderPixelColorData(DIRECTOR, result, dataArray);
        return new Superposition(result);
    };

    /**
     * Creates a superposition initialized into a classical state.
     * @param {!int} qubitCount
     * @param {!int} stateIndex
     * @returns {!Superposition}
     */
    static fromClassicalStateInRegisterOfSize(stateIndex, qubitCount) {
        Util.need(qubitCount >= 0, "qubitCount >= 0");
        Util.need(stateIndex >= 0 && stateIndex < (1 << qubitCount), "stateMask >= 0 && stateMask < (1 << qubitCount)");

        let dataArray = new Float32Array((1 << qubitCount) * 4);
        dataArray[stateIndex*4] = 1;

        let result = alloc(qubitCount);
        Shades.renderPixelColorData(DIRECTOR, result, dataArray);
        return new Superposition(result);
    };

    /**
     * Returns a texture holding the result of applying a single-qubit operation to the receiving texture's quantum state.
     * @param {!int} qubitIndex The index of the qubit to apply the operation to.
     * @param {!Matrix} operation A 2x2 matrix.
     * @param {!ControlMask} controls
     */
    withQubitOperationApplied(qubitIndex, operation, controls) {
        Util.need(controls.desiredValueFor(qubitIndex) === null, "Controlled an operation with a qubit it modifies.");
        Util.need(qubitIndex >= 0 && qubitIndex < this.qubitCount, "qubitIndex >= 0 && qubitIndex < this.qubitCount");

        let result = alloc(this.qubitCount());
        let controlTexture = makeControlMask(controls, this.qubitCount());
        Shades.renderQubitOperation(DIRECTOR, result, this.amplitudesTexture, operation, qubitIndex, controlTexture);
        free(controlTexture);
        return result;
    };

    /**
     * Converts the receiving QuantumTexture's state into an array of amplitudes corresponding to each possible state.
     * @returns {!(!Complex[])}
     */
    toAmplitudes() {
        let floats = DIRECTOR.readPixelColorFloats(this.amplitudesTexture);
        return range(floats.length/4).map(function(i) { return new Complex(floats[i*4], floats[i*4+1]); });
    };

    /**
     * Returns the probability that the qubits would match a must-be-on control mask if measured, for each possible mask.
     * @param {!int} mask Determines whether controls are must-be-true or must-be-false, bit by bit.
     * @returns {!Float32Array}
     */
    controlProbabilities(mask) {
        let n = this.qubitCount();
        let r = Shades.renderControlCombinationProbabilities(
            DIRECTOR, alloc(n), alloc(n), mask, this.amplitudesTexture);
        free(r.available);
        let d = DIRECTOR.readPixelColorFloats(r.result);
        free(r.result);
        return d;
    };

    /**
     * Returns the probability that each qubit would end up true, if measured.
     * Note that, when qubits are entangled, some conditional probabilities will not match these probabilities.
     * @returns {!(!float[])}
     */
    perQubitProbabilities() {
        let p = controlProbabilities(-1);
        return range(this.qubitCount).map(function(i) { return p[4 << i]; });
    };

    /**
     * Determines if the receiving quantum texture is storing the same superposition as the given quantum texture.
     * Returns false if the given value is not a QuantumTexture.
     * @param {!Superposition|*} other
     * @returns {!boolean}
     */
    isEqualTo(other) {
        return other instanceof Superposition &&
            this.qubitCount() === other.qubitCount() &&
            new Seq(this.toAmplitudes()).isEqualTo(other.toAmplitudes(), Util.CUSTOM_IS_EQUAL_TO_EQUALITY)
    };

    /**
     * Returns a description of the receiving QuantumTexture.
     * @returns {!string}
     */
    toString() {
        return new Seq(this.toAmplitudes()).toString();
    };
}

let DIRECTOR = new WglDirector();

//noinspection JSValidateTypes
/** @type {!Map<!int, !(!WglTexture[])>} */
let TEXTURE_POOL = new Map();

/**
 * @param {!int} qubitCount
 * @returns {!WglTexture}
 */
let alloc = qubitCount => {
    Util.need(qubitCount >= 0, qubitCount);

    //noinspection JSUnresolvedFunction
    if (!TEXTURE_POOL.has(qubitCount)) {
        //noinspection JSUnresolvedFunction
        TEXTURE_POOL.set(qubitCount, []);
    }
    //noinspection JSUnresolvedFunction
    let pool = TEXTURE_POOL.get(qubitCount);
    if (pool.length > 0) {
        return pool.pop();
    }

    return new WglTexture(
        1 << Math.ceil(qubitCount / 2),
        1 << Math.floor(qubitCount / 2));
};

/**
 * @param {!WglTexture} texture
 */
let free = texture => {
    //noinspection JSUnresolvedFunction
    let pool = TEXTURE_POOL.get(countQubits(texture));
    pool.push(texture);
};

let countQubits = texture => {
    return Util.bitSize(texture.width * texture.height - 1)
};

/**
 * Returns a QuantumTexture of the correct size, with states that should not be affected marked with 0s in the texture.
 * @param {!ControlMask} controlMask
 * @param {!int} qubitCount
 * @returns {!WglTexture}
 * @private
 */
let makeControlMask = (controlMask, qubitCount) => {
    let result = Shades.renderControlMask(DIRECTOR, controlMask, alloc(qubitCount), alloc(qubitCount));
    free(result.available);
    return result.result;
};
