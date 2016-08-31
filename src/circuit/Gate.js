import Config from "src/Config.js"
import DetailedError from "src/base/DetailedError.js"
import GateDrawParams from "src/draw/GateDrawParams.js"
import MathPainter from "src/draw/MathPainter.js"
import Matrix from "src/math/Matrix.js"
import Point from "src/math/Point.js"
import Rect from "src/math/Rect.js"
import Util from "src/base/Util.js"
import {seq, Seq} from "src/base/Seq.js"

/**
 * Describes a quantum operation that may vary with time.
 */
class Gate {
    /**
     * @param {!string} symbol The text shown inside the gate's box when drawn on the circuit.
     * @param {!string} name A helpful human-readable name for the operation.
     * @param {!string} blurb A helpful description of what the operation does.
     */
    constructor(symbol, name, blurb) {
        /** @type {!string} */
        this.symbol = symbol;
        /** @type {!string} */
        this.serializedId = symbol;
        /** @type {!string} */
        this.name = name;
        /** @type {!string} */
        this.blurb = blurb;
        /** @type {!int} */
        this.width = 1;
        /** @type {!int} */
        this.height = 1;

        /** @type {undefined|!function(!GateDrawParams) : void} */
        this.customDrawer = undefined;
        /** @type {undefined|*} */
        this.tag = undefined;
        /** @type {undefined|!Array.<!function(!CircuitEvalArgs) : !WglConfiguredShader>} */
        this.customShaders = undefined;
        /** @type {undefined|!function(!WglTexture, !WglTexture, !int, !Controls) : !ShaderPipeline} */
        this.customStatPipelineMaker = undefined;
        /** @type {undefined|!function(!Float32Array, !CircuitDefinition, !int, !int) : *} */
        this.customStatPostProcesser = undefined;
        /** @type {!Array.<!Gate>} */
        this.gateFamily = [this];

        /**
         * @type {undefined|Infinity|!number}
         * @private
         */
        this._stableDuration = undefined;
        /**
         * @type {undefined|!Matrix}
         * @private
         */
        this._knownMatrix = undefined;
        /**
         * @type {undefined|!function(!number) : !Matrix}
         * @private
         */
        this._knownMatrixFunc = undefined;
        /**
         * @type {undefined|!boolean}
         * @private
         */
        this._hasNoEffect = undefined;
        /**
         * @type {undefined|!boolean}
         * @private
         */
        this._effectPermutesStates = undefined;
        /**
         * @type {undefined|!boolean}
         * @private
         */
        this._effectCreatesSuperpositions = undefined;
        /**
         * @type {!boolean}
         * @private
         */
        this._affectsOtherWires = false;
        /**
         * @type {!boolean}
         */
        this.isControlWireSource = false;

        /**
         * @type {undefined|!boolean}
         * @private
         */
        this._controlBit = undefined;
        /** @type {!Array.<!function(!CircuitEvalArgs) : !WglConfiguredShader>} */
        this.preShaders = [];
        /** @type {!Array.<!function(!CircuitEvalArgs) : !WglConfiguredShader>} */
        this.postShaders = [];
        /**
         * @param {!int} qubit
         * @returns {!Array.<!{key: !string, value: *}>}
         */
        this.customColumnContextProvider = qubit => [];
        /**
         * @param {!GateColumn} col
         * @param {!int} qubit
         * @param {!int} measuredMask
         * @returns {undefined|!string}
         */
        this.customDisableReasonFinder = (col, qubit, measuredMask) => undefined;
    }

    /**
     * @param {!string} symbol
     * @param {!Matrix} matrix
     * @param {!string} name
     * @param {!string} blurb
     * @returns {!Gate}
     */
    static fromKnownMatrix(symbol, matrix, name, blurb) {
        if (!(matrix instanceof Matrix)) {
            throw new DetailedError("Bad matrix.", {symbol, matrix, name, blurb});
        }
        let result = new Gate(symbol, name, blurb);
        result._knownMatrix = matrix;
        result._stableDuration = Infinity;
        return result;
    }

    /**
     * @param {undefined|!Matrix} matrix
     * @returns {!Gate}
     */
    withKnownMatrix(matrix) {
        let g = this._copy();
        g._knownMatrix = matrix;
        return g;
    }

