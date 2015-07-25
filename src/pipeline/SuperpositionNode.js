import Complex from "src/math/Complex.js"
import QuantumShaders from "src/pipeline/QuantumShaders.js"
import Seq from "src/base/Seq.js"
import PipelineNode from "src/pipeline/PipelineNode.js"
import Util from "src/base/Util.js"
import WglDirector from "src/webgl/WglDirector.js"
import WglTexture from "src/webgl/WglTexture.js"

/**
 * Represents a WebGL texture containing amplitudes or probabilities, to be computed when the pipeline is run.
 *
 * Use mergedReadFloats to get pipeline nodes for the pixel data, instead of the not-so-useful textures.
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
        return SuperpositionNode.input(
            qubitCount,
            t => QuantumShaders.renderPixelColorData(getSharedDirector(), t, dataArray));
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
            QuantumShaders.renderClassicalState(getSharedDirector(), t, stateIndex));
    };

    /**
     * Returns a texture holding the result of applying a single-qubit operation to the receiving texture's quantum
     * state.
     * @param {!int} qubitIndex The index of the qubit to apply the operation to.
     * @param {!Matrix} operation A 2x2 matrix.
     * @param {!QuantumControlMask} controlMask
     * @returns {!SuperpositionNode}
     */
    withQubitOperationApplied(qubitIndex, operation, controlMask) {
        Util.need(controlMask.desiredValueFor(qubitIndex) === null, "Controlled with qubit being modified.");

        return new SuperpositionNode(this.width, this.height, [this.pipelineNode], input => {
            let control = QuantumShaders.renderControlMask(
                getSharedDirector(),
                controlMask,
                allocTexture(this.width, this.height),
                allocTexture(this.width, this.height));
            QuantumShaders.renderQubitOperation(
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
     * Returns a texture holding the result of applying a swap operation.
     * @param {!int} qubitIndex1 The index of one of the qubits to swap.
     * @param {!int} qubitIndex2 The index of the other qubit to swap.
     * @param {!QuantumControlMask} controlMask
     * @returns {!SuperpositionNode}
     */
    withSwap(qubitIndex1, qubitIndex2, controlMask) {
        Util.need(controlMask.desiredValueFor(qubitIndex1) === null, "Controlled with qubit being modified.");
        Util.need(controlMask.desiredValueFor(qubitIndex2) === null, "Controlled with qubit being modified.");

        return new SuperpositionNode(this.width, this.height, [this.pipelineNode], input => {
            let control = QuantumShaders.renderControlMask(
                getSharedDirector(),
                controlMask,
                allocTexture(this.width, this.height),
                allocTexture(this.width, this.height));
            QuantumShaders.renderSwapOperation(
                getSharedDirector(),
                control.available,
                input[0],
                qubitIndex1,
                qubitIndex2,
                control.result);
            reuseTexture(control.result);
            return control.available;
        });
    }

    /**
     * Returns a texture containing probabilities for the amplitudes in the receiving texture.
     * @returns {!SuperpositionNode}
     */
    probabilities() {
        return new SuperpositionNode(this.width, this.height, [this.pipelineNode], inputs => {
            let result = allocTexture(this.width, this.height);
            QuantumShaders.renderProbabilitiesFromAmplitudes(
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
            let r = QuantumShaders.renderControlCombinationProbabilities(
                getSharedDirector(),
                allocTexture(this.width, this.height),
                allocTexture(this.width, this.height),
                controlDirectionMask,
                inputs[0]);
            reuseTexture(r.available);
            return r.result;
        });
    };

    /**
     * Returns a node with operations for extending the pipeline after the eventual pixel data read occurs.
     * @returns {!SuperpositionReadNode}
     */
    read() {
        return new SuperpositionReadNode(new PipelineNode(
            [this.pipelineNode],
            inputs => getSharedDirector().readPixelColorFloats(inputs[0])));
    };

    /**
     * Figures out how large of a texture is needed to aggregate all the desired results, and the offset where those
     * results will end up in the output.
     *
     * @param {!Map.<K, !{width: !int, height: !int}>} sizeMap
     * @returns {!{width: !int, height: !int, placeMap: !Map.<K, !int>}}
     * @template K
     */
    static planPackingIntoSingleTexture(sizeMap) {
        let total = 0;

        let placeMap = new Map();
        for (let [key, size] of sizeMap) {
            //noinspection JSUnusedAssignment
            let {width: w, height: h} = size;
            //noinspection JSUnusedAssignment
            placeMap.set(key, total);
            total += w * h;
        }

        let width = Util.ceilingPowerOf2(Math.ceil(Math.sqrt(total)));
        let height = Util.ceilingPowerOf2(Math.ceil(total / width));

        return {width, height, placeMap};
    };

    /**
     * @param {!(!SuperpositionNode[])} superpositionNodes
     * @returns {!(!SuperpositionReadNode[])}
     */
    static mergedReadFloats(superpositionNodes) {
        let sizes = new Seq(superpositionNodes).keyedBy(e => e.pipelineNode.id);
        let plan = SuperpositionNode.planPackingIntoSingleTexture(sizes);

        let seedCombined = new SuperpositionNode(plan.width, plan.height, [], () => {
            let t = allocTexture(plan.width, plan.height);
            QuantumShaders.renderUniformColor(getSharedDirector(), t, 0, 0, 0, 0);
            return t;
        });
        let accumulateCombined = (aNode, eNode) => new SuperpositionNode(
            plan.width,
            plan.height,
            [aNode.pipelineNode, eNode.pipelineNode],
            textures => {
                // Note: this would be more efficient if the merging was done in a balanced way.
                // This will do for now, despite being quadratic instead of n log n.
                let [a, e] = textures;
                let t = allocTexture(plan.width, plan.height);
                let r = plan.placeMap.get(eNode.pipelineNode.id);
                QuantumShaders.renderLinearOverlay(getSharedDirector(), t, r, e, a);
                return t;
            });

        // Hope they're in the right order (as opposed to doing a topological sort)...
        let combined = new Seq(superpositionNodes).aggregate(seedCombined, accumulateCombined).read();

        return new Seq(superpositionNodes).map(
            e => new SuperpositionReadNode(new PipelineNode([combined.floatsNode], inputs => {
                let floats = inputs[0];
                let offset = plan.placeMap.get(e.pipelineNode.id) * 4;
                let length = e.width * e.height * 4;

                if (floats.slice) {
                    return floats.slice(offset, offset + length);
                }

                // The above fails in chrome, so we need this fallback. For now.
                let result = new Float32Array(length);
                for (let i = 0; i < length; i++) {
                    result[i] = floats[i + offset];
                }
                return result;
            }))).toArray();
    }
}

/**
 * Represents an array of amplitudes or probabilities to be computed when the surrounding pipeline is run.
 */
export class SuperpositionReadNode {
    /**
     * @param {!PipelineNode<!(!number[])|!Float32Array>} floatsNode
     * @property {!PipelineNode<!(!number[])|!Float32Array>} floatsNode
     */
    constructor(floatsNode) {
        this.floatsNode = floatsNode;
    }

    /**
     * Just the read texture's color component float data.
     * @returns {!PipelineNode<!(!Complex[])>}
     */
    raw() {
        return this.floatsNode;
    };

    /**
     * Reads the amplitudes associated with the texture data (red component for reals, blue for imaginaries).
     * @returns {!PipelineNode<!(!Complex[])>}
     */
    asAmplitudes() {
        return new PipelineNode([this.floatsNode], inputs => {
            let floats = inputs[0];
            return Seq.range(floats.length/4).map(i => new Complex(floats[i*4], floats[i*4+1])).toArray();
        });
    };

    /**
     * Reads the probabilities associated with the texture data (just the red component).
     * @returns {!PipelineNode.<!(!number[])>}
     */
    asProbabilities() {
        return new PipelineNode([this.floatsNode], inputs => {
            let floats = inputs[0];
            return Seq.range(floats.length/4).map(i => floats[i*4]).toArray();
        });
    };

    /**
     * Reads the probability that each qubit would end up true, if measured, based on the texture data being
     * control combination data.
     * @returns {!PipelineNode.<!(!number[])>}
     */
    asPerQubitProbabilities() {
        return new PipelineNode([this.floatsNode], inputs => {
            let floats = inputs[0];
            return Seq.naturals().
                map(i => 4 << i).
                takeWhile(i => i < floats.length).
                map(i => 1 - floats[i]).
                toArray();
        });
    };
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

/** @type {!Map.<!int, !(!WglTexture[])>} */
let TEXTURE_POOL = new Map();

/**
 * @param {!int} width
 * @param {!int} height
 * @returns {!WglTexture}
 */
let allocTexture = (width, height) => {
    let k = width + ":" + height;

    if (!TEXTURE_POOL.has(k)) {
        TEXTURE_POOL.set(k, []);
    }
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
    let pool = TEXTURE_POOL.get(texture.width + ":" + texture.height);
    pool.push(texture);
};
