import {DetailedError} from "src/base/DetailedError.js"
import {GateDrawParams} from "src/draw/GateDrawParams.js"
import {Matrix} from "src/math/Matrix.js"
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
        /** @type {undefined|!function(!CircuitEvalContext) : void} */
        this.customBeforeOperation = undefined;
        /** @type {undefined|!function(!CircuitEvalContext) : void} */
        this.customOperation = undefined;
        /** @type {undefined|!function(!CircuitEvalContext) : void} */
        this.customAfterOperation = undefined;
        /** @type {undefined|!function(!CircuitEvalContext) : !WglTexture|!Array.<!WglTexture>} */
        this.customStatTexturesMaker = undefined;
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
         * @type {!boolean}
         * @private
         */
        this._hasNoEffect = false;
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
         */
        this.isControlWireSource = false;
        /**
         * @type {undefined|!CircuitDefinition}
         */
        this.knownCircuit = undefined;
        /**
         * @type {undefined|!CircuitDefinition}
         */
        this.knownCircuitNested = undefined;
        /**
         * @type {!Array.<!string>}
         */
        this._requiredContextKeys = [];
        /**
         * @type {!boolean}
         */
        this.isSingleQubitDisplay = false;

        /**
         * @type {undefined|!boolean}
         * @private
         */
        this._controlBit = undefined;
        /**
         * @type {!boolean}
         * @private
         */
        this._isDefinitelyUnitary = false;
        /**
         * @param {!int} qubit
         * @returns {!Array.<!{key: !string, val: *}>}
         */
        this.customColumnContextProvider = qubit => [];
        /**
         * @param {!GateCheckArgs} args
         * @returns {undefined|!string}
         */
        this.customDisableReasonFinder = args => undefined;
        /**
         * @type {undefined | !function(!int) : !int}
         */
        this.knownBitPermutationFunc = undefined;
    }

    /**
     * @param {!string} symbol
     * @param {!Matrix} matrix
     * @param {!string} name
     * @param {!string} blurb
     * @returns {!Gate}
     */
    static fromKnownMatrix(symbol, matrix, name='', blurb='') {
        if (!(matrix instanceof Matrix)) {
            throw new DetailedError("Bad matrix.", {symbol, matrix, name, blurb});
        }
        return new Gate(symbol, name, blurb).withKnownMatrix(matrix);
    }

    /**
     * @returns {!Set.<!String>}
     */
    getUnmetContextKeys() {
        let result = new Set(this._requiredContextKeys);
        if (this.knownCircuit !== undefined) {
            for (let key of this.knownCircuit.getUnmetContextKeys()) {
                result.add(key);
            }
        }
        return result;
    }

    /**
     * @param {undefined|!Matrix} matrix
     * @returns {!Gate}
     */
    withKnownMatrix(matrix) {
        let g = this._copy();
        g._knownMatrix = matrix;
        if (matrix !== undefined) {
            g._isDefinitelyUnitary = matrix.isUnitary(0.01);
            g._hasNoEffect = matrix.isIdentity();
            g._stableDuration = Infinity;
        }
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
        result._isDefinitelyUnitary = true;
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
        g._isDefinitelyUnitary = true;
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
        g._isDefinitelyUnitary = true;
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
        g._isDefinitelyUnitary = true;
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
     * @returns {!Gate}
     */
    markedAsUnitary() {
        let g = this._copy();
        g._isDefinitelyUnitary = true;
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
        g.customBeforeOperation = this.customBeforeOperation;
        g.knownBitPermutationFunc = this.knownBitPermutationFunc;
        g.customOperation = this.customOperation;
        g.customAfterOperation = this.customAfterOperation;
        g.customStatTexturesMaker = this.customStatTexturesMaker;
        g.customStatPostProcesser = this.customStatPostProcesser;
        g.width = this.width;
        g.height = this.height;
        g.isSingleQubitDisplay = this.isSingleQubitDisplay;
        g._knownMatrix = this._knownMatrix;
        g.knownCircuit = this.knownCircuit;
        g.knownCircuitNested = this.knownCircuitNested;
        g._requiredContextKeys = this._requiredContextKeys;
        g._knownMatrixFunc = this._knownMatrixFunc;
        g._stableDuration = this._stableDuration;
        g._hasNoEffect = this._hasNoEffect;
        g._effectPermutesStates = this._effectPermutesStates;
        g._effectCreatesSuperpositions = this._effectCreatesSuperpositions;
        g._affectsOtherWires = this._affectsOtherWires;
        g._controlBit = this._controlBit;
        g.isControlWireSource = this.isControlWireSource;
        g._isDefinitelyUnitary = this._isDefinitelyUnitary;
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
     * @param {undefined|!CircuitDefinition} circuitDefinition
     * @returns {!Gate}
     */
    withKnownCircuit(circuitDefinition) {
        let g = this._copy();
        g.knownCircuit = circuitDefinition;
        g.knownCircuitNested = circuitDefinition.withDisabledReasonsForEmbeddedContext(0, new Map());
        g._isDefinitelyUnitary = circuitDefinition.hasOnlyUnitaryGates();
        return g;
    }

    /**
     * @param {!function(qubit:!int):!Array.<!{key: !string, val: *}>} customColumnContextProvider
     * @returns {!Gate}
     */
    withCustomColumnContextProvider(customColumnContextProvider) {
        let g = this._copy();
        g.customColumnContextProvider = customColumnContextProvider;
        return g;
    }

    /**
     * @param {!function(!GateCheckArgs) : (undefined|!string)} customDisableReasonFinder
     * @returns {!Gate}
     */
    withCustomDisableReasonFinder(customDisableReasonFinder) {
        let g = this._copy();
        g.customDisableReasonFinder = customDisableReasonFinder;
        return g;
    }

    /**
     * @returns {!Gate}
     */
    markedAsSingleQubitDisplay() {
        let g = this._copy();
        g.isSingleQubitDisplay = true;
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
     * @param {undefined|!function(!GateDrawParams) : void} drawer
     * @returns {!Gate}
     */
    withCustomDrawer(drawer) {
        let g = this._copy();
        g.customDrawer = drawer;
        return g;
    }

    /**
     * @param {undefined|!function(!int) : !int} knownBitPermutationFunc Returns the output of the permutation for a
     * given input, assuming the gate is exactly sized to the overall circuit.
     * @returns {!Gate}
     */
    withKnownBitPermutation(knownBitPermutationFunc) {
        let g = this._copy();
        g.knownBitPermutationFunc = knownBitPermutationFunc;
        if (knownBitPermutationFunc !== undefined) {
            g._isDefinitelyUnitary = true;
            g._stableDuration = Infinity;
            g._hasNoEffect = false;
            g._effectPermutesStates = true;
            g._effectCreatesSuperpositions = false;
        }
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
     * @param {undefined|!function(!CircuitEvalContext) : !WglConfiguredShader} shaderFunc
     * @returns {!Gate}
     */
    withCustomBeforeShader(shaderFunc) {
        return this.withCustomBeforeOperation(
            shaderFunc === undefined ? undefined : ctx => ctx.applyOperation(shaderFunc));
    }

    /**
     * @param {undefined|!function(!CircuitEvalContext) : !WglConfiguredShader} shaderFunc
     * @returns {!Gate}
     */
    withCustomAfterShader(shaderFunc) {
        return this.withCustomAfterOperation(
            shaderFunc === undefined ? undefined : ctx => ctx.applyOperation(shaderFunc));
    }

    /**
     * @param {undefined|!function(!CircuitEvalContext) : void} customOperation
     * @returns {!Gate}
     */
    withCustomBeforeOperation(customOperation) {
        if (customOperation !== undefined && typeof customOperation !== "function") {
            throw new DetailedError("Bad customOperation", {customOperation});
        }
        let g = this._copy();
        g.customBeforeOperation = customOperation;
        return g;
    }

    /**
     * @param {undefined|!function(!CircuitEvalContext) : void} customOperation
     * @returns {!Gate}
     */
    withCustomAfterOperation(customOperation) {
        if (customOperation !== undefined && typeof customOperation !== "function") {
            throw new DetailedError("Bad customOperation", {customOperation});
        }
        let g = this._copy();
        g.customAfterOperation = customOperation;
        return g;
    }

    /**
     * @param {undefined|!function(!CircuitEvalContext)} customOperation
     * @returns {!Gate}
     */
    withCustomOperation(customOperation) {
        if (customOperation !== undefined && typeof customOperation !== "function") {
            throw new DetailedError("Bad customOperation", {customOperation});
        }
        let g = this._copy();
        g.customOperation = customOperation;
        return g;
    }

    /**
     * @param {!function(!CircuitEvalContext) : !WglConfiguredShader} shaderFunc
     * @returns {!Gate}
     */
    withCustomShader(shaderFunc) {
        return this.withCustomShaders([shaderFunc]);
    }

    /**
     * @param {!Array.<!function(!CircuitEvalContext) : !WglConfiguredShader>} shaderFuncs
     * @returns {!Gate}
     */
    withCustomShaders(shaderFuncs) {
        return this.withCustomOperation(ctx => {
            for (let shaderFunc of shaderFuncs) {
                ctx.applyOperation(shaderFunc);
            }
        });
    }

    /**
     * @param {undefined|!function(!CircuitEvalContext) : (!WglTexture|!Array.<!WglTexture>)} customStatTexturesMaker
     * @returns {!Gate}
     */
    withCustomStatTexturesMaker(customStatTexturesMaker) {
        let g = this._copy();
        g.customStatTexturesMaker = customStatTexturesMaker;
        return g;
    }

    /**
     * @param {undefined|!function(!Float32Array, !CircuitDefinition, !int, !int)} pixelFunc
     * @returns {!Gate}
     */
    withCustomStatPostProcessor(pixelFunc) {
        let g = this._copy();
        g.customStatPostProcesser = pixelFunc;
        return g;
    }

    /**
     * @param {...!String} keys
     * @returns {!Gate}
     */
    withRequiredContextKeys(...keys) {
        let g = this._copy();
        g._requiredContextKeys = keys;
        return g;
    }

    /**
     * @param {!int} minSize
     * @param {!int} maxSize
     * @param {!function(!int):!Gate} gateGenerator
     * @returns {!{all: !Array.<!Gate>, ofSize: !function(!int) : !Gate}}
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
    isControl() {
        return this._controlBit !== undefined;
    }

    /**
     * @returns {undefined|!boolean}
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
        return this._hasNoEffect;
    }

    /**
     * @returns {!boolean}
     */
    isDefinitelyUnitary() {
        return this._isDefinitelyUnitary;
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
     * @returns {!string}
     */
    toString() {
        return `Gate(${this.symbol})`;
    }
}

export {Gate}
