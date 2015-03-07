import WglDirector from "src/webgl/WglDirector.js"
import WglTexture from "src/webgl/WglTexture.js"
import Shades from "src/quantum/Shades.js"
import Util from "src/base/Util.js"
import Seq from "src/base/Seq.js"

let nextUniqueId = 0;
export default class PipelineTexture {

    /**
     * @param {!(!PipelineTexture[])} inputs
     * @param {!function(!(!WglTexture[])) : !WglTexture} computer
     *
     * @property {!(!PipelineTexture[])} inputs
     * @property {!function(!(!WglTexture[])) : !WglTexture} computer
     * @property {!int} id
     */
    constructor(inputs, computer) {
        this.inputs = inputs;
        this.computer = computer;
        this.id = nextUniqueId++;
    }

    /**
     * @typedef {!{
     *   pipelineValue: !PipelineTexture,
     *   inEdgeIds: !(!int[]),
     *   outEdgeIds: !(!int[]),
     *   unpreparedInputs: !int,
     *   unsatisfiedOutputs: !int,
     *   cachedResult: !WglTexture|undefined
     * }} PipelineGraphNode
     */

    /**
     * @param {!(!PipelineTexture[])} outputs
     * @returns {!Map.<!int, PipelineGraphNode>}
     * @VisibleForTesting
     */
    static computePipelineGraph(outputs) {
        //noinspection JSUnresolvedVariable
        let pipelineTextures = new Seq(outputs).breadthFirstSearch(e => e.inputs, e => e.id).toArray();
        //noinspection JSUnresolvedVariable
        let backwardEdges = new Seq(pipelineTextures).toMap(
            e => e.id,
            e => new Seq(e.inputs).
                map(e2 => e2.id).
                distinct().
                toArray());
        let forwardEdges = Util.reverseGroupMap(backwardEdges, true);

        //noinspection JSUnresolvedVariable
        return new Seq(pipelineTextures).toMap(
            e => e.id,
            e => {
                //noinspection JSValidateTypes
                /** @type {!PipelineTexture} */
                let pipelineValue = e;
                let outEdgeIds = forwardEdges.get(pipelineValue.id);
                let inEdgeIds = backwardEdges.get(pipelineValue.id);
                return {
                    pipelineValue,
                    outEdgeIds,
                    inEdgeIds,
                    unpreparedInputs: inEdgeIds.length,
                    unsatisfiedOutputs: outEdgeIds.length,
                    cachedResult: undefined
                };
            });
    }

    /**
     * @param {!(!PipelineTexture[])} outputs
     * @returns {!(!Float32Array[])}
     */
    static computeAll(outputs) {
        let graph = computePipelineGraph(outputs);

        let initialLeafIds = new Seq(graph).filter(e => e[1].unpreparedInputs === 0).map(e => e[0]);
        let tailIds = new Seq(graph).filter(e => e[1].unsatisfiedOutputs === 0).count();
        if (tailIds !== 1) {
            throw new Error("Texture pipeline must have exactly one output.")
        }

        let computation = initialLeafIds.breadthFirstSearch(leafId => {
            /** @type {PipelineGraphNode} */
            let node = graph.get(leafId);
            let inputTextures = node.inEdgeIds.map(e => graph.get(e).cachedResult);
            let outputTexture = node.pipelineValue.computer(inputTextures);
            node.cachedResult = outputTexture;

            if (isOutput) {
                //yield;
            }

            // Free textures that are no longer needed, now that this texture was computed with them.
            for (let inputId of node.inEdgeIds) {
                /** @type {PipelineGraphNode} */
                let inputNode = graph.get(inputId);
                inputNode.unsatisfiedOutputs--;
                if (inputNode.unsatisfiedOutputs === 0) {
                    free(inputNode.cachedResult);
                    inputNode.cachedResult = undefined;
                }
            }

            if (node.unsatisfiedOutputs === 0) {
                free(node.cachedResult);
                node.cachedResult = undefined;
            }

            // Schedule textures that have all their inputs available, now that this texture is computed, to go next.
            return node.outEdgeIds.filter(outId => {
                /** @type {PipelineGraphNode} */
                let outputNode = graph.get(outId);
                outputNode.unpreparedInputs -= 1;
                return outputNode.unpreparedInputs === 0;
            });
        });

        // Compute
        for (let _ of computation){}

        var result = output.readPixelColorFloats();
        free(output);
        return result;
    }

