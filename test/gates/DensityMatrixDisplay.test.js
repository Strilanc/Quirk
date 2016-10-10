import {Suite, assertThat} from "test/TestUtil.js"
import {amplitudesToCouplings} from "src/gates/DensityMatrixDisplayFamily.js"
import {Shaders} from "src/webgl/Shaders.js"

let suite = new Suite("DensityMatrixDisplay");

suite.webGlTest("amplitudesToCouplings", () => {
    let s = Math.sqrt(0.5);
    let inp = Shaders.vec2Data(new Float32Array([
        s,0,
        0,0,
        0,0,
        s,0
    ])).toVec2Texture(2);

    assertThat(amplitudesToCouplings(inp, 1).readVec2Outputs(3)).isApproximatelyEqualTo(new Float32Array([
        0.5,0,   0,0,
        0,  0,   0,0,

        0,  0,   0,0,
        0,  0,   0.5,0
    ]));
    assertThat(amplitudesToCouplings(inp, 2).readVec2Outputs(4)).isApproximatelyEqualTo(new Float32Array([
        0.5,0, 0,0, 0,0, 0.5,0,
        0,0,   0,0, 0,0, 0,0,
        0,0,   0,0, 0,0, 0,0,
        0.5,0, 0,0, 0,0, 0.5,0
    ]));
});
