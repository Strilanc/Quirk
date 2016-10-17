import {Suite, assertThat, assertThrows, assertTrue, assertFalse} from "test/TestUtil.js"
import {Gates} from "src/gates/AllGates.js"

import {CircuitEvalContext} from "src/circuit/CircuitEvalContext.js"
import {CircuitShaders} from "src/circuit/CircuitShaders.js"
import {KetTextureUtil} from "src/circuit/KetTextureUtil.js"
import {Controls} from "src/circuit/Controls.js"
import {Matrix} from "src/math/Matrix.js"
import {seq, Seq} from "src/base/Seq.js"
import {WglTexturePool} from "src/webgl/WglTexturePool.js"
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
        let buf = currentShaderCoder().unpackVec2Data(trader.currentTexture.readPixels());
        let col = new Matrix(1, 1 << numQubits, buf);
        trader.currentTexture.deallocByDepositingInPool();
        cols.push(col);
    }
    control.deallocByDepositingInPool();

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

        let reconstructed = reconstructMatrixFromGateCustomOperation(gate, time);
        if (reconstructed === undefined) {
            continue;
        }

        assertThat(reconstructed).withInfo({gate, time}).isApproximatelyEqualTo(matrix, 0.0001);
    }
});
