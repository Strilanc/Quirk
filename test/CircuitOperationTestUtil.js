/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {assertThat, assertTrue} from "./TestUtil.js"
import {advanceStateWithCircuit} from "../src/circuit/CircuitComputeUtil.js"
import {CircuitDefinition} from "../src/circuit/CircuitDefinition.js"
import {CircuitEvalContext} from "../src/circuit/CircuitEvalContext.js"
import {CircuitShaders} from "../src/circuit/CircuitShaders.js"
import {CircuitStats} from "../src/circuit/CircuitStats.js"
import {Complex} from "../src/math/Complex.js"
import {Controls} from "../src/circuit/Controls.js"
import {GateColumn} from "../src/circuit/GateColumn.js"
import {Gates} from "../src/gates/AllGates.js"
import {Shaders} from "../src/webgl/Shaders.js"
import {Matrix} from "../src/math/Matrix.js"
import {KetTextureUtil} from "../src/circuit/KetTextureUtil.js"
import {seq, Seq} from "../src/base/Seq.js"
import {WglTextureTrader} from "../src/webgl/WglTextureTrader.js"

// Turn this on to make it easier to debug why a randomized test is failing.
const USE_SIMPLE_VALUES = false;
if (USE_SIMPLE_VALUES) {
    console.warn("Using simplified random values for circuit operation testing.")
}

/**
 * @param {!CircuitDefinition} circuit
 * @param {!int} expected_output
 */
