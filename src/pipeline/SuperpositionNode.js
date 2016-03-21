import Complex from "src/math/Complex.js"
import Matrix from "src/math/Matrix.js"
import PipelineNode from "src/pipeline/PipelineNode.js"
import QuantumShaders from "src/pipeline/QuantumShaders.js"
import Seq from "src/base/Seq.js"
import SimpleShaders from "src/pipeline/SimpleShaders.js"
import Util from "src/base/Util.js"
import { initializedWglContext } from "src/webgl/WglContext.js"
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
            t => SimpleShaders.data(dataArray).renderTo(t));
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
            QuantumShaders.classicalState(stateIndex).renderTo(t));
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
            let controlTexture = allocTexture(this.width, this.height, WebGLRenderingContext.UNSIGNED_BYTE);
            let resultTexture = allocTexture(this.width, this.height);
            QuantumShaders.controlMask(controlMask).renderTo(controlTexture);
            QuantumShaders.renderQubitOperation(
                resultTexture,
                input[0],
                operation,
                qubitIndex,
                controlTexture);
            reuseTexture(controlTexture);
            return resultTexture;
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
            let control = allocTexture(this.width, this.height, WebGLRenderingContext.UNSIGNED_BYTE);
            QuantumShaders.controlMask(controlMask).renderTo(control);
            let result = allocTexture(this.width, this.height);
            QuantumShaders.renderSwapOperation(
                result,
                input[0],
                qubitIndex1,
                qubitIndex2,
                control);
            reuseTexture(control);
            return result;
        });
    }

    /**
     * Returns a texture containing probabilities that the superposition would match various control masks if measured.
     *
     * @param {!QuantumControlMask} controlMask
     * @returns {!SuperpositionNode}
     */
    controlledProbabilities(controlMask) {
        let qubitCount = Util.bitSize(this.width * this.height - 1);
        let qubitCountLg2 = Util.bitSize(qubitCount - 1);
        let w = 1 << Math.ceil(qubitCountLg2 / 2);
        let h = 1 << Math.floor(qubitCountLg2 / 2);

        return new SuperpositionNode(w, h, [this.pipelineNode], inputs => {
            let result = allocTexture(w, h);
            let workspace1 = allocTexture(this.width, this.height);
            let workspace2 = allocTexture(this.width, this.height);
            QuantumShaders.renderControlCombinationProbabilities(
                result,
                workspace1,
                workspace2,
                controlMask,
                inputs[0]);
            reuseTexture(workspace1);
            reuseTexture(workspace2);
            return result;
        });
    };

    /**
     * Returns a texture containing probabilities that the superposition would match various control masks if measured.
     *
     * @param {!Array.<!int>} wires
     * @param {!QuantumControlMask} controlMask
     * @returns {!SuperpositionNode}
     */
    densityMatrixForWires(wires, controlMask) {
        let qubitCount = Util.bitSize(this.width * this.height - 1);
        let w = 1 << wires.length;
        let h = 1 << wires.length;

        return new SuperpositionNode(w, h, [this.pipelineNode], inputs => {
            let result = allocTexture(w, h);
            QuantumShaders.renderSuperpositionToDensityMatrix(
                result,
                inputs[0],
                wires,
                Seq.range(qubitCount).filter(e => wires.indexOf(e) === -1).toArray(),
                controlMask);
            return result;
        });
    };

    /**
     * Returns a node with operations for extending the pipeline after the eventual pixel data read occurs.
     * @returns {!SuperpositionReadNode}
     */
    read() {
        return new SuperpositionReadNode(new PipelineNode(
            [this.pipelineNode],
            inputs => inputs[0].readPixels()));
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
            SimpleShaders.color(0, 0, 0, 0).renderTo(t);
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
                QuantumShaders.linearOverlay(r, e, a).renderTo(t);
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
     * @param {!PipelineNode<!Array.<!number>|!Float32Array>} floatsNode
     * @property {!PipelineNode<!Array.<!number>|!Float32Array>} floatsNode
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
     * @returns {!PipelineNode.<!Array.<!Complex>>}
     */
    asRenormalizedAmplitudes() {
        return new PipelineNode([this.floatsNode], inputs => {
            let floats = inputs[0];

            // Renormalization factor. For better answers when non-unitary gates are used.
            let unity = 0;
            for (let f of floats) {
                unity += f*f;
            }
            unity = Math.sqrt(unity);
            if (unity < 0.000001) {
                unity = NaN;
            }

            return Seq.range(floats.length/4).map(i => new Complex(floats[i*4]/unity, floats[i*4+1]/unity)).toArray();
        });
    };

    /**
     * Reads the amplitudes associated with the texture data (red component for reals, blue for imaginaries).
     * @returns {!PipelineNode.<!Array.<!Complex>>}
     */
    asDensityMatrix() {
        return new PipelineNode([this.floatsNode], inputs => {
            let floats = inputs[0];

            let n = Math.round(Math.sqrt(floats.length/4));
            if (!Util.isPowerOf2(n) || !n*n*4 === floats.length) {
                throw new Error("Need a square number of entries.")
            }

            let matrix = Matrix.generate(n, n, (r, c) => new Complex(floats[(r*n + c)*4], floats[(r*n + c)*4 + 1]));

            // Renormalization factor. For better answers when non-unitary gates are used.
            let unity = matrix.trace();
            if (unity.abs() < 0.00001) {
                return matrix.scaledBy(NaN);
            }

            return matrix.scaledBy(Complex.ONE.dividedBy(unity));
        });
    };

    /**
     * Reads the probability that each qubit would end up true, if measured, based on the texture data being
     * control combination data.
     * @param {!QuantumControlMask} mask The mask that was used when combining the probabilities.
     * @param {!int} qubitCount
     * @returns {!PipelineNode.<!Array.<!number>>}
     */
    asRenormalizedPerQubitProbabilities(mask, qubitCount) {
        return new PipelineNode([this.floatsNode], inputs => {
            let floats = inputs[0];
            return Seq.range(qubitCount).
                map(i => {
                    let invertedProbability = (mask.desiredValueMask & (1 << i)) === 0;
                    let unity = floats[4 * i];
                    if (unity < 0.000001) {
                        return NaN;
                    }
                    let p = floats[4 * i + 1] / unity;
                    p = Math.max(0, Math.min(1, p));
                    return invertedProbability ? 1 - p : p;
                }).
                toArray();
        });
    };

    /**
     * Reads the probability that each qubit would end up true, given that the mask's conrols were satisfied,
     * based on the texture data being corresponding control combination data.
     * @param {!QuantumControlMask} mask
     * @param {!int} qubitCount
     * @returns {!PipelineNode.<!Array.<!number>>}
     */
    asRenormalizedConditionalPerQubitProbabilities(mask, qubitCount) {
        return new PipelineNode([this.floatsNode], inputs => {
            let floats = inputs[0];
            let r = Seq.range(qubitCount).
                map(i => {
                    let reversedValues = (mask.inclusionMask & (1 << i)) === 0;
                    let invertedProbability = (mask.desiredValueMask & (1 << i)) === 0;
                    let pMatch = floats[4 * i + 2];
                    let pEither = floats[4 * i + 3];
                    if (reversedValues) {
                        [pEither, pMatch] = [pMatch, pEither]
                    }
                    if (pEither <= 0) {
                        return NaN;
                    }
                    let p = pMatch / pEither;
                    p = Math.max(0, Math.min(1, p));
                    return invertedProbability ? 1 - p : p;
                }).
                toArray();
            return r;
        });
    };
}

/** @type {!Map.<!int, !(!WglTexture[])>} */
let TEXTURE_POOL = new Map();

/**
 * @param {!int} width
 * @param {!int} height
 * @param {!int} pixelType
 * @returns {!WglTexture}
 */
let allocTexture = (width, height, pixelType = WebGLRenderingContext.FLOAT) => {
    let k = width + ":" + height + ":" + pixelType;

    if (!TEXTURE_POOL.has(k)) {
        TEXTURE_POOL.set(k, []);
    }
    let pool = TEXTURE_POOL.get(k);
    if (pool.length > 0) {
        return pool.pop();
    }

    return new WglTexture(width, height, pixelType);
};

/**
 * @param {!WglTexture} texture
 */
let reuseTexture = texture => {
    let pool = TEXTURE_POOL.get(texture.width + ":" + texture.height + ":" + texture.pixelType);
    pool.push(texture);
};
