import {Suite, assertThat, assertThrows, assertTrue, assertFalse} from "test/TestUtil.js"
import {
    amplitudesToPolarKets,
    convertAwayFromPolar,
    makeAmplitudeSpanPipeline,
    pipelineToAggregateRepresentativePolarKet,
    pipelineToFoldConsistentRatios,
    pipelineToSpreadLengthAcrossPolarKets,
    pipelineToSumAll,
    toRatiosVsRepresentative
} from "src/gates/AmplitudeDisplayFamily.js"

import {CircuitShaders} from "src/circuit/CircuitShaders.js"
import {KetTextureUtil} from "src/circuit/KetTextureUtil.js"
import {Complex} from "src/math/Complex.js"
import {Controls} from "src/circuit/Controls.js"
import {seq, Seq} from "src/base/Seq.js"
import {Shaders} from "src/webgl/Shaders.js"
import {workingShaderCoder} from "src/webgl/ShaderCoders.js"

let suite = new Suite("AmplitudeDisplayFamily");

suite.webGlTest("amplitudesToPolarKets", () => {
    let input = Shaders.vec2Data(new Float32Array([
        1,0,
        3,4,
        -1,1,
        0,0.5
    ])).toVec2Texture(2);
    assertThat(amplitudesToPolarKets(input).readVec4Outputs(2)).isApproximatelyEqualTo(new Float32Array([
        1,0,1,0,
        25,new Complex(3,4).phase(),25,0,
        2,Math.PI*3/4,2,0,
        0.25,Math.PI/2,0.25,0
    ]), 0.0001);
});

suite.webGlTest("amplitudesToPolarKets_zero", () => {
    let input = Shaders.vec2Data(new Float32Array([
        0,0
    ])).toVec2Texture(0);
    assertThat(amplitudesToPolarKets(input).readVec4Outputs(0)).isEqualTo(new Float32Array([
        0,0,0,0
    ]));
});

suite.webGlTest("pipelineToSpreadLengthAcrossPolarKets", () => {
    let inp = Shaders.vec4Data(new Float32Array([
        1, 2,100,0,
        3, 4,200,0,
        5, 6,400,0,
        7, 8,800,0,
        9,10,1600,0,
        11,12,3200,0,
        13,14,6400,0,
        15,16,12800,0
    ])).toVec4Texture(3);
    let out;

    out = KetTextureUtil.evaluatePipelineWithIntermediateCleanup(inp, pipelineToSpreadLengthAcrossPolarKets(1, 3));
    assertThat(workingShaderCoder.unpackVec4Data(out.readPixels())).isEqualTo(new Float32Array([
         1, 2,300,0,
         3, 4,300,0,
         5, 6,1200,0,
         7, 8,1200,0,
         9,10,4800,0,
        11,12,4800,0,
        13,14,19200,0,
        15,16,19200,0
    ]));
    KetTextureUtil.doneWithTexture(out);

    out = KetTextureUtil.evaluatePipelineWithIntermediateCleanup(inp, pipelineToSpreadLengthAcrossPolarKets(2, 3));
    assertThat(workingShaderCoder.unpackVec4Data(out.readPixels())).isEqualTo(new Float32Array([
        1, 2,1500,0,
        3, 4,1500,0,
        5, 6,1500,0,
        7, 8,1500,0,
        9,10,24000,0,
        11,12,24000,0,
        13,14,24000,0,
        15,16,24000,0
    ]));
    KetTextureUtil.doneWithTexture(out);


    out = KetTextureUtil.evaluatePipelineWithIntermediateCleanup(inp, pipelineToSpreadLengthAcrossPolarKets(3, 3));
    assertThat(workingShaderCoder.unpackVec4Data(out.readPixels())).isEqualTo(new Float32Array([
        1, 2,25500,0,
        3, 4,25500,0,
        5, 6,25500,0,
        7, 8,25500,0,
        9,10,25500,0,
        11,12,25500,0,
        13,14,25500,0,
        15,16,25500,0
    ]));
    KetTextureUtil.doneWithTexture(out);
});

