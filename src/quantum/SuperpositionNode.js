import WglDirector from "src/webgl/WglDirector.js"
import WglTexture from "src/webgl/WglTexture.js"
import Shades from "src/quantum/Shades.js"
import Util from "src/base/Util.js"
import Seq from "src/base/Seq.js"
import Rect from "src/base/Rect.js"
import Complex from "src/linalg/Complex.js"
import PipelineNode from "src/quantum/PipelineNode.js"
import describe from "src/base/Describe.js"

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

    /**
     * Forces evaluation of the pipeline, to compute this texture's color components.
     * @returns {!SuperpositionReadNode}
     */
    read() {
        return new SuperpositionReadNode(new PipelineNode(
            [this.pipelineNode],
            inputs => getSharedDirector().readPixelColorFloats(inputs[0])));
    };

    /**
     * Performs a (very) naive bin packing of the given sizes of boxes into a bin with power-of-2 width and height.
     *
     * Current strategy is to greedily choose to grow a new row or column, then greedily place new rects along it until
     * the new col/row extends along the whole shape so far. Definitely not optimal, unless the shapes are all the same
     * size.
     *
     * @param {!Map.<K, !{width: !int, height: !int}>} sizeMap
     * @returns {!{width: !int, height: !int, placeMap: !Map.<K, !Rect>}}
     * @template K
     */
    static packRects(sizeMap) {
        let width = 0;
        let height = 0;
        let growingNewColumnElseRow = false;
        let growRootOffset = 0;
        let grownLength = 0;

        let placeMap = new Map();
        for (let [key, size] of sizeMap) {
            //noinspection JSUnusedAssignment
            let {width: w, height: h} = size;
            let x, y, rechoose;
            if (growingNewColumnElseRow) {
                x = growRootOffset;
                y = grownLength;
                grownLength += h;
                rechoose = grownLength >= height;
            } else {
                x = grownLength;
                y = growRootOffset;
                grownLength += w;
                rechoose = grownLength >= width;
            }

            //noinspection JSUnusedAssignment
            var r = new Rect(x, y, w, h);
            //noinspection JSUnusedAssignment
            placeMap.set(key, r);
            width = Math.max(width, r.right());
            height = Math.max(height, r.bottom());

            if (rechoose) {
                growingNewColumnElseRow = width <= height;
                grownLength = 0;
                growRootOffset = growingNewColumnElseRow ? width : height;
            }
        }

        width = Util.ceilingPowerOf2(width);
        height = Util.ceilingPowerOf2(height);

        //noinspection JSValidateTypes
        return {width, height, placeMap};
    };

    /**
     * @param {!(!SuperpositionNode[])} superpositionNodes
     * @returns {!Map.<!int, !SuperpositionReadNode>}
     */
    static mergedReadFloats(superpositionNodes) {
        //noinspection JSUnresolvedVariable
        let pack = SuperpositionNode.packRects(new Seq(superpositionNodes).toMap(
            e => e.pipelineNode.id,
            e => e));

        let seedCombined = new SuperpositionNode(pack.width, pack.height, [], () => {
            let t = allocTexture(pack.width, pack.height);
            Shades.renderUniformColor(getSharedDirector(), t, 0, 0, 0, 0);
            return t;
        });
        let accumulateCombined = (aNode, eNode) => new SuperpositionNode(
            pack.width,
            pack.height,
            [aNode.pipelineNode, eNode.pipelineNode],
            textures => {
                let [a, e] = textures;
                let t = allocTexture(pack.width, pack.height);
                let r = pack.placeMap.get(eNode.pipelineNode.id);
                Shades.renderOverlayed(getSharedDirector(), t, r.x, r.y, e, a);
                return t;
            });

        // Hope they're in the right order (as opposed to doing a topological sort)...
        let combined = new Seq(superpositionNodes).aggregate(seedCombined, accumulateCombined).read();

        //noinspection JSUnresolvedVariable
        return new Seq(superpositionNodes).toMap(
            e => e.pipelineNode.id,
            e => new SuperpositionReadNode(new PipelineNode([combined.floatsNode], inputs => {
                let floats = inputs[0];
                //noinspection JSUnresolvedVariable
                let pixelRect = pack.placeMap.get(e.pipelineNode.id);
                let floatRect = pixelRect.withX(pixelRect.x * 4).withW(pixelRect.w * 4);
                return Util.sliceRectFromFlattenedArray(pack.width * 4, floats, floatRect);
            })));
    }
}

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
                map(i => floats[4 << i]).
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
