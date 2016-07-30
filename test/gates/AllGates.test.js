import { Suite, assertThat, assertThrows, assertTrue, assertFalse } from "test/TestUtil.js"
import Gates from "src/gates/AllGates.js"

import CircuitEvalArgs from "src/circuit/CircuitEvalArgs.js"
import CircuitShaders from "src/circuit/CircuitShaders.js"
import CircuitTextures from "src/circuit/CircuitTextures.js"
import Controls from "src/circuit/Controls.js"
import Matrix from "src/math/Matrix.js"
import {seq, Seq} from "src/base/Seq.js"

let suite = new Suite("AllGates");

/**
 * @param {!Gate} gate
 * @param {!number} time
 * @returns {undefined|!Matrix}
 */
let reconstructMatrixFromGateShaders = (gate, time) => {
    if (gate.customShaders === undefined) {
        return undefined;
    }

    let bit = 0;
    let numQubits = gate.height;
    let n = 1 << numQubits;
    let input = CircuitTextures.allocQubitTexture(numQubits);
    let control = CircuitTextures.control(numQubits, Controls.NONE);
    let cols = [];
    for (let i = 0; i < n; i++) {
        CircuitShaders.classicalState(i).renderTo(input);
        let output = CircuitTextures.aggregateReusingIntermediates(
            input,
            gate.customShaders.map(f => (inTex, conTex, t) => f(inTex, conTex, bit, t)),
            (accTex, shaderFunc) => CircuitTextures.applyCustomShader(shaderFunc, new CircuitEvalArgs(
                time,
                bit,
                Controls.NONE,
                control,
                accTex,
                new Map())));
        let col = CircuitTextures.pixelsToAmplitudes(output.readPixels(), 1.0);
        CircuitTextures.doneWithTexture(output);
        cols.push(col);
    }
    let raw = seq(cols).flatMap(e => e.rawBuffer()).toFloat32Array();
    let flipped = new Matrix(n, n, raw);
    return flipped.transpose();
};

suite.webGlTest("shaderMatchesMatrix", () => {
    let time = 6/7;
    for (let gate of Gates.KnownToSerializer) {
        if (gate.height > 4) {
            continue;
        }

        let matrix = gate.knownMatrixAt(time);
        if (matrix === undefined) {
            continue;
        }

        let reconstructed = reconstructMatrixFromGateShaders(gate, time);
        if (reconstructed === undefined) {
            continue;
        }

        assertThat(reconstructed).withInfo({gate, time}).isApproximatelyEqualTo(matrix, 0.0001);
    }
});
