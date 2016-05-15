import { Suite, assertThat } from "test/TestUtil.js"
import DisplayShaders from "src/circuit/DisplayShaders.js"

import CircuitShaders from "src/circuit/CircuitShaders.js"
import Controls from "src/circuit/Controls.js"
import Shaders from "src/webgl/Shaders.js"

let suite = new Suite("DisplayShaders");

suite.webGlTest("qubitOperation_controls", () => {
    let inp = Shaders.data(new Float32Array([
        2, 3, 0, 0,
        4, 5, 0, 0,
        6, 7, 0, 0,
        8, 9, 0, 0,
        1/2, 0, 0, 0,
        0, 1/4, 0, 0,
        0, 0, 1/8, 0,
        0, 0, 0, 1/16
    ])).toFloatTexture(4, 2);

    let con = CircuitShaders.controlMask(Controls.NONE).toFloatTexture(4, 4);
    assertThat(DisplayShaders.amplitudesToProbabilities(inp, con).readFloatOutputs(8, 1)).isEqualTo(new Float32Array([
        4+9, 0, 0, 0,
        16+25, 0, 0, 0,
        36+49, 0, 0, 0,
        64+81, 0, 0, 0,
        1/4, 0, 0, 0,
        1/16, 0, 0, 0,
        1/64, 0, 0, 0,
        1/256, 0, 0, 0
    ]));
});