    /**
     * @param {undefined|!function(!number) : !Matrix} matrixFunc
     * @returns {!Gate}
     */
    withKnownMatrixFunc(matrixFunc) {
        let g = this._copy();
        g._knownMatrixFunc = matrixFunc;
        return g;
    }

    /**
     * @param {!Array.<!function(!CircuitEvalArgs) : !WglConfiguredShader>} before
     * @param {!Array.<!function(!CircuitEvalArgs) : !WglConfiguredShader>} after
     */
    withSetupShaders(before, after) {
        let g = this._copy();
        g.preShaders = before;
        g.postShaders = after;
        return g;
    }

    /**
     * @param {!string} symbol
     * @param {!function(!number) : !Matrix} matrixFunc
     * @param {!string} name
     * @param {!string} blurb
     * @param {!boolean=} effectPermutesStates
     * @param {!boolean=} effectCreatesSuperpositions
     * @returns {!Gate}
     */
    static fromVaryingMatrix(
            symbol,
            matrixFunc,
            name,
            blurb,
            effectPermutesStates=true,
            effectCreatesSuperpositions=true) {
        let result = new Gate(symbol, name, blurb);
        result._knownMatrixFunc = matrixFunc;
        result._hasNoEffect = false;
        result._effectPermutesStates = effectPermutesStates;
        result._effectCreatesSuperpositions = effectCreatesSuperpositions;
        return result;
    }

    /**
     * @param {!string} symbol
     * @param {!string} name
     * @param {!string} blurb
     * @returns {!Gate}
     */
    static fromIdentity(symbol, name, blurb) {
        let result = new Gate(symbol, name, blurb);
        result._stableDuration = Infinity;
        result._hasNoEffect = true;
        result._effectPermutesStates = false;
        result._effectCreatesSuperpositions = false;
        return result;
    }

    /**
     * @param {!string} symbol
     * @param {!string} name
     * @param {!string} blurb
     * @returns {!Gate}
     */
    static withoutKnownMatrix(symbol, name, blurb) {
        return new Gate(symbol, name, blurb);
    }

    /**
     * @returns {!Gate}
     */
    markedAsOnlyPermutingAndPhasing() {
        let g = this._copy();
        g._hasNoEffect = false;
        g._effectPermutesStates = true;
        g._effectCreatesSuperpositions = false;
        return g;
    }

    /**
     * @returns {!Gate}
     */
    markedAsOnlyPhasing() {
        let g = this._copy();
        g._hasNoEffect = false;
        g._effectPermutesStates = false;
        g._effectCreatesSuperpositions = false;
        return g;
    }

    /**
     * @returns {!Gate}
     */
    markedAsAffectsOtherWires() {
        let g = this._copy();
        g._affectsOtherWires = true;
        return g;
    }

    /**
     * @param {!boolean} bit
     * @returns {!Gate}
     */
    markedAsControl(bit) {
        let g = this._copy();
        g._controlBit = bit;
        g.isControlWireSource = true;
        return g;
    }

    /**
     * @returns {!Gate}
     */
    markedAsControlWireSource() {
        let g = this._copy();
        g.isControlWireSource = true;
        return g;
    }

    /**
     * @returns {!Gate}
     */
    markedAsStable() {
        let g = this._copy();
        g._stableDuration = Infinity;
        return g;
    }

    /**
     * @private
     * @returns {!Gate}
     */
    _copy() {
        let g = new Gate(this.symbol, this.name, this.blurb);
        g.serializedId = this.serializedId;
        g.tag = this.tag;
        g.customDrawer = this.customDrawer;
        g.customShaders = this.customShaders;
        g.customStatPipelineMaker = this.customStatPipelineMaker;
        g.customStatPostProcesser = this.customStatPostProcesser;
        g.width = this.width;
        g.height = this.height;
        g.gateFamily = this.gateFamily;
        if (this.gateFamily.length === 1 && this.gateFamily[0] === this) {
            g.gateFamily = [g];
        }
        g._knownMatrix = this._knownMatrix;
        g._knownMatrixFunc = this._knownMatrixFunc;
        g._stableDuration = this._stableDuration;
        g._hasNoEffect = this._hasNoEffect;
        g._effectPermutesStates = this._effectPermutesStates;
        g._effectCreatesSuperpositions = this._effectCreatesSuperpositions;
        g._affectsOtherWires = this._affectsOtherWires;
        g._controlBit = this._controlBit;
        g.isControlWireSource = this.isControlWireSource;
        g.preShaders = this.preShaders;
        g.postShaders = this.postShaders;
        g.customColumnContextProvider = this.customColumnContextProvider;
        g.customDisableReasonFinder = this.customDisableReasonFinder;
        return g;
    }

