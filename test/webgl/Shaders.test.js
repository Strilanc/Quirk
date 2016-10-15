import {Suite, assertThat, assertThrows} from "test/TestUtil.js"
import {Shaders} from "src/webgl/Shaders.js"
import {
    workingShaderCoder,
    makePseudoShaderWithInputsAndOutputAndCode,
    decodeBytesIntoFloats
} from "src/webgl/ShaderCoders.js"

import {Seq} from "src/base/Seq.js"

let suite = new Suite("Shaders");

suite.webGlTest("color", () => {
    assertThat(Shaders.color(2, 3, -5, 7.5).readSizedFloatOutputs(2, 2)).isEqualTo(new Float32Array([
        2, 3, -5, 7.5,
        2, 3, -5, 7.5,
        2, 3, -5, 7.5,
        2, 3, -5, 7.5
    ]));
    assertThat(Shaders.color(1.5, 2, 0, 121).readSizedFloatOutputs(4, 2)).isEqualTo(new Float32Array([
        1.5, 2, 0, 121,
        1.5, 2, 0, 121,
        1.5, 2, 0, 121,
        1.5, 2, 0, 121,
        1.5, 2, 0, 121,
        1.5, 2, 0, 121,
        1.5, 2, 0, 121,
        1.5, 2, 0, 121
    ]));
});

suite.webGlTest("coords", () => {
    assertThat(Shaders.coords.readSizedFloatOutputs(2, 2)).isEqualTo(new Float32Array([
        0,0,0,0,
        1,0,0,0,
        0,1,0,0,
        1,1,0,0
    ]));

    assertThat(Shaders.coords.readSizedFloatOutputs(4, 2)).isEqualTo(new Float32Array([
        0,0,0,0,
        1,0,0,0,
        2,0,0,0,
        3,0,0,0,
        0,1,0,0,
        1,1,0,0,
        2,1,0,0,
        3,1,0,0
    ]));

    assertThat(Shaders.coords.readSizedFloatOutputs(2, 4)).isEqualTo(new Float32Array([
        0,0,0,0,
        1,0,0,0,
        0,1,0,0,
        1,1,0,0,
        0,2,0,0,
        1,2,0,0,
        0,3,0,0,
        1,3,0,0
    ]));
});

suite.webGlTest("passthrough", () => {
    let input = Shaders.coords.toSizedFloatTexture(2, 2);
    assertThat(Shaders.passthrough(input).readSizedFloatOutputs(2, 2)).isEqualTo(new Float32Array([
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 1, 0, 0,
        1, 1, 0, 0
    ]));
});

suite.webGlTest("data", () => {
    let data2x2 = new Float32Array([
        0, NaN, Infinity, -Infinity,
        Math.PI, Math.E, Math.sqrt(2), 0.1,
        1, 0.5, -1, -2,
        Math.log(3), Math.sin(5), Math.cos(7), Math.exp(11)
    ]);
    assertThat(Shaders.data(data2x2).readSizedFloatOutputs(2, 2)).isEqualTo(data2x2);

    let data2x4 = new Float32Array(Seq.range(2*4*4).map(e => e*e + (e - Math.sqrt(2)) / 3).toArray());
    assertThat(Shaders.data(data2x4).readSizedFloatOutputs(2, 4)).isEqualTo(data2x4);

    let bytes4x4 = new Uint8Array(Seq.range(4*4*4).map(e => Math.floor(Math.random() * 256)).toArray());
    assertThat(Shaders.data(bytes4x4).readSizedByteOutputs(4, 4)).isEqualTo(bytes4x4);

    assertThrows(() => Shaders.data(data2x4).readSizedFloatOutputs(2, 2));
});

suite.webGlTest("sumFold", () => {
    let coords = makePseudoShaderWithInputsAndOutputAndCode([], workingShaderCoder.vec2Output, `
        vec2 outputFor(float k) {
            return vec2(mod(k, 2.0), floor(k/2.0));
        }
    `)().toVec2Texture(3);
    assertThat(Shaders.sumFoldVec2(coords).readVec2Outputs(2)).isEqualTo(new Float32Array([
        0,2,
        2,2,
        0,4,
        2,4
    ]));
    coords.deallocByDepositingInPool();

    let solid = makePseudoShaderWithInputsAndOutputAndCode([], workingShaderCoder.vec4Output, `
        vec4 outputFor(float k) {
            return vec4(2.0, 3.0, 5.0, 7.0);
        }
    `)().toVec4Texture(2);
    assertThat(Shaders.sumFoldVec4(solid).readVec4Outputs(1)).isEqualTo(new Float32Array([
        4,6,10,14,
        4,6,10,14
    ]));
    solid.deallocByDepositingInPool();
});
