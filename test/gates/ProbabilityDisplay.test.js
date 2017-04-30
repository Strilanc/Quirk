import {Suite, assertThat} from "test/TestUtil.js"
import {amplitudesToProbabilities} from "src/gates/ProbabilityDisplay.js"

import {CircuitShaders} from "src/circuit/CircuitShaders.js"
import {Controls} from "src/circuit/Controls.js"
import {Shaders} from "src/webgl/Shaders.js"

let suite = new Suite("ProbabilityDisplay");

suite.testUsingWebGL("amplitudesToProbabilities", () => {
    let inp = Shaders.vec2Data(new Float32Array([
        2, 3,
        4, 5,
        6, 7,
        8, 9,
        1/2, 0,
        0, 1/4,
        0, 1/8,
        1/16, 0
    ])).toVec2Texture(3);

    let con = CircuitShaders.controlMask(Controls.NONE).toBoolTexture(3);
    assertThat(amplitudesToProbabilities(inp, con).readVecFloatOutputs(3)).isApproximatelyEqualTo(new Float32Array([
        4+9,
        16+25,
        36+49,
        64+81,
        1/4,
        1/16,
        1/64,
        1/256
    ]));

    inp.deallocByDepositingInPool();
    con.deallocByDepositingInPool();
});
