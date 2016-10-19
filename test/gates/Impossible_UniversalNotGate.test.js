import {Suite, assertThat, assertThrows} from "test/TestUtil.js"
import {CircuitEvalContext} from "src/circuit/CircuitEvalContext.js"
import {CircuitShaders} from "src/circuit/CircuitShaders.js"
import {universalNot} from "src/gates/Impossible_UniversalNotGate.js"

import {Controls} from "src/circuit/Controls.js"
import {Shaders} from "src/webgl/Shaders.js"
import {KetTextureUtil} from "src/circuit/KetTextureUtil.js"
import {WglTextureTrader} from "src/webgl/WglTextureTrader.js"

let suite = new Suite("GateShaders");

suite.testUsingWebGL('universalNot', () => {
    let input = Shaders.vec2Data(new Float32Array([
        1,2, 3,4,
        5,6, 7,8
    ])).toVec2Texture(2);
    let assertAbout = (index, control) => {
        let controlTex = CircuitShaders.controlMask(control).toBoolTexture(2);
        let trader = new WglTextureTrader(input);
        trader.dontDeallocCurrentTexture();
        let ctx = new CircuitEvalContext(
            0,
            index,
            2,
            control,
            controlTex,
            trader,
            new Map());
        try {
            return assertThat(universalNot(ctx).readVec2Outputs(2));
        } finally {
            controlTex.deallocByDepositingInPool();
        }
    };
    assertAbout(0, Controls.NONE).isEqualTo(new Float32Array([
        3,-4, -1,2,
        7,-8, -5,6
    ]));
    assertAbout(1, Controls.NONE).isEqualTo(new Float32Array([
        5,-6, 7,-8,
        -1,2, -3,4
    ]));
    assertAbout(0, Controls.bit(1, true)).isEqualTo(new Float32Array([
        1,2,  3,4,
        7,-8, -5,6
    ]));

    input.deallocByDepositingInPool();
});
