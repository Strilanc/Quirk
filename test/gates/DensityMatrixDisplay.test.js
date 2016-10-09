import {Suite, assertThat} from "test/TestUtil.js"
import {amplitudesToDensities} from "src/gates/DensityMatrixDisplayFamily.js"
import {Shaders} from "src/webgl/Shaders.js"

let suite = new Suite("DensityMatrixDisplay");

suite.webGlTest("amplitudesToDensities", () => {
    let s = Math.sqrt(0.5);
    let inp = Shaders.data(new Float32Array([
        s,0,0,0,
        0,0,0,0,
        0,0,0,0,
        s,0,0,0
    ])).toFloatTexture(2, 2);

    assertThat(amplitudesToDensities(inp, 1).readFloatOutputs(4, 2)).isApproximatelyEqualTo(new Float32Array([
        0.5,0,0,0, 0,0,0,0,
        0,0,0,0,   0,0,0,0,

        0,0,0,0, 0,0,0,0,
        0,0,0,0,   0.5,0,0,0
    ]));
    assertThat(amplitudesToDensities(inp, 2).readFloatOutputs(4, 4)).isApproximatelyEqualTo(new Float32Array([
        0.5,0,0,0, 0,0,0,0, 0,0,0,0, 0.5,0,0,0,
        0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0,
        0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0,
        0.5,0,0,0, 0,0,0,0, 0,0,0,0, 0.5,0,0,0
    ]));
});
