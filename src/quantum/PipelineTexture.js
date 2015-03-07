import WglDirector from "src/webgl/WglDirector.js"
import WglTexture from "src/webgl/WglTexture.js"
import Shades from "src/quantum/Shades.js"
import Util from "src/base/Util.js"
import Seq from "src/base/Seq.js"
import Complex from "src/linalg/Complex.js"
import PipelineNode from "src/quantum/PipelineNode.js";

export default class PipelineTexture {

    /**
     * @param {!(!PipelineNode[])} inputNodes
     * @param {!function(!(!WglTexture[])) : !WglTexture} operation
     * @param {!int} width
     * @param {!int} height
     *
     * @property {!PipelineNode} pipelineNode
     * @property {!int} width
     * @property {!int} height
     */
    constructor(width, height, inputNodes, operation) {
        this.pipelineNode = new PipelineNode(inputNodes, operation);
        this.width = width;
        this.height = height;
    }

    /**
     * @param {!int} qubitCount
     * @param {!function(!WglTexture)} render
     * @returns {!PipelineTexture}
     */
    static input(qubitCount, render) {
        let w = 1 << Math.ceil(qubitCount / 2);
        let h = 1 << Math.floor(qubitCount / 2);
        return new PipelineTexture(w, h, [], () => {
            let result = allocTexture(w, h);
            render(result);
            return result;
        });
    }

    /**
     * Creates a superposition with the given amplitudes for each possible state.
     * @param {!(!Complex[])|!(!number[])} amplitudes
     * @returns {!PipelineTexture}
     */
    static fromAmplitudes(amplitudes) {
        Util.need(Util.isPowerOf2(amplitudes.length), "isPowerOf2(amplitudes.length)");

        let dataArray = new Float32Array(amplitudes.length * 4);
        for (let i = 0; i < amplitudes.length; i++) {
            dataArray[i*4] = Complex.realPartOf(amplitudes[i]);
            dataArray[i*4 + 1] = Complex.imagPartOf(amplitudes[i]);
        }
        let qubitCount = Util.bitSize(amplitudes.length - 1);
        return PipelineTexture.input(qubitCount, t => Shades.renderPixelColorData(DIRECTOR, t, dataArray));
    };

    /**
     * Creates a superposition initialized into a classical state.
     * @param {!int} qubitCount
     * @param {!int} stateIndex
     * @returns {!PipelineTexture}
     */
    static fromClassicalStateInRegisterOfSize(stateIndex, qubitCount) {
        Util.need(qubitCount >= 0, "qubitCount >= 0");
        Util.need(stateIndex >= 0 && stateIndex < (1 << qubitCount), "stateMask >= 0 && stateMask < (1 << qubitCount)");

        return PipelineTexture.input(qubitCount, t => Shades.renderClassicalState(DIRECTOR, t, stateIndex));
    };

    /**
     * Returns a texture holding the result of applying a single-qubit operation to the receiving texture's quantum state.
     * @param {!int} qubitIndex The index of the qubit to apply the operation to.
     * @param {!Matrix} operation A 2x2 matrix.
     * @param {!ControlMask} controls
     */
    withQubitOperationApplied(qubitIndex, operation, controls) {
        Util.need(controls.desiredValueFor(qubitIndex) === null, "Controlled an operation with a qubit it modifies.");
        //Util.need(qubitIndex >= 0 && qubitIndex < this.qubitCount, "qubitIndex >= 0 && qubitIndex < this.qubitCount");

        return new PipelineTexture(this.width, this.height, [this.pipelineNode], input => {
            let result = allocTexture(this.width, this.height);
            let controlTexture = makeControlMask(controls, this.width, this.height);
            Shades.renderQubitOperation(DIRECTOR, result, input[0], operation, qubitIndex, controlTexture);
            reuseTexture(controlTexture);
            return result;
        });
    };

    /**
     * Returns a texture containing probabilities that the superposition would match various control masks if measured.
     *
     * @param {!int} controlDirectionMask Determines whether controls are must-be-true or must-be-false, bit by bit.
     * @returns {!PipelineTexture}
     */
    controlProbabilityCombinations(controlDirectionMask) {
        return new PipelineTexture(this.width, this.height, [this.pipelineNode], inputs => {
            let r = Shades.renderControlCombinationProbabilities(
                DIRECTOR,
                allocTexture(this.width, this.height),
                allocTexture(this.width, this.height),
                controlDirectionMask,
                inputs[0]);
            reuseTexture(r.available);
            return r.result;
        });
    };

    ///**
    // * Returns the probability that each qubit would end up true, if measured.
    // * Note that, when qubits are entangled, some conditional probabilities will not match these probabilities.
    // * @returns {!(!float[])}
    // */
    //perQubitProbabilities() {
    //    let p = controlProbabilities(-1);
    //    return range(this.qubitCount).map(function(i) { return p[4 << i]; });
    //};
    //
    /**
     * Forces evaluation of the pipeline, to compute this texture's color components.
     * @returns {!Float32Array}
     */
    forceComputeFloats() {
        let texture = PipelineNode.computePipeline([this.pipelineNode], reuseTexture).get(this.pipelineNode.id);
        let floats = DIRECTOR.readPixelColorFloats(texture);
        reuseTexture(texture);
        return floats;
    };

    /**
     * Forces evaluation of the pipeline, to compute this texture's color components, then extracts the corresponding
     * amplitudes for that data (treating the texture as if it were an encoded superposition).
     * @returns {!(!Complex[])}
     */
    forceToAmplitudes() {
        let floats = this.forceComputeFloats();
        return Seq.range(floats.length/4).map(i => new Complex(floats[i*4], floats[i*4+1])).toArray();
    };

    /**
     * Forces evaluation of the pipeline, to compute this texture's color components, then extracts the corresponding
     * probabilities for that data (treating the texture as if it were an encoded probability set).
     * @returns {!(!number[])}
     */
    forceToProbabilities() {
        let floats = this.forceComputeFloats();
        return Seq.range(floats.length/4).map(i => floats[i*4]).toArray();
    };
}

let DIRECTOR = new WglDirector();

//noinspection JSValidateTypes
/** @type {!Map.<!int, !(!WglTexture[])>} */
let TEXTURE_POOL = new Map();

/**
 * @param {!int} width
 * @param {!int} height
 * @returns {!WglTexture}
 */
let allocTexture = (width, height) => {
    let k = width + ":" + height;

    //noinspection JSUnresolvedFunction
    if (!TEXTURE_POOL.has(k)) {
        //noinspection JSUnresolvedFunction
        TEXTURE_POOL.set(k, []);
    }
    //noinspection JSUnresolvedFunction
    let pool = TEXTURE_POOL.get(k);
    if (pool.length > 0) {
        return pool.pop();
    }

    return new WglTexture(width, height);
};

/**
 * @param {!WglTexture} texture
 */
let reuseTexture = texture => {
    //noinspection JSUnresolvedFunction
    let pool = TEXTURE_POOL.get(texture.width + ":" + texture.height);
    pool.push(texture);
};

/**
 * Returns a QuantumTexture of the correct size, with states that should not be affected marked with 0s in the texture.
 * @param {!ControlMask} controlMask
 * @param {!int} width
 * @param {!int} height
 * @returns {!WglTexture}
 * @private
 */
let makeControlMask = (controlMask, width, height) => {
    let result = Shades.renderControlMask(
        DIRECTOR,
        controlMask,
        allocTexture(width, height),
        allocTexture(width, height));
    reuseTexture(result.available);
    return result.result;
};
