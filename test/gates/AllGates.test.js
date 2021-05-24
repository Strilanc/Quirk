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

import {Suite, assertThat} from "../TestUtil.js"
import {Gates} from "../../src/gates/AllGates.js"

import {CircuitEvalContext} from "../../src/circuit/CircuitEvalContext.js"
import {CircuitShaders} from "../../src/circuit/CircuitShaders.js"
import {Controls} from "../../src/circuit/Controls.js"
import {Matrix} from "../../src/math/Matrix.js"
import {Gate} from "../../src/circuit/Gate.js"
import {seq} from "../../src/base/Seq.js"
import {WglTextureTrader} from "../../src/webgl/WglTextureTrader.js"
import {currentShaderCoder} from "../../src/webgl/ShaderCoders.js"
import {
    assertThatGateActsLikePermutation,
    assertThatGateActsLikePhaser
} from "../CircuitOperationTestUtil.js"

let suite = new Suite("AllGates");

/**
 * @param {!Gate} gate
 * @param {!number} time
 * @returns {undefined|!Matrix}
 */
let reconstructMatrixFromGateCustomOperation = (gate, time) => {
    if (gate.customOperation === undefined) {
        return undefined;
    }

    let bit = 0;
    let numQubits = gate.height;
    let n = 1 << numQubits;
    let control = CircuitShaders.controlMask(Controls.NONE).toBoolTexture(numQubits);
    let cols = [];
    for (let i = 0; i < n; i++) {
        let trader = new WglTextureTrader(CircuitShaders.classicalState(i).toVec2Texture(numQubits));
        let ctx = new CircuitEvalContext(
            time,
            bit,
            numQubits,
            Controls.NONE,
            control,
            Controls.NONE,
            trader,
            new Map());
        gate.customOperation(ctx);
        let buf = currentShaderCoder().vec2.pixelsToData(trader.currentTexture.readPixels());
        let col = new Matrix(1, 1 << numQubits, buf);
        trader.currentTexture.deallocByDepositingInPool();
        cols.push(col);
    }
    control.deallocByDepositingInPool();

    let raw = seq(cols).flatMap(e => e.rawBuffer()).toFloat32Array();
    let flipped = new Matrix(n, n, raw);
    return flipped.transpose();
};

/**
 * @param {!Gate} gate
 * @returns {!Matrix}
 */
let reconstructMatrixFromKnownBitPermutation = gate => {
    return Matrix.generateTransition(1<<gate.height, input => {
        let out = 0;
        for (let i = 0; i < gate.height; i++) {
            if ((input & (1<<i)) !== 0) {
                out |= 1<<gate.knownBitPermutationFunc(i);
            }
        }
        return out;
    });
};

suite.test("allGatesAreGates", () => {
    for (let gate of Gates.KnownToSerializer) {
        assertThat(gate instanceof Gate).withInfo({gate, type: typeof gate}).isEqualTo(true);
    }
});

suite.testUsingWebGL("customShaderMatchesKnownMatrix", () => {
    let time = 6/7;
    for (let gate of Gates.KnownToSerializer) {
        if (gate.height > 4) {
            continue;
        }

        let matrix = gate.knownMatrixAt(time);
        if (matrix === undefined) {
            continue;
        }

        let reconstructed = reconstructMatrixFromGateCustomOperation(gate, time);
        if (reconstructed === undefined) {
            continue;
        }

        assertThat(reconstructed).withInfo({gate, time}).isApproximatelyEqualTo(matrix, 0.0005);
    }
});

suite.testUsingWebGL("knownBitPermutationMatchesKnowMatrixAndCustomShader", () => {
    let time = 6/7;
    for (let gate of Gates.KnownToSerializer) {
        if (gate.height > 6 || gate.knownBitPermutationFunc === undefined) {
            continue;
        }

        let permuteBitsMatrix = reconstructMatrixFromKnownBitPermutation(gate);

        let knownMatrix = gate.knownMatrixAt(time);
        if (knownMatrix !== undefined) {
            assertThat(knownMatrix).withInfo(gate).isEqualTo(permuteBitsMatrix);
        }

        let shaderMatrix = reconstructMatrixFromGateCustomOperation(gate, time);
        if (shaderMatrix !== undefined) {
            assertThat(shaderMatrix).withInfo(gate).isEqualTo(permuteBitsMatrix);
        }
    }
});

