import {Suite, assertThat} from "test/TestUtil.js"
import {cycleBits} from "src/gates/CycleBitsGates.js"

import {CircuitShaders} from "src/circuit/CircuitShaders.js"
import {Controls} from "src/circuit/Controls.js"
import {Seq} from "src/base/Seq.js"
import {Shaders} from "src/webgl/Shaders.js"

let suite = new Suite("CycleBitsGates");

suite.webGlTest('cycleBits', () => {
    let actual = cycleBits(
        Shaders.data(Seq.range(4*16+1).skip(1).toFloat32Array()).toFloatTexture(4, 4),
        CircuitShaders.controlMask(Controls.NONE).toFloatTexture(4, 4),
        0,
        4,
        -1).readFloatOutputs(4, 4);
    assertThat(actual).isEqualTo(new Float32Array([
         1, 2, 3, 4,  9,10,11,12, 17,18,19,20, 25,26,27,28,
        33,34,35,36, 41,42,43,44, 49,50,51,52, 57,58,59,60,
         5, 6, 7, 8, 13,14,15,16, 21,22,23,24, 29,30,31,32,
        37,38,39,40, 45,46,47,48, 53,54,55,56, 61,62,63,64
    ]));
});