    /**
     * Creates a superposition with the given amplitudes for each possible state.
     * @param {!(!Complex[])} amplitudes
     * @returns {!PipelineTexture}
     */
    static fromAmplitudes(amplitudes) {
        Util.need(Util.isPowerOf2(amplitudes.length), "isPowerOf2(amplitudes.length)");

        let dataArray = new Float32Array(amplitudes.length * 4);
        for (let i = 0; i < amplitudes.length; i++) {
            dataArray[i*4] = amplitudes[i].real;
            dataArray[i*4 + 1] = amplitudes[i].imag;
        }
        let qubitCount = Util.bitSize(amplitudes.length - 1);
        return new PipelineTexture([], () => {
            let result = alloc(qubitCount);
            Shades.renderPixelColorData(DIRECTOR, result, dataArray);
            return result;
        });
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

        return new PipelineTexture([], () => {
            let result = alloc(qubitCount);
            Shades.renderClassicalState(DIRECTOR, result, stateIndex);
            return result;
        });
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

        return new PipelineTexture([this], input => {
            let result = alloc(this.qubitCount());
            let controlTexture = makeControlMask(controls, this.qubitCount());
            Shades.renderQubitOperation(DIRECTOR, result, input[0], operation, qubitIndex, controlTexture);
            free(controlTexture);
            return result;
        });
    };

    computeTexture() {
        //noinspection JSUnresolvedFunction
        let computedInputs = this.inputs.map(e => e.computeTexture());
        let result = this.computer(computedInputs);
        for (let e of computedInputs) {
            free(e);
        }
        return result;
    }

    /**
     * Converts the receiving QuantumTexture's state into an array of amplitudes corresponding to each possible state.
     * @returns {!(!Complex[])}
     */
    toAmplitudes() {
        let texture = computeTexture();
        let floats = DIRECTOR.readPixelColorFloats(texture);
        free(texture);
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
            DIRECTOR, alloc(n), alloc(n), mask, this.computeAmplitudesTexture());
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

    ///**
    // * Determines if the receiving quantum texture is storing the same superposition as the given quantum texture.
    // * Returns false if the given value is not a QuantumTexture.
    // * @param {!PipelineTexture|*} other
    // * @returns {!boolean}
    // */
    //isEqualTo(other) {
    //    return other instanceof PipelineTexture &&
    //        this.id == &&
    //        new Seq(this.toAmplitudes()).isEqualTo(other.toAmplitudes(), Util.CUSTOM_IS_EQUAL_TO_EQUALITY)
    //};
    //
    /**
     * Returns a description of the receiving QuantumTexture.
     * @returns {!string}
     */
    toString() {
        return `PipelineTexture:${this.id}`;
        //return new Seq(this.toAmplitudes()).toString();
    };
}

let DIRECTOR = new WglDirector();

//noinspection JSValidateTypes
/** @type {!Map.<!int, !(!WglTexture[])>} */
let TEXTURE_POOL = new Map();

/**
 * @param {!int} qubitCount
 * @returns {!WglTexture}
 */
let alloc = qubitCount => {
    Util.need(qubitCount >= 0, qubitCount);
    let w = 1 << Math.ceil(qubitCount / 2);
    let h = 1 << Math.floor(qubitCount / 2);
    let k = w + ":" + h;

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

    return new WglTexture(w, h);
};

/**
 * @param {!WglTexture} texture
 */
let free = texture => {
    //noinspection JSUnresolvedFunction
    let pool = TEXTURE_POOL.get(texture.width + ":" + texture.height);
    pool.push(texture);
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