suite.webGlTest("pipelineToAggregateRepresentativePolarKet", () => {
    let inp = Shaders.vec4Data(new Float32Array([
         1, 2,300,0,
         3, 4,300,0,
         5, 6,1200,0,
         7, 8,1200,0,
         9,10,4800,0,
        11,12,4800,0,
        13,14,19200,0,
        15,16,19200,0
    ])).toVec4Texture(3);
    let out;

    out = KetTextureUtil.evaluatePipelineWithIntermediateCleanup(inp, pipelineToAggregateRepresentativePolarKet(1, 3));
    assertThat(workingShaderCoder.unpackVec4Data(out.readPixels())).isEqualTo(new Float32Array([
        1+5+9+13,14,25500,0,    3+7+11+15,16,25500,0
    ]));
    KetTextureUtil.doneWithTexture(out);

    let in2 = Shaders.vec4Data(new Float32Array([
        1, 2,300,0,
        3, 4,300,0,
        55,6,120000,0,
        7, 8,1200,0,
        9,10,4800,0,
        11,12,4800,0,
        13,14,19200,0,
        15,16,19200,0
    ])).toVec4Texture(3);
    out = KetTextureUtil.evaluatePipelineWithIntermediateCleanup(in2, pipelineToAggregateRepresentativePolarKet(1, 3));
    assertThat(workingShaderCoder.unpackVec4Data(out.readPixels())).isEqualTo(new Float32Array([
        1+55+9+13,6,144300,0,
        3+7+11+15,16,25500,0
    ]));
    KetTextureUtil.doneWithTexture(out);
});

suite.webGlTest("convertAwayFromPolar", () => {
    let input = Shaders.vec4Data(new Float32Array([
        1,0,3,0,
        25,new Complex(3,4).phase(),9,0,
        2,Math.PI*3/4,10,0,
        0.25,Math.PI/2,20,0
    ])).toVec4Texture(2);
    assertThat(convertAwayFromPolar(input).readVec4Outputs(2)).isApproximatelyEqualTo(new Float32Array([
        1,0,3,0,
        3,4,9,0,
        -1,1,10,0,
        0,0.5,20,0
    ]), 0.0001);
});

suite.webGlTest("toRatiosVsRepresentative", () => {
    let c = (r, i=0) => new Complex(r, i);
    let inp = Shaders.vec2Data(new Float32Array([
        1,0,    1,0,    1,0,    1,0,
        2,0,    3,0,    4,0,    5,0,
        1,2,    3,4,    5,6,    7,8,
        0,0,    0,-1,   0,-2,   0,0
    ])).toVec2Texture(4);
    let rep = Shaders.vec4Data(new Float32Array([
        1,0,0,0,    3,4,0,0,    -0.5,0,0,0,    0,0.5,0,0
    ])).toVec4Texture(2);
    assertThat(toRatiosVsRepresentative(inp, rep).readVec4Outputs(4)).isApproximatelyEqualTo(seq([
        c(1),c(1),   c(1),c(3,4),    c(1),c(-0.5),    c(1),c(0,0.5),
        c(2),c(1),   c(3),c(3,4),    c(4),c(-0.5),    c(5),c(0,0.5),
        c(1,2),c(1), c(3,4),c(3,4),  c(5,6),c(-0.5),  c(7,8),c(0,0.5),
        c(0),c(1),   c(0,-1),c(3,4), c(0,-2),c(-0.5), c(0),c(0,0.5)
    ]).flatMap(e => [e.real, e.imag]).toFloat32Array(), 0.0001);
});