    /**
     * @param {undefined|Infinity|!number} duration
     * @returns {!Gate}
     */
    withStableDuration(duration) {
        let g = this._copy();
        g._stableDuration = duration;
        return g;
    }

    /**
     * @param {!function(qubit:!int):!Array.<!{key: !string, value: *}>} customColumnContextProvider
     * @returns {!Gate}
     */
    withCustomColumnContextProvider(customColumnContextProvider) {
        let g = this._copy();
        g.customColumnContextProvider = customColumnContextProvider;
        return g;
    }

    /**
     * @param {!function(col:!GateColumn, qubit:!int, measuredMask:!int) : undefined|string} customDisableReasonFinder
     * @returns {!Gate}
     */
    withCustomDisableReasonFinder(customDisableReasonFinder) {
        let g = this._copy();
        g.customDisableReasonFinder = customDisableReasonFinder;
        return g;
    }

    /**
     * @param {!int} width
     * @returns {!Gate}
     */
    withWidth(width) {
        let g = this._copy();
        g.width = width;
        return g;
    }

    /**
     * @param {!int} height
     * @returns {!Gate}
     */
    withHeight(height) {
        let g = this._copy();
        g.height = height;
        return g;
    }

    /**
     * @param {!function(!GateDrawParams) : void} drawer
     * @returns {!Gate}
     */
    withCustomDrawer(drawer) {
        let g = this._copy();
        g.customDrawer = drawer;
        return g;
    }

    /**
     * @param {!string} serializedId
     * @returns {!Gate}
     */
    withSerializedId(serializedId) {
        let g = this._copy();
        g.serializedId = serializedId;
        return g;
    }

    /**
     * @param {!Array.<!function(!CircuitEvalArgs) : !WglConfiguredShader>} shaderFuncs
     * @returns {!Gate}
     */
    withCustomShaders(shaderFuncs) {
        let g = this._copy();
        g.customShaders = shaderFuncs;
        return g;
    }

    /**
     * @param {undefined|!function(!!CircuitEvalArgs) : !ShaderPipeline} customStatePipelineMaker
     * @returns {!Gate}
     */
    withCustomStatPipelineMaker(customStatePipelineMaker) {
        let g = this._copy();
        g.customStatPipelineMaker = customStatePipelineMaker;
        return g;
    }

    /**
     * @param {undefined|!function(!Float32Array, !CircuitDefinition, !int, !int):*} pixelFunc
     * @returns {!Gate}
     */
    withCustomStatPostProcessor(pixelFunc) {
        let g = this._copy();
        g.customStatPostProcesser = pixelFunc;
        return g;
    }

    /**
     * @param {!function(!CircuitEvalArgs) : !WglConfiguredShader} shaderFunc
     * @returns {!Gate}
     */
    withCustomShader(shaderFunc) {
        return this.withCustomShaders([shaderFunc]);
    }

    /**
     * @param {!int} minSize
     * @param {!int} maxSize
     * @param {!function(!int):!Gate} gateGenerator
     * @returns {!{all: !Array.<!Gate>, ofSize: !function(!int) : !Gate}}
     * @template T
     */
    static generateFamily(minSize, maxSize, gateGenerator) {
        let gates = Seq.range(maxSize + 1).skip(minSize).map(i => gateGenerator(i)._copy()).toArray();
        for (let g of gates) {
            g.gateFamily = gates;
        }
        return {
            all: gates,
            ofSize: h => seq(gates).filter(e => e === undefined || e.height === h).first()
        };
    }

    /**
     * @returns {!boolean}
     */
    canChangeInSize() {
        return this.gateFamily.length > 1;
    }

    /**
     * @returns {!boolean}
     */
    canIncreaseInSize() {
        return !this.gateFamily.every(e => e.height !== this.height + 1);
    }

    /**
     * @returns {!boolean}
     */
    canDecreaseInSize() {
        return !this.gateFamily.every(e => e.height !== this.height - 1);
    }

    /**
     * @param {*} tag
     * @returns {!Gate}
     */
    withTag(tag) {
        let g = this._copy();
        g.tag = tag;
        return g;
    }

