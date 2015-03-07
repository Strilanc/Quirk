import WglDirector from "src/webgl/WglDirector.js"
import WglTexture from "src/webgl/WglTexture.js"
import Shades from "src/quantum/Shades.js"
import Util from "src/base/Util.js"
import Seq from "src/base/Seq.js"
import Complex from "src/linalg/Complex.js"
import PipelineNode from "src/quantum/PipelineNode.js";

/**
 * Has a pipeline node computing a texture containing amplitudes (or probabilities), and methods for operation on it.
 */
export default class SuperpositionNode {

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
        this.pipelineNode = new PipelineNode(inputNodes, operation, reuseTexture);
        this.width = width;
        this.height = height;
    }

    /**
     * @param {!int} qubitCount
     * @param {!function(!WglTexture)} render
     * @returns {!SuperpositionNode}
     */
    static input(qubitCount, render) {
        let w = 1 << Math.ceil(qubitCount / 2);
        let h = 1 << Math.floor(qubitCount / 2);
        return new SuperpositionNode(w, h, [], () => {
            let result = allocTexture(w, h);
            render(result);
            return result;
        });
    }

    /**
     * Creates a superposition with the given amplitudes for each possible state.
     * @param {!(!Complex[])|!(!number[])} amplitudes
     * @returns {!SuperpositionNode}
     */
    static fromAmplitudes(amplitudes) {
        Util.need(Util.isPowerOf2(amplitudes.length), "isPowerOf2(amplitudes.length)");

        let dataArray = new Float32Array(amplitudes.length * 4);
        for (let i = 0; i < amplitudes.length; i++) {
            dataArray[i*4] = Complex.realPartOf(amplitudes[i]);
            dataArray[i*4 + 1] = Complex.imagPartOf(amplitudes[i]);
        }
        let qubitCount = Util.bitSize(amplitudes.length - 1);
        return SuperpositionNode.input(qubitCount, t => Shades.renderPixelColorData(getSharedDirector(), t, dataArray));
    };

    /**
     * Creates a superposition initialized into a classical state.
     * @param {!int} qubitCount
     * @param {!int} stateIndex
     * @returns {!SuperpositionNode}
     */
    static fromClassicalStateInRegisterOfSize(stateIndex, qubitCount) {
        Util.need(qubitCount >= 0, "qubitCount >= 0");
        Util.need(stateIndex >= 0 && stateIndex < (1 << qubitCount), "stateMask >= 0 && stateMask < (1 << qubitCount)");

        return SuperpositionNode.input(qubitCount, t =>
            Shades.renderClassicalState(getSharedDirector(), t, stateIndex));
    };

    /**
     * Returns a texture holding the result of applying a single-qubit operation to the receiving texture's quantum
     * state.
     * @param {!int} qubitIndex The index of the qubit to apply the operation to.
     * @param {!Matrix} operation A 2x2 matrix.
     * @param {!ControlMask} controlMask
     * @returns {!SuperpositionNode}
     */
    withQubitOperationApplied(qubitIndex, operation, controlMask) {
        Util.need(controlMask.desiredValueFor(qubitIndex) === null, "Controlled with qubit being modified.");
        //Util.need(qubitIndex >= 0 && qubitIndex < this.qubitCount, "qubitIndex >= 0 && qubitIndex < this.qubitCount");

        return new SuperpositionNode(this.width, this.height, [this.pipelineNode], input => {
            let control = Shades.renderControlMask(
                getSharedDirector(),
                controlMask,
                allocTexture(this.width, this.height),
                allocTexture(this.width, this.height));
            Shades.renderQubitOperation(
                getSharedDirector(),
                control.available,
                input[0],
                operation,
                qubitIndex,
                control.result);
            reuseTexture(control.result);
            return control.available;
        });
    };

    /**
     * Returns a texture containing probabilities for the amplitudes in the receiving texture.
     * @returns {!SuperpositionNode}
     */
    probabilities() {
        return new SuperpositionNode(this.width, this.height, [this.pipelineNode], inputs => {
            let result = allocTexture(this.width, this.height);
            Shades.renderProbabilitiesFromAmplitudes(
                getSharedDirector(),
                result,
                inputs[0]);
            return result;
        });
    };


    /**
     * Returns a texture containing probabilities that the superposition would match various control masks if measured.
     *
     * @param {!int} controlDirectionMask Determines whether controls are must-be-true or must-be-false, bit by bit.
     * @returns {!SuperpositionNode}
     */
    controlProbabilityCombinations(controlDirectionMask) {
        return new SuperpositionNode(this.width, this.height, [this.pipelineNode], inputs => {
            let r = Shades.renderControlCombinationProbabilities(
                getSharedDirector(),
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

    /**
     * Forces evaluation of the pipeline, to compute this texture's color components.
     * @returns {!PipelineNode.<!Float32Array>}
     */
    readFloats() {
        return new PipelineNode([this.pipelineNode], inputs => getSharedDirector().readPixelColorFloats(inputs[0]));
    };

    /**
     * Treats this texture's color components as encoded amplitudes, extracting them.
     * @returns {!PipelineNode<!(!Complex[])>}
     */
    readAsAmplitudes() {
        return new PipelineNode([this.readFloats()], inputs => {
            let floats = inputs[0];
            return Seq.range(floats.length/4).map(i => new Complex(floats[i*4], floats[i*4+1])).toArray();
        });
    };

    /**
     * Treats this texture's color components as encoded probabilities, extracting them.
     * @returns {!PipelineNode.<!(!number[])>}
     */
    readAsProbabilities() {
        return new PipelineNode([this.readFloats()], inputs => {
            let floats = inputs[0];
            return Seq.range(floats.length/4).map(i => floats[i*4]).toArray();
        });
    };

    /**
     * @param {!(!SuperpositionNode[])} textureNodes
     * @returns {!(!PipelineNode[])}
     */
    static readAll(textureNodes) {

        let mergeNode = new PipelineNode(textureNodes.map(e => e.pipelineNode), textures => {

        });
    }
}

/** @type {undefined|!WglDirector} */
let CACHED_SHARED_DIRECTORY = undefined;
/** @returns {!WglDirector} */
let getSharedDirector = () => {
    if (CACHED_SHARED_DIRECTORY === undefined) {
        CACHED_SHARED_DIRECTORY = new WglDirector();
    }
    return CACHED_SHARED_DIRECTORY;
};

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
