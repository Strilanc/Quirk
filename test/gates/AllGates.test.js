import {Suite, assertThat} from "test/TestUtil.js"
import {Gates} from "src/gates/AllGates.js"

import {CircuitEvalContext} from "src/circuit/CircuitEvalContext.js"
import {CircuitShaders} from "src/circuit/CircuitShaders.js"
import {Controls} from "src/circuit/Controls.js"
import {Matrix} from "src/math/Matrix.js"
import {seq} from "src/base/Seq.js"
import {WglTextureTrader} from "src/webgl/WglTextureTrader.js"
import {currentShaderCoder} from "src/webgl/ShaderCoders.js"

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

        assertThat(reconstructed).withInfo({gate, time}).isApproximatelyEqualTo(matrix, 0.0001);
    }
});

suite.testUsingWebGL("knownBitPermutationMatchesKnowMatrixAndCustomShader", () => {
    let time = 6/7;
    for (let gate of Gates.KnownToSerializer) {
        if (gate.height > 4 || gate.knownBitPermutationFunc === undefined) {
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

suite.testUsingWebGL("knownNonUnitaryGates", () => {
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
        '|/⟩⟨/|'
    ]));
});

suite.testUsingWebGL("knownDoNothingGateFamilies", () => {
    let doNothingFamilies = new Set(Gates.KnownToSerializer.
        filter(g => g.definitelyHasNoEffect()).
        map(g => g.gateFamily[0].serializedId));
    assertThat(doNothingFamilies).isEqualTo(new Set([
        // Measurement technically does something, but internally it's deferred and handled special almost everywhere.
        'Measure',
        // Operation modifiers technically do things, but we assign the effects to the operation itself.
        '•',
        '◦',
        'inputA1',
        'inputB1',
        'revinputA1',
        'revinputB1',
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

suite.testUsingWebGL("knownDynamicGateFamilies", () => {
    let doNothingFamilies = new Set(Gates.KnownToSerializer.
        filter(g => g.stableDuration() !== Infinity).
        map(g => g.gateFamily[0].serializedId));
    assertThat(doNothingFamilies).isEqualTo(new Set([
        // Dynamic displays.
        'Sample1',
        // Qubit rotating gates.
        'X^t',
        'Y^t',
        'Z^t',
        'X^-t',
        'Y^-t',
        'Z^-t',
        'e^iXt',
        'e^iYt',
        'e^iZt',
        'e^-iXt',
        'e^-iYt',
        'e^-iZt',
        // Discrete cycles.
        'Counting1',
        'Uncounting1',
        '>>t2',
        '<<t2',
        'X^⌈t⌉',
        'X^⌈t-¼⌉'
    ]));
});