suite.webGlTest("pipelineToFoldConsistentRatios", () => {
    let inp = Shaders.vec4Data(new Float32Array([
        1,0,0,0,    2,0,0,0,
        0,0,1,0,    0,0,2,3,
        1,0,1,0,    2,0,2,0,
        1,0,3,0,    2,0,6,0,
        1,0,0,1,    0,-1,1,0,
        1,2,3,4,    2,-1,4,-3,
        1,2,3,4,    1,2,3,5,
        1,0,2,0,    1,0,3,0
    ])).toVec4Texture(4);
    let out;

    out = KetTextureUtil.evaluatePipelineWithIntermediateCleanup(inp, pipelineToFoldConsistentRatios(1, 4));
    assertThat(workingShaderCoder.unpackVec4Data(out.readPixels())).isEqualTo(new Float32Array([
        2,0,0,0,
        0,0,2,3,
        2,0,2,0,
        2,0,6,0,
        1,0,0,1,
        1,2,3,4,
        NaN,NaN,NaN,NaN,
        NaN,NaN,NaN,NaN
    ]));
    KetTextureUtil.doneWithTexture(out);

    out = KetTextureUtil.evaluatePipelineWithIntermediateCleanup(inp, pipelineToFoldConsistentRatios(2, 4));
    assertThat(workingShaderCoder.unpackVec4Data(out.readPixels())).isEqualTo(new Float32Array([
        NaN,NaN,NaN,NaN,
        NaN,NaN,NaN,NaN,
        NaN,NaN,NaN,NaN,
        NaN,NaN,NaN,NaN
    ]));
    KetTextureUtil.doneWithTexture(out);

    inp = Shaders.vec4Data(new Float32Array([
        1,0,0,0,    20,0,0,0,   0,0,0,0,  3,1,0,0,
        1,0,0,0,    0,0,2,0,   0,0,0,0,  1,0,0,0,
        0,0,0,0,    0,0,0,0,   0,0,0,0,  0,0,0,0,
        NaN,0,0,0,  0,0,0,0,   0,0,0,0,  0,0,0,0
    ])).toVec4Texture(4);
    out = KetTextureUtil.evaluatePipelineWithIntermediateCleanup(inp, pipelineToFoldConsistentRatios(2, 4));
    assertThat(workingShaderCoder.unpackVec4Data(out.readPixels())).isEqualTo(new Float32Array([
        20,0,0,0,
        NaN,NaN,NaN,NaN,
        0,0,0,0,
        NaN,NaN,NaN,NaN
    ]));
    KetTextureUtil.doneWithTexture(out);
});

suite.webGlTest("pipelineToSumAll", () => {
    let inp = Shaders.vec4Data(new Float32Array([
        2,0,0,0,
        0,0,2,3,
        2,0,2,0,
        2,0,6,0,
        1,0,0,1,
        1,2,3,4,
        1,2,3,4,
        1,2,3,4
    ])).toVec4Texture(3);
    let out;

    out = KetTextureUtil.evaluatePipelineWithIntermediateCleanup(inp, pipelineToSumAll(3));
    assertThat(workingShaderCoder.unpackVec4Data(out.readPixels())).isEqualTo(new Float32Array([
        10,6,19,16
    ]));
    KetTextureUtil.doneWithTexture(out);
});

suite.webGlTest("makeAmplitudeSpanPipeline_OffOff", () => {
    let inp = Shaders.vec2Data(new Float32Array([1,0, 0,0, 0,0, 0,0])).
        toVec2Texture(2);
    let pipe = makeAmplitudeSpanPipeline(inp, Controls.NONE, 0, 2);
    let [afterPolar, final] = KetTextureUtil.evaluatePipelineWithIntermediateCleanup(inp, pipe);
    assertThat(workingShaderCoder.unpackVec4Data(afterPolar.readPixels())).isEqualTo(
        new Float32Array([1,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0]));
    assertThat(workingShaderCoder.unpackVec4Data(final.readPixels())).isEqualTo(new Float32Array([1,0,1,0]));

    KetTextureUtil.doneWithTexture(afterPolar);
    KetTextureUtil.doneWithTexture(final);
    inp.ensureDeinitialized();
});
