import { Suite, assertThat, assertThrows, assertTrue, assertFalse } from "test/TestUtil.js"
import {
    amplitudesToPolarKets,
    pipelineToSpreadLengthAcrossPolarKets,
    pipelineToAggregateRepresentativePolarKet,
    convertAwayFromPolar,
    toRatiosVsRepresentative,
    pipelineToFoldConsistentRatios,
    pipelineToSumAll
} from "src/gates/AmplitudeDisplayFamily.js"

import CircuitShaders from "src/circuit/CircuitShaders.js"
import CircuitTextures from "src/circuit/CircuitTextures.js"
import Complex from "src/math/Complex.js"
import Controls from "src/circuit/Controls.js"
import {seq, Seq} from "src/base/Seq.js"
import Shaders from "src/webgl/Shaders.js"

let suite = new Suite("AmplitudeDisplayFamily");

suite.test("amplitudesToPolarKets", () => {
    let input = Shaders.data(new Float32Array([
        1,0,0,0,
        3,4,0,0,
        -1,1,0,0,
        0,0.5,0,0
    ])).toFloatTexture(4, 1);
    assertThat(amplitudesToPolarKets(input).readFloatOutputs(2, 2)).isApproximatelyEqualTo(new Float32Array([
        1,0,1,0,
        25,new Complex(3,4).phase(),25,0,
        2,Math.PI*3/4,2,0,
        0.25,Math.PI/2,0.25,0
    ]), 0.0001);
});

suite.test("pipelineToSpreadLengthAcrossPolarKets", () => {
    let inp = Shaders.data(new Float32Array([
        1, 2,100,0,
        3, 4,200,0,
        5, 6,400,0,
        7, 8,800,0,
        9,10,1600,0,
        11,12,3200,0,
        13,14,6400,0,
        15,16,12800,0
    ])).toFloatTexture(8, 1);
    let out;

    out = CircuitTextures.evaluatePipelineWithIntermediateCleanup(inp, pipelineToSpreadLengthAcrossPolarKets(1, 3));
    assertThat(out.readPixels()).isEqualTo(new Float32Array([
        1, 2,300,0,
        3, 4,300,0,
        5, 6,1200,0,
        7, 8,1200,0,
        9,10,4800,0,
        11,12,4800,0,
        13,14,19200,0,
        15,16,19200,0
    ]));
    CircuitTextures.doneWithTexture(out);

    out = CircuitTextures.evaluatePipelineWithIntermediateCleanup(inp, pipelineToSpreadLengthAcrossPolarKets(2, 3));
    assertThat(out.readPixels()).isEqualTo(new Float32Array([
        1, 2,1500,0,
        3, 4,1500,0,
        5, 6,1500,0,
        7, 8,1500,0,
        9,10,24000,0,
        11,12,24000,0,
        13,14,24000,0,
        15,16,24000,0
    ]));
    CircuitTextures.doneWithTexture(out);


    out = CircuitTextures.evaluatePipelineWithIntermediateCleanup(inp, pipelineToSpreadLengthAcrossPolarKets(3, 3));
    assertThat(out.readPixels()).isEqualTo(new Float32Array([
        1, 2,25500,0,
        3, 4,25500,0,
        5, 6,25500,0,
        7, 8,25500,0,
        9,10,25500,0,
        11,12,25500,0,
        13,14,25500,0,
        15,16,25500,0
    ]));
    CircuitTextures.doneWithTexture(out);
});

suite.test("pipelineToAggregateRepresentativePolarKet", () => {
    let inp = Shaders.data(new Float32Array([
         1, 2,300,0,
         3, 4,300,0,
         5, 6,1200,0,
         7, 8,1200,0,
         9,10,4800,0,
        11,12,4800,0,
        13,14,19200,0,
        15,16,19200,0
    ])).toFloatTexture(8, 1);
    let out;

    out = CircuitTextures.evaluatePipelineWithIntermediateCleanup(inp, pipelineToAggregateRepresentativePolarKet(1, 3));
    assertThat(out.readPixels()).isEqualTo(new Float32Array([
        1+5+9+13,14,25500,0,    3+7+11+15,16,25500,0
    ]));
    CircuitTextures.doneWithTexture(out);

    let in2 = Shaders.data(new Float32Array([
        1, 2,300,0,
        3, 4,300,0,
        55,6,120000,0,
        7, 8,1200,0,
        9,10,4800,0,
        11,12,4800,0,
        13,14,19200,0,
        15,16,19200,0
    ])).toFloatTexture(8, 1);
    out = CircuitTextures.evaluatePipelineWithIntermediateCleanup(in2, pipelineToAggregateRepresentativePolarKet(1, 3));
    assertThat(out.readPixels()).isEqualTo(new Float32Array([
        1+55+9+13,6,144300,0,    3+7+11+15,16,25500,0
    ]));
    CircuitTextures.doneWithTexture(out);
});