    /**
     * @param {!number} time
     * @returns {undefined|!Matrix}
     */
    knownMatrixAt(time) {
        return this._knownMatrix !== undefined ? this._knownMatrix :
            this._knownMatrixFunc !== undefined ? this._knownMatrixFunc(time) :
            undefined;
    }

    /**
     * @returns {!boolean}
     */
    affectsOtherWires() {
        return this._affectsOtherWires;
    }

    /**
     * @returns {!boolean}
     */
    isControl() {
        return this._controlBit !== undefined;
    }

    /**
     * @returns {!boolean}
     */
    controlBit() {
        return this._controlBit;
    }

    /**
     * @returns {!boolean}
     */
    effectMightPermutesStates() {
        return this._effectPermutesStates !== undefined ? this._effectPermutesStates :
            this._knownMatrix !== undefined ? !this._knownMatrix.isDiagonal() :
            true;
    }

    /**
     * @returns {!boolean}
     */
    effectMightCreateSuperpositions() {
        return this._effectCreatesSuperpositions !== undefined ? this._effectCreatesSuperpositions :
            this._knownMatrix !== undefined ? !this._knownMatrix.isPhasedPermutation() :
            true;
    }

    /**
     * @returns {!boolean}
     */
    definitelyHasNoEffect() {
        return this._hasNoEffect !== undefined ? this._hasNoEffect :
            this._knownMatrix !== undefined ? this._knownMatrix.isIdentity() :
            false;
    }

    /**
     * @returns {Infinity|!number}
     */
    stableDuration() {
        return this._stableDuration !== undefined ? this._stableDuration :
            this._knownMatrix !== undefined || this._hasNoEffect ? Infinity :
            0;
    }

    /**
     * @param {*|!Gate} other
     * @returns {!boolean}
     */
    isEqualTo(other) {
        if (this === other) {
            return true;
        }
        return other instanceof Gate &&
            this.symbol === other.symbol &&
            this.serializedId === other.serializedId &&
            Util.CUSTOM_IS_EQUAL_TO_EQUALITY(this._knownMatrix, other._knownMatrix) &&
            this._knownMatrixFunc === other._knownMatrixFunc &&
            this._effectCreatesSuperpositions === other._effectCreatesSuperpositions &&
            this._effectPermutesStates === other._effectPermutesStates &&
            this._hasNoEffect === other._hasNoEffect &&
            this.name === other.name &&
            this.blurb === other.blurb &&
            this.symbol === other.symbol &&
            this.tag === other.tag &&
            this._stableDuration === other._stableDuration &&
            this.customShaders === other.customShaders &&
            this.customStatPipelineMaker === other.customStatPipelineMaker &&
            this.customStatPostProcesser === other.customStatPostProcesser &&
            this.customDrawer === other.customDrawer;
    }

    /**
     * @returns {!string}
     */
    toString() {
        return `Gate(${this.symbol})`;
    }

    /**
     * @param {!string} failMsg
     * @param {...!string} keys
     * @returns {!function(!GateColumn) : undefined|!string}
     */
    static disableReasonFinder_needColumnContext(failMsg, ...keys) {
        return col => col.findFirstContextsIncludingDisabled(keys).length === keys.length ? undefined : failMsg;
    }

    /**
     * @param {!string} missingMsg
     * @param {...!string} keys
     * @returns {!function(!GateColumn) : undefined|!string}
     */
    static disableReasonFinder_needInput(missingMsg, ...keys) {
        return (col, qubit, measuredMask) => {
            let g = col.gates[qubit];
            let ranges = col.findFirstContextsIncludingDisabled(keys);
            if (ranges.length < keys.length) {
                return missingMsg;
            }

            if (seq(ranges).any(({offset, length}) => offset + length > qubit && qubit + g.height > offset)) {
                return "input\ninside";
            }

            if (g.effectMightPermutesStates()) {
                let hasMeasuredOutputs = ((measuredMask >> qubit) & ((1 << g.height) - 1)) !== 0;
                let hasUnmeasuredInputs =
                    seq(ranges).any(({offset, length}) => ((~measuredMask >> offset) & ((1 << length) - 1)) !== 0);
                if (hasUnmeasuredInputs && hasMeasuredOutputs) {
                    return "no\nremix\n(sorry)";
                }
            }

            return undefined;
        };
    }
}

export default Gate;
