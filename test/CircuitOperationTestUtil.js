import {assertThat} from "test/TestUtil.js"
import {advanceStateWithCircuit} from "src/circuit/CircuitComputeUtil.js"
import {CircuitDefinition} from "src/circuit/CircuitDefinition.js"
import {CircuitEvalContext} from "src/circuit/CircuitEvalContext.js"
import {CircuitShaders} from "src/circuit/CircuitShaders.js"
import {Complex} from "src/math/Complex.js"
import {Controls} from "src/circuit/Controls.js"
import {GateColumn} from "src/circuit/GateColumn.js"
import {Gates} from "src/gates/AllGates.js"
import {Shaders} from "src/webgl/Shaders.js"
import {Matrix} from "src/math/Matrix.js"
import {KetTextureUtil} from "src/circuit/KetTextureUtil.js"
import {seq, Seq} from "src/base/Seq.js"
import {WglTextureTrader} from "src/webgl/WglTextureTrader.js"

// Turn this on to make it easier to debug why a randomized test is failing.
const USE_SIMPLE_VALUES = false;
if (USE_SIMPLE_VALUES) {
    console.warn("Using simplified random values for circuit operation testing.")
}

/**
 * @param {function(!CircuitEvalContext) : !WglConfiguredShader} shaderFunc
 * @param {!Matrix} matrix
 * @param {!int=} repeats
 */
function assertThatCircuitShaderActsLikeMatrix(shaderFunc, matrix, repeats=5) {
    assertThatCircuitUpdateActsLikeMatrix(
        ctx => ctx.applyOperation(shaderFunc),
        matrix,
        repeats);
}

/**
 * @param {!Gate} gate
 * @param {!function(inputA:!int,target:!int):!int|!function(inputA:!int,inputB:!int,target:!int):!int} inversePermutationFunc
 * @param {!Array.<!int>} inputSpans
 * @param {!int=5} repeats
 */
function assertThatGateActsLikePermutation(gate, inversePermutationFunc, inputSpans, repeats=5) {
    let inputGates = seq(inputSpans).
        zip([Gates.InputGates.InputAFamily, Gates.InputGates.InputBFamily], (len, fam) => fam.ofSize(len)).
        toArray();

    for (let _ of Seq.range(repeats)) {
        let dstWire = 0;
        let wireCount = dstWire + gate.height;
        let inpWires = new Array(inputGates.length);
        for (let i = 0; i < inputGates.length; i++) {
            if (Math.random() < 0.5) {
                wireCount += 1;
            }
            inpWires[i] = wireCount;
            wireCount += inputGates[i].height;
        }

        // Useful facts.
        let dstMask = ((1 << gate.height) - 1) << dstWire;
        let inpMasks = seq(inpWires).zip(inputGates, (off, g) => ((1 << g.height) - 1) << off).toArray();

        // Make permutation matrix.
        let matrix = Matrix.generateTransition(1 << wireCount, val => {
            let dst = (val & dstMask) >> dstWire;
            let inps = seq(inpMasks).zip(inpWires, (m, w) => (val & m) >> w).toArray();
            let out = inversePermutationFunc(...inps, dst);
            return (val & ~dstMask) | out;
        });

        // Make circuit.
        let col = new Array(wireCount).fill(undefined);
        for (let i = 0; i < inputSpans.length; i++) {
            col[inpWires[i]] = inputGates[i];
        }
        col[dstWire] = gate;
        let circuit = new CircuitDefinition(wireCount, [new GateColumn(col)]);

        assertThatCircuitUpdateActsLikeMatrix(ctx => advanceStateWithCircuit(ctx, circuit, false), matrix, 1);
    }
}

/**
 * @param {function(!CircuitEvalContext)} updateAction
 * @param {!Matrix} matrix
 * @param {!int=} repeats
 */
function assertThatCircuitUpdateActsLikeMatrix(updateAction, matrix, repeats=5) {
    for (let i = 0; i < repeats; i++) {
        assertThatCircuitMutationActsLikeMatrix_single(updateAction, matrix);
    }
}

/**
 * @param {function(!CircuitEvalContext) : void} updateAction
 * @param {!Matrix} matrix
 */
function assertThatCircuitMutationActsLikeMatrix_single(updateAction, matrix) {
    let qubitSpan = Math.round(Math.log2(matrix.height()));
    let extraWires = Math.floor(Math.random()*5);
    let time = Math.random();
    let qubitIndex = Math.floor(Math.random() * extraWires);
    if (USE_SIMPLE_VALUES) {
        extraWires = 0;
        time = 0;
        qubitIndex = 0;
    }
    let wireCount = qubitSpan + extraWires;
    let controls = Controls.NONE;
    for (let i = 0; i < extraWires; i++) {
        if (Math.random() < 0.5) {
            controls = controls.and(Controls.bit(i + (i < qubitIndex ? 0 : qubitSpan), Math.random() < 0.5));
        }
    }

    let ampCount = 1 << wireCount;
    let inVec = Matrix.generate(1, ampCount, () => USE_SIMPLE_VALUES ?
        (Math.random() < 0.5 ? 1 : 0) :
        new Complex(Math.random()*10 - 5, Math.random()*10 - 5));

    let tex = Shaders.vec2Data(inVec.rawBuffer()).toVec2Texture(wireCount);
    let trader = new WglTextureTrader(tex);
    let controlsTexture = CircuitShaders.controlMask(controls).toBoolTexture(wireCount);
    let ctx = new CircuitEvalContext(
        time,
        qubitIndex,
        wireCount,
        controls,
        controlsTexture,
        trader,
        new Map());
    updateAction(ctx);

    controlsTexture.deallocByDepositingInPool();
    let outData = KetTextureUtil.tradeTextureForVec2Output(trader);
    let outVec = new Matrix(1, ampCount, outData);

    let expectedOutVec = matrix.applyToStateVectorAtQubitWithControls(inVec, qubitIndex, controls);

    assertThat(outVec).withInfo({matrix, inVec, ctx}).isApproximatelyEqualTo(expectedOutVec, 0.005);
}

export {
    assertThatCircuitUpdateActsLikeMatrix,
    assertThatCircuitShaderActsLikeMatrix,
    assertThatGateActsLikePermutation
}
