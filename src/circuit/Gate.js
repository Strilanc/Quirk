import {DetailedError} from "src/base/DetailedError.js"
import {GateDrawParams} from "src/draw/GateDrawParams.js"
import {Complex} from "src/math/Complex.js"
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
    constructor(symbol='', name='', blurb='') {
        /** @type {!string} The text shown when drawing the gate. */
        this.symbol = symbol;
        /** @type {!string} The identifier text used for the gate when serializing/parsing JSON. */
        this.serializedId = symbol;
        /** @type {!string} The title text of gate tooltips. */
        this.name = name;
        /** @type {!string} Detail text of gate tooltips. */
        this.blurb = blurb;
        /** @type {!int} The number of columns the gate spans on a circuit. Controls go on the first column. */
        this.width = 1;
        /** @type {!int} The number of wires the gate spans on a circuit. */
        this.height = 1;
        /** @type {undefined|!int} A custom value that gets serialized. Each gate may use it to determine behavior. */
        this.param = undefined;

        /** @type {undefined|!function(!GateDrawParams) : void} Draws the gate. A default is used when undefined. */
        this.customDrawer = undefined;
        /** @type {undefined|*} Used to stash error information when parsing goes bad. */
        this.tag = undefined;
        /**
         * An operation applied during the 'setup' phase of computing a column.
         * NOT AFFECTED BY CONTROLS.
         * @type {undefined|!function(!CircuitEvalContext) : void}
         */
        this.customBeforeOperation = undefined;
        /**
         * An operation applied during the main phase of computing a column.
         * @type {undefined|!function(!CircuitEvalContext) : void}
         */
        this.customOperation = undefined;
        /**
         * An operation applied during the 'cleanup' phase of computing a column.
         * Usually the inverse of the before operation.
         * NOT AFFECTED BY CONTROLS.
         * @type {undefined|!function(!CircuitEvalContext) : void}
         */
        this.customAfterOperation = undefined;
        /**
         * Produces a texture containing information that can be used by the drawing code of display gates.
         * @type {undefined|!function(!CircuitEvalContext) : !WglTexture|!Array.<!WglTexture>}
         */
        this.customStatTexturesMaker = undefined;
        /**
         * Returns some more useful form of the pixel data read from the custom-stat texture.
         * @type {undefined|!function(!Float32Array, !CircuitDefinition, !int, !int) : *}
         */
        this.customStatPostProcesser = undefined;
        /** @type {!Array.<!Gate>} A list of size variants of this gate.*/
        this.gateFamily = [this];

        /** @type {!boolean} Determines if vertical lines are drawn between this gate and controls. */
        this.interestedInControls = true;
        /**
         * Determines if circuits containing this gate need to actively animate.
         * @type {undefined|Infinity|!number}
         * @private
         */
        this._stableDuration = undefined;
        /**
         * Determines the gate's operation (if no shader is specified).
         * @type {undefined|!Matrix}
         * @private
         */
        this._knownMatrix = undefined;
        /**
         * Determines the gate's time-varying operation (if no shader is specified).
         * @type {undefined|!function(time: !number) : !Matrix}
         * @private
         */
        this._knownMatrixFunc = undefined;
        /**
         * Indicates whether the gate can just be skipped over when computing.
         * @type {!boolean}
         * @private
         */
        this._hasNoEffect = false;
        /**
         * Indicates whether the gate's effect is classical, and so can apply to measured bits but perhaps not
         * combinations of measured and unmeasured bits.
         * @type {undefined|!boolean}
         * @private
         */
        this._effectPermutesStates = undefined;
        /**
         * Indicates whether the gate's effect is inherent quantum (w.r.t. the Z basis), and so is not safe to apply
         * to measured bits.
         * @type {undefined|!boolean}
         * @private
         */
        this._effectCreatesSuperpositions = undefined;
        /**
         * Indicates whether vertical lines should be drawn from this gate to gate's marked as controllable.
         * @type {!boolean}
         */
        this.isControlWireSource = false;
        /**
         * A circuit that is equivalent to this gate.
         * If no shader or matrix is specified, the circuit will be recursed into to compute the gate.
         * @type {undefined|!CircuitDefinition}
         */
        this.knownCircuit = undefined;
        /**
         * A cached version of the circuit equivalent to this gate, with slightly looser disabled reasons, used when
         * drawing tooltips.
         * @type {undefined|!CircuitDefinition}
         */
        this.knownCircuitNested = undefined;
        /**
         * Indicates context (such as 'Input Range A') that must be provided by other gates in the same column, or
         * earlier in the circuit in some cases, in order for this gate to function.
         * Doesn't include keys inherited from the gate's circuit (if known).
         * @type {!Array.<!string>}
         */
        this._requiredContextKeys = [];
        /**
         * Indicates whether the simulator needs to compute a qubit density matrix at locations/times where this gate is
         * placed.
         * @type {!boolean}
         */
        this.isSingleQubitDisplay = false;

        /**
         * Determines if this gate conditions or anti-conditions other operations or not.
         * Note that 'False' means 'anti-control', not 'not a control'. Use undefined for 'not a control'.
         * Non-computational-basis controls also use this mechanism, but with before/after operations.
         * @type {undefined|!boolean}
         * @private
         */
        this._controlBit = undefined;
        /**
         * Indicates that this gate is guaranteed to preserve probability (as opposed to e.g. post-selection).
         * When gates with this property not set to true are present in a column, the simulator computes losses/gains.
         * @type {!boolean}
         * @private
         */
        this._isDefinitelyUnitary = false;
        /**
         * Returns context provided by this gate to other gates in the same column (or later columns in some cases).
         * @param {!int} qubit
         * @param {!Gate} gate
         * @returns {!Array.<!{key: !string, val: *}>}
         */
        this.customColumnContextProvider = (qubit, gate) => [];
        /** @type {!boolean} Determines if context generated by this gate sticks around for later columns or not. */
        this.isContextTemporary = true;
        /**
         * Checks for non-standard reasons that a gate should be disabled (e.g. modulus too big to fit in target).
         * @param {!GateCheckArgs} args
         * @returns {undefined|!string}
         */
        this.customDisableReasonFinder = args => undefined;
        /**
         * Indicates that a gate is a re-arrangement of the wires equivalent to the given function.
         * @type {undefined | !function(!int) : !int}
         */
        this.knownBitPermutationFunc = undefined;
        /**
         * Indicates that a gate is a phasing function, and that it phases each computation basis state by the amount
         * returned by this function.
         * @type {undefined | !function(state: !int) : !number}
         */
        this.knownPhaseTurnsFunc = undefined;
        /**
         * Indicates that a gate is a re-arrangement of the basis states equivalent to the given function.
         * Used by all-gate tests to check that shaders are behaving correctly.
         * @type {
         *      !function(val: !int) : !int |
         *      !function(val: !int, a: !int) : !int |
         *      !function(val: !int, a: !int, b: !int) : !int |
         *      !function(val: !int, inputs: ...!int) : !int
         *  }
         */
        this.knownPermutationFuncTakingInputs = undefined;
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
     * Returns context keys required by this gate, including keys inherited from its custom circuit (if applicable).
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
     * Sets the gate's known matrix, and updates meta-properties like 'is unitary'.
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
     * Sets the gate's known matrix function. Doesn't update meta-properties, since functions are hard to inspect.
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
     * Creates a gate with meta-properties defaulted to "doesn't do anything".
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
     * Sets meta-properties to indicate a gate is safe for classical use and quantum use, but not safe for mixed used.
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
     * Sets meta-properties to indicate a gate is safe for classical, quantum, and mixed use.
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
     * Sets meta-properties to indicate a gate is a control.
     * @param {!boolean} bit: Whether gate is a control or anti-control. Use before/after operations for flexibility.
     * @returns {!Gate}
     */
    markedAsControl(bit) {
        let g = this._copy();
        g._controlBit = bit;
        g.isControlWireSource = true;
        g._isDefinitelyUnitary = true;
        g.interestedInControls = false;
        return g;
    }

    /**
     * Sets meta-properties to indicate a gate doesn't change over time, and so doesn't force the circuit to
     * constantly recompute.
     * @returns {!Gate}
     */
    markedAsStable() {
        let g = this._copy();
        g._stableDuration = Infinity;
        return g;
    }

    /**
     * Sets meta-properties to indicate a gate preserves probability, and so doesn't force gain/loss computations.
     * @returns {!Gate}
     */
    markedAsUnitary() {
        let g = this._copy();
        g._isDefinitelyUnitary = true;
        return g;
    }

    /**
     * Returns a copy of this gate which can be safely mutated.
     * @private
     * @returns {!Gate}
     */
    _copy() {
        let g = new Gate(this.symbol, this.name, this.blurb);
        g.serializedId = this.serializedId;
        g.tag = this.tag;
        g.param = this.param;
        g.customDrawer = this.customDrawer;
        g.interestedInControls = this.interestedInControls;
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
        g.isContextTemporary = this.isContextTemporary;
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
        g.knownPhaseTurnsFunc = this.knownPhaseTurnsFunc;
        g.knownPermutationFuncTakingInputs = this.knownPermutationFuncTakingInputs;
        g.customColumnContextProvider = this.customColumnContextProvider;
        g.customDisableReasonFinder = this.customDisableReasonFinder;
        return g;
    }

    /**
     * Sets meta-properties to indicate whether a gate may change over time, forcing the circuit to
     * constantly recompute.
     * @param {undefined|Infinity|!number} duration
     * @returns {!Gate}
     */
    withStableDuration(duration) {
        let g = this._copy();
        g._stableDuration = duration;
        return g;
    }

    /**
     * Provides a circuit equivalent to the gate's effect, which can be used to simulate or analyze the gate.
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
     * Specifies a function for retrieving the context provided by a gate to other gates.
     * @param {!function(qubit:!int,gate:!Gate):!Array.<!{key: !string, val: *}>} customColumnContextProvider
     * @returns {!Gate}
     */
    withCustomColumnContextProvider(customColumnContextProvider) {
        let g = this._copy();
        g.customColumnContextProvider = customColumnContextProvider;
        return g;
    }

    /**
     * Specifies a function for retrieving unusual reasons a gate is being misused and so must be disabled.
     * @param {!function(!GateCheckArgs) : (undefined|!string)} customDisableReasonFinder
     * @returns {!Gate}
     */
    withCustomDisableReasonFinder(customDisableReasonFinder) {
        let g = this._copy();
        g.customDisableReasonFinder = customDisableReasonFinder;
        return g;
    }

    /**
     * Sets meta-properties indicating a qubit density matrix needs to be computed wherever this gate is placed.
     * @returns {!Gate}
     */
    markedAsSingleQubitDisplay() {
        let g = this._copy();
        g.isSingleQubitDisplay = true;
        return g;
    }

    /**
     * Sets the number of columns the gate spans.
     * @param {!int} width
     * @returns {!Gate}
     */
    withWidth(width) {
        let g = this._copy();
        g.width = width;
        return g;
    }

    /**
     * Sets an arbitrary number, saved and restored with the circuit, that the gate's custom functions may use.
     * @param {undefined|!int} value
     * @returns {!Gate}
     */
    withParam(value) {
        let g = this._copy();
        g.param = value;
        return g;
    }

    /**
     * Sets the number of wires the gate spans.
     * @param {!int} height
     * @returns {!Gate}
     */
    withHeight(height) {
        let g = this._copy();
        g.height = height;
        return g;
    }

    /**
     * Indicates that this gate is not a control wire destination when drawing.
     * @returns {!Gate}
     */
    markedAsNotInterestedInControls() {
        let g = this._copy();
        g.interestedInControls = false;
        return g;
    }

    /**
     * Provides a custom drawing function for the gate (use undefined to use the default boxed-symbol drawer).
     * @param {undefined|!function(!GateDrawParams) : void} drawer
     * @returns {!Gate}
     */
    withCustomDrawer(drawer) {
        let g = this._copy();
        g.customDrawer = drawer;
        return g;
    }

    /**
     * Provides a function equivalent to the gate's effect, for checking in tests if the gate's behavior is correct.
     * @param {
     *      !function(val: !int) : !int |
     *      !function(val: !int, a: !int) : !int |
     *      !function(val: !int, a: !int, b: !int) : !int |
     *      !function(val: !int, inputs: ...!int) : !int
     *  } knownPermutationFuncTakingInputs
     * @returns {!Gate}
     */
    withKnownPermutation(knownPermutationFuncTakingInputs) {
        let g = this._copy();
        g.knownPermutationFuncTakingInputs = knownPermutationFuncTakingInputs;
        if (knownPermutationFuncTakingInputs !== undefined) {
            g._stableDuration = Infinity;
            g._hasNoEffect = false;
            g._effectPermutesStates = true;
            g._effectCreatesSuperpositions = false;
            g._isDefinitelyUnitary = true;
        }
        return g;
    }

    /**
     * Provides a function equivalent to how the gate rearranges wires, for checking in tests if the gate's behavior is
     * correct.
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
     * Specifies the id to use when serializing/parsing this gate (instead of defaulting to the symbol).
     * @param {!string} serializedId
     * @returns {!Gate}
     */
    withSerializedId(serializedId) {
        let g = this._copy();
        g.serializedId = serializedId;
        return g;
    }

    /**
     * Sets a setup shader to unconditionally run before executing the operations in a column containing this gate.
     * @param {undefined|!function(!CircuitEvalContext) : !WglConfiguredShader} shaderFunc
     * @returns {!Gate}
     */
    withCustomBeforeShader(shaderFunc) {
        return this.withCustomBeforeOperation(
            shaderFunc === undefined ? undefined : ctx => ctx.applyOperation(shaderFunc));
    }

    /**
     * Sets a cleanup shader to unconditionally run before executing the operations in a column containing this gate.
     * @param {undefined|!function(!CircuitEvalContext) : !WglConfiguredShader} shaderFunc
     * @returns {!Gate}
     */
    withCustomAfterShader(shaderFunc) {
        return this.withCustomAfterOperation(
            shaderFunc === undefined ? undefined : ctx => ctx.applyOperation(shaderFunc));
    }

    /**
     * Sets a setup operation to unconditionally run before executing the operations in a column containing this gate.
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
     * Sets a cleanup operation to unconditionally run before executing the operations in a column containing this gate.
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
     * Sets a custom circuit-update function to run when simulating this gate.
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
     * Sets a shader as the custom circuit-update function to run when simulating this gate.
     * @param {!function(!CircuitEvalContext) : !WglConfiguredShader} shaderFunc
     * @returns {!Gate}
     */
    withCustomShader(shaderFunc) {
        return this.withCustomShaders([shaderFunc]);
    }

    /**
     * Sets a sequence of shaders as the custom circuit-update function to run when simulating this gate.
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
     * Specifies how to extract data that will be needed when drawing a display gate.
     * @param {undefined|!function(!CircuitEvalContext) : (!WglTexture|!Array.<!WglTexture>)} customStatTexturesMaker
     * @returns {!Gate}
     */
    withCustomStatTexturesMaker(customStatTexturesMaker) {
        let g = this._copy();
        g.customStatTexturesMaker = customStatTexturesMaker;
        return g;
    }

    /**
     * Specifies how to process raw pixel data from the custom stats texture maker into a more useful value.
     * @param {undefined|!function(!Float32Array, !CircuitDefinition, !int, !int)} pixelFunc
     * @returns {!Gate}
     */
    withCustomStatPostProcessor(pixelFunc) {
        let g = this._copy();
        g.customStatPostProcesser = pixelFunc;
        return g;
    }

    /**
     * Specifies context values provided by other gates that this gate needs to be present in order to function.
     * @param {...!String} keys
     * @returns {!Gate}
     */
    withRequiredContextKeys(...keys) {
        let g = this._copy();
        g._requiredContextKeys = keys;
        return g;
    }

    /**
     * Creates size-variants of a gate that can be resized between.
     * @param {!int} minSize
     * @param {!int} maxSize
     * @param {!function(span: !int, builder: !GateBuilder)} gateBuildFunc
     * @returns {!{all: !Array.<!Gate>, ofSize: !function(!int) : !Gate}}
     */
    static buildFamily(minSize, maxSize, gateBuildFunc) {
        let gates = [];
        for (let span = minSize; span <= maxSize; span++) {
            let builder = new GateBuilder();
            builder.setHeight(span);
            gateBuildFunc(span, builder);
            builder.gate.gateFamily = gates;
            gates.push(builder.gate);
        }

        let ofSize = h => {
            for (let g of gates) {
                if (g.height === h) {
                    return g;
                }
            }
            return undefined;
        };

        return {all: gates, ofSize};
    }

    /**
     * Creates size-variants of a gate that can be resized between.
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
     * Determines if the context provided by this gate should stick around and apply to later columns, instead of just
     * the column the gate is in.
     * @returns {!Gate}
     */
    withStickyContext() {
        let g = this._copy();
        g.isContextTemporary = false;
        return g;
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

/**
 * Builds quantum gates.
 */
class GateBuilder {
    constructor() {
        this.gate = new Gate();
    }

    setSerializedIdAndSymbol(id) {
        this.gate.symbol = id;
        this.gate.serializedId = id;
        return this;
    }

    /**
     * Sets the text shown inside the box when drawing the gate (unless a custom drawer is used).
     * @param {!string} symbol
     * @returns {!GateBuilder}
     */
    setSymbol(symbol) {
        this.gate.symbol = symbol;
        return this;
    }

    /**
     * Specifies the id to use when serializing/parsing this gate (instead of defaulting to the symbol).
     * @param {!string} serializedId
     * @returns {!GateBuilder}
     */
    setSerializedId(serializedId) {
        this.gate.serializedId = serializedId;
        return this;
    }

    /**
     * Sets the gate's tooltip title.
     * @param {!string} title A helpful human-readable name for the operation.
     * @returns {!GateBuilder}
     */
    setTitle(title) {
        this.gate.name = title;
        return this;
    }

    /**
     * Sets the detail text shown inside tooltips for the gate.
     * @param {!string} blurb A helpful description of what the gate does.
     * @returns {!GateBuilder}
     */
    setBlurb(blurb) {
        this.gate.blurb = blurb;
        return this;
    }

    /**
     * Sets the number of wires the gate spans.
     * @param {!int} height
     * @returns {!GateBuilder}
     */
    setHeight(height) {
        this.gate.height = height;
        return this;
    }

    /**
     * Sets the number of columns the gate spans.
     * @param {!int} width
     * @returns {!GateBuilder}
     */
    setWidth(width) {
        this.gate.width = width;
        return this;
    }

    /**
     * Provides a custom drawing function for the gate (use undefined to use the default boxed-symbol drawer).
     * @param {undefined|!function(!GateDrawParams) : void} drawer
     * @returns {!GateBuilder}
     */
    setDrawer(drawer) {
        this.gate.customDrawer = drawer;
        return this;
    }

    /**
     * Provides a permutation function asserted to be equivalent to the gate's effect.
     *
     * Determines various properties of the gate (e.g. unitarity) and also used by tests to check if the gate's shader's
     * behavior is correct.
     *
     * @param {!function(val: !int) : !int} permutationFunc Returns the output state for each input state.
     * @returns {!GateBuilder}
     */
    setKnownEffectToPermutation(permutationFunc) {
        this.gate.knownPermutationFuncTakingInputs = permutationFunc;
        this.gate._knownMatrixFunc = _ => Matrix.generateTransition(1 << this.gate.height, permutationFunc);
        this.gate._stableDuration = Infinity;
        this.gate._hasNoEffect = false;
        this.gate._effectPermutesStates = true;
        this.gate._effectCreatesSuperpositions = false;
        this.gate._isDefinitelyUnitary = true;
        return this;
    }

    /**
     * Provides a function equivalent to how the gate rearranges wires, for checking in tests if the gate's behavior is
     * correct.
     * @param {!function(!int) : !int} knownBitPermutationFunc Returns the output of the permutation for a
     * given input, assuming the gate is exactly sized to the overall circuit.
     * @returns {!GateBuilder}
     */
    setKnownEffectToBitPermutation(knownBitPermutationFunc) {
        this.gate.knownBitPermutationFunc = knownBitPermutationFunc;
        this.gate._isDefinitelyUnitary = true;
        this.gate._stableDuration = Infinity;
        this.gate._hasNoEffect = false;
        this.gate._effectPermutesStates = true;
        this.gate._effectCreatesSuperpositions = false;
        return this;
    }

    /**
     * Provides a permutation function asserted to be equivalent to the gate's effect.
     *
     * Determines various properties of the gate (e.g. unitarity) and also used by tests to check if the gate's shader's
     * behavior is correct.
     *
     * @param {!function(time: !number, state: !int) : !int} timeVaryingPermutationFunc
     * @returns {!GateBuilder}
     */
    setKnownEffectToTimeVaryingPermutation(timeVaryingPermutationFunc) {
        let g = this.gate;
        g._stableDuration = 0;
        g._knownMatrixFunc = t => Matrix.generateTransition(1 << g.height, i => timeVaryingPermutationFunc(t, i));
        g._hasNoEffect = false;
        g._effectPermutesStates = true;
        g._effectCreatesSuperpositions = false;
        g._isDefinitelyUnitary = true;
        return this;
    }

    /**
     * Provides a permutation function asserted to be equivalent to the gate's effect.
     *
     * Determines various properties of the gate (e.g. unitarity) and also used by tests to check if the gate's shader's
     * behavior is correct.
     *
     * @param {
     *      !function(val: !int, a: !int) : !int |
     *      !function(val: !int, a: !int, b: !int) : !int |
     *      !function(val: !int, inputs: ...!int) : !int
     *  } permutationFunc A permutation function taking the initial state of the covered register, then any input
     *      gate inputs, and returning the new state.
     * @returns {!GateBuilder}
     */
    setKnownEffectToParametrizedPermutation(permutationFunc) {
        let g = this.gate;
        g.knownPermutationFuncTakingInputs = permutationFunc;
        g._knownMatrixFunc = undefined;
        g._stableDuration = Infinity;
        g._hasNoEffect = false;
        g._effectPermutesStates = true;
        g._effectCreatesSuperpositions = false;
        g._isDefinitelyUnitary = true;
        return this;
    }

    /**
     * Provides a phase-factor function asserted to be equivalent to the gate's effect.
     *
     * Determines various properties of the gate (e.g. unitarity) and also used by tests to check if the gate's shader's
     * behavior is correct.
     *
     * @param {!function(state: !int) : !number} phaseTurnsFunc
     *      Determines how many turns each basis state should be phased by, in full-turn units.
     * @returns {!GateBuilder}
     */
    setKnownEffectToPhaser(phaseTurnsFunc) {
        this.gate._hasNoEffect = false;
        this.gate._effectPermutesStates = false;
        this.gate._effectCreatesSuperpositions = false;
        this.gate._isDefinitelyUnitary = true;
        this.gate._stableDuration = Infinity;
        this.gate.knownPhaseTurnsFunc = phaseTurnsFunc;
        this.gate._knownMatrixFunc = () => Matrix.generateDiagonal(
            1 << this.gate.height,
            k => Complex.polar(1, Math.PI * 2 * phaseTurnsFunc(k)));
        return this;
    }

    /**
     * @param {!function() : !Matrix} matrixFunc
     * @returns {GateBuilder}
     */
    setTooltipMatrixFunc(matrixFunc) {
        this.gate._knownMatrixFunc = _ => matrixFunc();
        this.gate._stableDuration = Infinity;
        return this;
    }

    /**
     * @param {!function(time : !number) : !Matrix} timeToMatrixFunc
     * @returns {!GateBuilder}
     */
    setEffectToTimeVaryingMatrix(timeToMatrixFunc) {
        this.gate._stableDuration = 0;
        this.gate._knownMatrixFunc = timeToMatrixFunc;
        this.gate._hasNoEffect = false;
        return this;
    }

    /**
     * Sets a custom circuit-update function to run when simulating this gate.
     * @param {undefined|!function(!CircuitEvalContext)} circuitUpdateFunc
     * @returns {!GateBuilder}
     */
    setActualEffectToUpdateFunc(circuitUpdateFunc) {
        if (circuitUpdateFunc !== undefined && typeof circuitUpdateFunc !== "function") {
            throw new DetailedError("Bad customOperation", {circuitUpdateFunc});
        }
        this.gate.customOperation = circuitUpdateFunc;
        return this;
    }

    /**
     * Sets a shader as the custom circuit-update function to run when simulating this gate.
     * @param {!function(!CircuitEvalContext) : !WglConfiguredShader} shaderFunc
     * @returns {!GateBuilder}
     */
    setActualEffectToShaderProvider(shaderFunc) {
        return this.setActualEffectToUpdateFunc(ctx => ctx.applyOperation(shaderFunc));
    }

    /**
     * Sets a sequence of shaders as the custom circuit-update function to run when simulating this gate.
     * @param {!Array.<!function(!CircuitEvalContext) : !WglConfiguredShader>} shaderFuncs
     * @returns {!GateBuilder}
     */
    setActualEffectToShaderSequence(shaderFuncs) {
        return this.setActualEffectToUpdateFunc(ctx => {
            for (let shaderFunc of shaderFuncs) {
                ctx.applyOperation(shaderFunc);
            }
        });
    }

    /**
     * Sets meta-properties to indicate the gate is safe for classical use and quantum use, but not safe for mixed used.
     * @returns {!GateBuilder}
     */
    promiseEffectOnlyPermutesAndPhases() {
        this.gate._hasNoEffect = false;
        this.gate._effectPermutesStates = true;
        this.gate._effectCreatesSuperpositions = false;
        this.gate._isDefinitelyUnitary = true;
        return this;
    }

    /**
     * @returns {!GateBuilder}
     */
    promiseEffectIsUnitary() {
        this.gate._isDefinitelyUnitary = true;
        return this;
    }

    /**
     * @returns {!GateBuilder}
     */
    promiseHasNoNetEffectOnStateVector() {
        this.gate._stableDuration = Infinity;
        this.gate._hasNoEffect = true;
        this.gate._isDefinitelyUnitary = true;
        this.gate._effectPermutesStates = false;
        this.gate._effectCreatesSuperpositions = false;
        return this;
    }

    /**
     * Indicates that the gate isn't a control wire destination when drawing.
     * @returns {!GateBuilder}
     */
    markAsNotInterestedInControls() {
        this.gate.interestedInControls = false;
        return this;
    }

    /**
     * Specifies context values provided by other gates that this gate needs to be present in order to function.
     * @param {...!String} keys
     * @returns {!GateBuilder}
     */
    setRequiredContextKeys(...keys) {
        this.gate._requiredContextKeys = keys;
        return this;
    }

    /**
     * Specifies a function for retrieving the context provided by a gate to other gates.
     * @param {!function(qubit:!int,gate:!Gate):!Array.<!{key: !string, val: *}>} customColumnContextProvider
     * @returns {!GateBuilder}
     */
    setContextProvider(customColumnContextProvider) {
        this.gate.customColumnContextProvider = customColumnContextProvider;
        this.gate.isContextTemporary = true;
        return this;
    }

    /**
     * Specifies a function for retrieving the context provided by a gate to other gates.
     * @param {!function(qubit:!int,gate:!Gate):!Array.<!{key: !string, val: *}>} customColumnContextProvider
     * @returns {!GateBuilder}
     */
    setStickyContextProvider(customColumnContextProvider) {
        this.gate.customColumnContextProvider = customColumnContextProvider;
        this.gate.isContextTemporary = false;
        return this;
    }

    /**
     * Sets a setup shader to unconditionally run before executing the operations in a column containing this gate.
     * @param {undefined|!function(!CircuitEvalContext) : !WglConfiguredShader} beforeColumnShaderFunc
     * @param {undefined|!function(!CircuitEvalContext) : !WglConfiguredShader} afterColumnShaderFunc
     * @returns {!GateBuilder}
     */
    setSetupCleanupEffectsToShaderProviders(beforeColumnShaderFunc, afterColumnShaderFunc) {
        return this.setSetupCleanupEffectToUpdateFunc(
            beforeColumnShaderFunc === undefined ? undefined : ctx => ctx.applyOperation(beforeColumnShaderFunc),
            afterColumnShaderFunc === undefined ? undefined : ctx => ctx.applyOperation(afterColumnShaderFunc));
    }

    /**
     * Sets a setup operation to unconditionally run before executing the operations in a column containing this gate.
     * @param {undefined|!function(!CircuitEvalContext) : void} beforeColumnUpdateFunc
     * @param {undefined|!function(!CircuitEvalContext) : void} afterColumnUpdateFunc
     * @returns {!GateBuilder}
     */
    setSetupCleanupEffectToUpdateFunc(beforeColumnUpdateFunc, afterColumnUpdateFunc) {
        if (beforeColumnUpdateFunc !== undefined && typeof beforeColumnUpdateFunc !== "function") {
            throw new DetailedError("Bad beforeColumnUpdateFunc", {customOperation});
        }
        if (afterColumnUpdateFunc !== undefined && typeof afterColumnUpdateFunc !== "function") {
            throw new DetailedError("Bad afterColumnUpdateFunc", {customOperation});
        }
        this.gate.customBeforeOperation = beforeColumnUpdateFunc;
        this.gate.customAfterOperation = afterColumnUpdateFunc;
        return this;
    }

    /**
     * Specifies a function for retrieving unusual reasons a gate is being misused and so must be disabled.
     * @param {!function(!GateCheckArgs) : (undefined|!string)} customDisableReasonFinder
     * @returns {!GateBuilder}
     */
    setExtraDisableReasonFinder(customDisableReasonFinder) {
        this.gate.customDisableReasonFinder = customDisableReasonFinder;
        return this;
    }
}

export {Gate, GateBuilder}