suite.test("convertAwayFromPolar", () => {
    let input = Shaders.data(new Float32Array([
        1,0,3,0,
        25,new Complex(3,4).phase(),9,0,
        2,Math.PI*3/4,10,0,
        0.25,Math.PI/2,20,0
    ])).toFloatTexture(4, 1);
    assertThat(convertAwayFromPolar(input).readFloatOutputs(2, 2)).isApproximatelyEqualTo(new Float32Array([
        1,0,3,0,
        3,4,9,0,
        -1,1,10,0,
        0,0.5,20,0
    ]), 0.0001);
});

suite.test("toRatiosVsRepresentative", () => {
    let c = (r, i=0) => new Complex(r, i);
    let inp = Shaders.data(new Float32Array([
        1,0,0,0,    1,0,0,0,    1,0,0,0,    1,0,0,0,
        2,0,0,0,    3,0,0,0,    4,0,0,0,    5,0,0,0,
        1,2,0,0,    3,4,0,0,    5,6,0,0,    7,8,0,0,
        0,0,0,0,    0,-1,0,0,   0,-2,0,0,   0,0,0,0
    ])).toFloatTexture(4, 4);
    let rep = Shaders.data(new Float32Array([
        1,0,0,0,    3,4,0,0,    -0.5,0,0,0,    0,0.5,0,0
    ])).toFloatTexture(4, 1);
    assertThat(toRatiosVsRepresentative(inp)(rep).readFloatOutputs(4, 4)).isApproximatelyEqualTo(seq([
        c(1),c(1),   c(1),c(3,4),    c(1),c(-0.5),    c(1),c(0,0.5),
        c(2),c(1),   c(3),c(3,4),    c(4),c(-0.5),    c(5),c(0,0.5),
        c(1,2),c(1), c(3,4),c(3,4),  c(5,6),c(-0.5),  c(7,8),c(0,0.5),
        c(0),c(1),   c(0,-1),c(3,4), c(0,-2),c(-0.5), c(0),c(0,0.5)
    ]).flatMap(e => [e.real, e.imag]).toFloat32Array(), 0.0001);
});

suite.test("pipelineToFoldConsistentRatios", () => {
    let inp = Shaders.data(new Float32Array([
        1,0,0,0,    2,0,0,0,
        0,0,1,0,    0,0,2,3,
        1,0,1,0,    2,0,2,0,
        1,0,3,0,    2,0,6,0,
        1,0,0,1,    0,-1,1,0,
        1,2,3,4,    2,-1,4,-3,
        1,2,3,4,    1,2,3,5,
        1,0,2,0,    1,0,3,0
    ])).toFloatTexture(8, 2);
    let out;

    out = CircuitTextures.evaluatePipelineWithIntermediateCleanup(inp, pipelineToFoldConsistentRatios(1, 4));
    assertThat(out.readPixels()).isEqualTo(new Float32Array([
        2,0,0,0,
        0,0,2,3,
        2,0,2,0,
        2,0,6,0,
        1,0,0,1,
        1,2,3,4,
        NaN,NaN,NaN,NaN,
        NaN,NaN,NaN,NaN
    ]));
    CircuitTextures.doneWithTexture(out);

    out = CircuitTextures.evaluatePipelineWithIntermediateCleanup(inp, pipelineToFoldConsistentRatios(2, 4));
    assertThat(out.readPixels()).isEqualTo(new Float32Array([
        NaN,NaN,NaN,NaN,
        NaN,NaN,NaN,NaN,
        NaN,NaN,NaN,NaN,
        NaN,NaN,NaN,NaN
    ]));
    CircuitTextures.doneWithTexture(out);

    inp = Shaders.data(new Float32Array([
        1,0,0,0,    20,0,0,0,   0,0,0,0,  3,1,0,0,
        1,0,0,0,    0,0,2,0,   0,0,0,0,  1,0,0,0,
        0,0,0,0,    0,0,0,0,   0,0,0,0,  0,0,0,0,
        NaN,0,0,0,  0,0,0,0,   0,0,0,0,  0,0,0,0
    ])).toFloatTexture(4, 4);
    out = CircuitTextures.evaluatePipelineWithIntermediateCleanup(inp, pipelineToFoldConsistentRatios(2, 4));
    assertThat(out.readPixels()).isEqualTo(new Float32Array([
        20,0,0,0,
        NaN,NaN,NaN,NaN,
        0,0,0,0,
        NaN,NaN,NaN,NaN
    ]));
    CircuitTextures.doneWithTexture(out);
});

suite.test("pipelineToSumAll", () => {
    let inp = Shaders.data(new Float32Array([
        2,0,0,0,
        0,0,2,3,
        2,0,2,0,
        2,0,6,0,
        1,0,0,1,
        1,2,3,4,
        1,2,3,4,
        1,2,3,4
    ])).toFloatTexture(4, 2);
    let out;

    out = CircuitTextures.evaluatePipelineWithIntermediateCleanup(inp, pipelineToSumAll(4, 2));
    assertThat(out.readPixels()).isEqualTo(new Float32Array([
        10,6,19,16
    ]));
    CircuitTextures.doneWithTexture(out);
});