function assertThatCircuitOutputsBasisKet(circuit, expected_output) {
    let stats = CircuitStats.fromCircuitAtTime(circuit, 0);
    assertThat(stats.finalState.hasNaN()).isEqualTo(false);

    let actualOut = Seq.range(stats.finalState.height()).
        filter(i => stats.finalState.cell(0, i).isEqualTo(1)).
        first('no solo ket found');
    assertThat(actualOut).isEqualTo(expected_output);

    let b = stats.finalState.rawBuffer();
    for (let i = 0; i < b.length; i++) {
        if (i !== expected_output * 2) {
            assertThat(b[i]).withInfo({i}).isEqualTo(0);
        }
    }
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
 * @param {!function(target : !int,inputA:!int) : !int |
 *         !function(target : !int, inputA : !int, inputB : !int) : !int |
 *         !function(target : !int, inputA : !int, inputB : !int, inputR : !int) : !int} permutationFunc
 * @param {!Array.<!int>=} inputSpans
 * @param {!boolean} ignoreTargetEndsUpDisabled
 */
function assertThatGateActsLikePermutation(
        gate,
        permutationFunc,
        inputSpans=[],
        ignoreTargetEndsUpDisabled=false) {
    let inputGates = [];
    for (let [key, inputGate] of [['Input Range A', Gates.InputGates.InputAFamily],
                                  ['Input Range B', Gates.InputGates.InputBFamily],
                                  ['Input Range R', Gates.InputGates.InputRFamily]]) {
        if (gate.getUnmetContextKeys().has(key)) {
            inputGates.push(inputGate.ofSize(inputSpans[inputGates.length]));
        }
    }
    inputSpans = inputSpans.slice(0, inputGates.length);

    let dstWire = 0;
    let wireCount = dstWire + gate.height;
    let inpWires = new Array(inputGates.length);
    for (let i = 0; i < inputGates.length; i++) {
        if (Math.random() < 0.2) {
            wireCount += 1;
        }
        inpWires[i] = wireCount;
        wireCount += inputGates[i].height;
    }

    // Useful facts.
    let dstMask = ((1 << gate.height) - 1) << dstWire;
    let inpMasks = seq(inpWires).zip(inputGates, (off, g) => ((1 << g.height) - 1) << off).toArray();

    // Make permutation matrix.
    let fullPermutation = val => {
        let dst = (val & dstMask) >> dstWire;
        let inps = seq(inpMasks).zip(inpWires, (m, w) => (val & m) >> w).toArray();
        let out = permutationFunc(dst, ...inps);
        return (val & ~dstMask) | out;
    };

    // Make circuit.
    let col = new Array(wireCount).fill(undefined);
    for (let i = 0; i < inputSpans.length; i++) {
        col[inpWires[i]] = inputGates[i];
    }
    col[dstWire] = gate;
    let circuit = new CircuitDefinition(wireCount, [new GateColumn(col)]);

    if (circuit.gateAtLocIsDisabledReason(0, 0) !== undefined) {
        if (ignoreTargetEndsUpDisabled) {
            return;
        }
        assertThat(circuit.gateAtLocIsDisabledReason(0, 0)).withInfo({gate}).isEqualTo(undefined);
    }

    let updateAction = ctx => advanceStateWithCircuit(ctx, circuit, false);
    assertThatCircuitUpdateActsLikePermutation(
        wireCount,
        updateAction,
        fullPermutation,
        {
            gate_id: gate.serializedId,
            dstWire,
            inpWires,
            inputSpans
        });
}

/**
 * @param {!Gate} gate
 * @param {!function(target : !int) : !number} phaserFunc
 * @param {!number|undefined=} forcedTime
 */
function assertThatGateActsLikePhaser(gate, phaserFunc, forcedTime=undefined) {
    let wireCount = gate.height;
    let col = new Array(wireCount).fill(undefined);
    col[0] = gate;
    let circuit = new CircuitDefinition(wireCount, [new GateColumn(col)]);
    let matrix = Matrix.generateDiagonal(1 << wireCount, k => Complex.polar(1, phaserFunc(k)*Math.PI*2));
    let updateAction = ctx => advanceStateWithCircuit(ctx, circuit, false);
    assertThatCircuitMutationActsLikeMatrix_single(updateAction, matrix, forcedTime);
}

/**
 * @param {function(!CircuitEvalContext)} updateAction
 * @param {!Matrix} matrix
 * @param {!int=} repeats
 * @param {!number|undefined=} forcedTime
 */
function assertThatCircuitUpdateActsLikeMatrix(updateAction, matrix, repeats=5, forcedTime=undefined) {
    for (let i = 0; i < repeats; i++) {
        assertThatCircuitMutationActsLikeMatrix_single(updateAction, matrix, forcedTime);
    }
}

/**
 * @param {function(!CircuitEvalContext)} updateAction
 * @param {!Matrix} matrix
 * @param {!number|undefined=} forcedTime
 */
function assertThatCircuitMutationActsLikeMatrix_single(updateAction, matrix, forcedTime=undefined) {
    let qubitSpan = Math.round(Math.log2(matrix.height()));
    let extraWires = Math.floor(Math.random()*5);
    let time = Math.random();
    let qubitIndex = Math.floor(Math.random() * extraWires);
    if (USE_SIMPLE_VALUES) {
        extraWires = 0;
        time = 0;
        qubitIndex = 0;
    }
    if (forcedTime !== undefined) {
        time = forcedTime;
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
        controls,
        trader,
        new Map());
    updateAction(ctx);

    controlsTexture.deallocByDepositingInPool();
    let outData = KetTextureUtil.tradeTextureForVec2Output(trader);
    let outVec = new Matrix(1, ampCount, outData);

    let expectedOutVec = matrix.applyToStateVectorAtQubitWithControls(inVec, qubitIndex, controls);

    assertThat(outVec).withInfo({matrix, inVec, ctx}).isApproximatelyEqualTo(expectedOutVec, 0.005);
}

/**
 * @param {!int} wireCount The number of wires in the circuit.
 * @param {!function(!CircuitEvalContext) : !WglConfiguredShader} shaderMaker Makes the shader to apply.
 * @param {!function(!int) : !int} permutation The expected permutation.
 * @param {*} permuteInfo Debug info included when the assertion fails.
 */
function assertThatCircuitShaderActsLikePermutation(wireCount, shaderMaker, permutation, permuteInfo=undefined) {
    assertThatCircuitUpdateActsLikePermutation(
        wireCount,
        ctx => ctx.applyOperation(shaderMaker(ctx)),
        permutation,
        permuteInfo)
}

/**
 * @param {!int} wireCount The number of wires in the circuit.
 * @param {!function(!CircuitEvalContext)} updateAction The actual update action.
 * @param {!function(!int) : !int} permutation The expected permutation.
 * @param {*} permuteInfo Debug info included when the assertion fails.
 */
function assertThatCircuitUpdateActsLikePermutation(wireCount, updateAction, permutation, permuteInfo=undefined) {
    let time = Math.random();

    let ampCount = 1 << wireCount;
    let inVec = Matrix.generate(1, ampCount, r => new Complex(r + Math.random(), Math.random()*1000));
    let tex = Shaders.vec2Data(inVec.rawBuffer()).toVec2Texture(wireCount);
    let trader = new WglTextureTrader(tex);
    let controlsTexture = CircuitShaders.controlMask(Controls.NONE).toBoolTexture(wireCount);
    let ctx = new CircuitEvalContext(
        time,
        0,
        wireCount,
        Controls.NONE,
        controlsTexture,
        Controls.NONE,
        trader,
        new Map());
    updateAction(ctx);

    controlsTexture.deallocByDepositingInPool();
    let outData = KetTextureUtil.tradeTextureForVec2Output(trader);
    let outVec = new Matrix(1, ampCount, outData);

    for (let i = 0; i < ampCount; i++) {
        let j = permutation(i);
        let inVal = inVec.cell(0, i);
        let outVal = outVec.cell(0, j);
        if (!outVal.isApproximatelyEqualTo(inVal, 0.001)) {
            let actualIn = Math.floor(outVec.cell(0, j).real);
            let actualOut = Seq.range(ampCount).filter(k => Math.floor(outVec.cell(0, k).real) === i).first('[NONE]');
            assertThat(outVal).
                withInfo({i, j, actualIn, actualOut, permuteInfo}).
                isApproximatelyEqualTo(inVal, 0.01);
        }
    }

    // Increment assertion count.
    assertTrue(true);
}

export {
    assertThatCircuitUpdateActsLikeMatrix,
    assertThatCircuitShaderActsLikeMatrix,
    assertThatGateActsLikePermutation,
    assertThatCircuitOutputsBasisKet,
    assertThatCircuitUpdateActsLikePermutation,
    assertThatCircuitShaderActsLikePermutation,
    assertThatGateActsLikePhaser,
}