suite.testUsingWebGL("gatesActLikeTheirKnownPermutation", () => {
    for (let gate of Gates.KnownToSerializer) {
        if (gate.knownPermutationFuncTakingInputs !== undefined && gate.height <= 3) {
            assertThatGateActsLikePermutation(gate, gate.knownPermutationFuncTakingInputs, [2, 2, 2], true);
        }
    }
});

suite.testUsingWebGL("gatesActLikeTheirKnownPhasingFunction", () => {
    for (let gate of Gates.KnownToSerializer) {
        if (gate.knownPhaseTurnsFunc !== undefined && gate.height <= 3) {
            assertThatGateActsLikePhaser(gate, gate.knownPhaseTurnsFunc);
        }
    }
});

suite.test("knownNonUnitaryGates", () => {
    let nonUnitaryGates = new Set(Gates.KnownToSerializer.
        filter(g => !g.isDefinitelyUnitary()).
        map(g => g.serializedId));
    assertThat(nonUnitaryGates).isEqualTo(new Set([
        '__error__',
        '__unstable__UniversalNot',
        // Post-selection isn't unitary.
        '0',
        '|0⟩⟨0|',
        '|1⟩⟨1|',
        '|+⟩⟨+|',
        '|-⟩⟨-|',
        '|X⟩⟨X|',
        '|/⟩⟨/|',
        // Collapsing measurement isn't unitary.
        'XDetector',
        'YDetector',
        'ZDetector',
        // Especially if you reset the qubit afterwards.
        'XDetectControlReset',
        'YDetectControlReset',
        'ZDetectControlReset',
    ]));
});

suite.test("knownDoNothingGateFamilies", () => {
    let doNothingFamilies = new Set(Gates.KnownToSerializer.
        filter(g => g.definitelyHasNoEffect()).
        map(g => g.gateFamily[0].serializedId));
    assertThat(doNothingFamilies).isEqualTo(new Set([
        // Measurement technically does something, but internally it's deferred and handled special almost everywhere.
        'Measure',
        // Z basis operation modifiers technically do things, but we assign the effects to the operation itself.
        '•',
        '◦',
        'zpar',
        'inputA1',
        'inputB1',
        'inputR1',
        'revinputA1',
        'revinputB1',
        'setA',
        'setB',
        'setR',
        // Displays don't have effects.
        'Amps1',
        'Chance',
        'Sample1',
        'Density',
        'Bloch',
        // Spacer gate.
        '…'
    ]));
});

suite.test("knownDynamicGateFamilies", () => {
    let dynamicFamilies = new Set(Gates.KnownToSerializer.
        filter(g => g.stableDuration() !== Infinity).
        map(g => g.gateFamily[0].serializedId));
    assertThat(dynamicFamilies).isEqualTo(new Set([
        // Dynamic displays.
        'Sample1',
        // Qubit rotating gates.
        'X^t', 'Y^t', 'Z^t',
        'X^-t', 'Y^-t', 'Z^-t',
        'X^ft', 'Y^ft', 'Z^ft',
        'Rxft', 'Ryft', 'Rzft',
        'e^iXt', 'e^iYt', 'e^iZt',
        'e^-iXt', 'e^-iYt', 'e^-iZt',
        // Discrete cycles.
        'Counting1',
        'Uncounting1',
        '>>t2',
        '<<t2',
        'X^⌈t⌉',
        'X^⌈t-¼⌉',
        // Other.
        'grad^t1',
        'grad^-t1',
        'XDetector',
        'YDetector',
        'ZDetector',
        'XDetectControlReset',
        'YDetectControlReset',
        'ZDetectControlReset',
    ]));
});
