import {Suite, assertThat, assertThrows} from "test/TestUtil.js"
import {CircuitShaders} from "src/circuit/CircuitShaders.js"
import {universalNot} from "src/gates/Impossible_UniversalNotGate.js"

import {Controls} from "src/circuit/Controls.js"
import {Shaders} from "src/webgl/Shaders.js"

let suite = new Suite("GateShaders");

suite.webGlTest('universalNot', () => {
    let _ = 0;
    let input = Shaders.data(new Float32Array([
        1,2,_,_, 3,4,_,_,
        5,6,_,_, 7,8,_,_
    ])).toFloatTexture(2, 2);
    let assertAbout = (index, control) => assertThat(universalNot(
        input,
        CircuitShaders.controlMask(control).toFloatTexture(2, 2),
        index).readFloatOutputs(2, 2));
    assertAbout(0, Controls.NONE).isEqualTo(new Float32Array([
        3,-4,_,_, -1,2,_,_,
        7,-8,_,_, -5,6,_,_
    ]));
    assertAbout(1, Controls.NONE).isEqualTo(new Float32Array([
        5,-6,_,_, 7,-8,_,_,
        -1,2,_,_, -3,4,_,_
    ]));
    assertAbout(0, Controls.bit(1, true)).isEqualTo(new Float32Array([
        1,2,_,_, 3,4,_,_,
        7,-8,_,_, -5,6,_,_
    ]));
});
