import {Suite, assertThat, assertThrows} from "test/TestUtil.js"
import {
    combinedShaderPartsWithCode,
    SHADER_CODER_BYTES,
    SHADER_CODER_FLOATS,
    encodeFloatsIntoBytes,
    decodeBytesIntoFloats,
    shaderWithOutputPartAndArgs
} from "src/webgl/ShaderCoders.js"

import {Shaders} from "src/webgl/Shaders.js"
import {WglShader, WglConfiguredShader} from "src/webgl/WglShader.js"
import {WglTexture} from "src/webgl/WglTexture.js"

let suite = new Suite("ShaderCoders");

suite.test("encodeFloatsIntoBytes", () => {
    assertThat(encodeFloatsIntoBytes(new Float32Array([0]))).isEqualTo(new Uint8Array(
        [0, 0, 0, 0]));
    assertThat(encodeFloatsIntoBytes(new Float32Array([1]))).isEqualTo(new Uint8Array(
        [127, 0, 0, 0]));
    assertThat(encodeFloatsIntoBytes(new Float32Array([2]))).isEqualTo(new Uint8Array(
        [128, 0, 0, 0]));
    assertThat(encodeFloatsIntoBytes(new Float32Array([-1]))).isEqualTo(new Uint8Array(
        [127, 0, 0, 1]));

    assertThat(encodeFloatsIntoBytes(new Float32Array([1.1]))).isEqualTo(new Uint8Array(
        [0b01111111, 0b00011001, 0b10011001, 0b10011010]));
    assertThat(encodeFloatsIntoBytes(new Float32Array([-0.1]))).isEqualTo(new Uint8Array(
        [0b01111011, 0b10011001, 0b10011001, 0b10011011]));
});

suite.test("decodeBytesIntoFloats", () => {
    assertThat(decodeBytesIntoFloats([0, 0, 0, 0])).isEqualTo(new Float32Array(
        [0]));
    assertThat(decodeBytesIntoFloats([127, 0, 0, 0])).isEqualTo(new Float32Array(
        [1]));
    assertThat(decodeBytesIntoFloats([128, 0, 0, 0])).isEqualTo(new Float32Array(
        [2]));
    assertThat(decodeBytesIntoFloats([127, 0, 0, 1])).isEqualTo(new Float32Array(
        [-1]));

    assertThat(decodeBytesIntoFloats([0b01111111, 0b00011001, 0b10011001, 0b10011010])).isEqualTo(new Float32Array(
        [1.1]));
    assertThat(decodeBytesIntoFloats([0b01111011, 0b10011001, 0b10011001, 0b10011011])).isEqualTo(new Float32Array(
        [-0.1]));
});

/**
 * @param {!int} length
 * @returns {!Float32Array}
 */
function randomFloat32Array(length) {
    let floats = new Float32Array(length);
    for (let i = 0; i < floats.length; i++) {
        floats[i] = (Math.random() - 0.5)*Math.pow(2, 16) +
            (Math.random() - 0.5) +
            (Math.random() - 0.5) / Math.pow(2, 16);
    }
    return floats;
}

suite.test("floats_vs_bytes_round_trip", () => {
    let floats = randomFloat32Array(32);
    let bytes = encodeFloatsIntoBytes(floats);
    assertThat(decodeBytesIntoFloats(bytes)).isEqualTo(floats);
});

suite.webGlTest("vec2Input_bytes", () => {
    let param = SHADER_CODER_BYTES.vec2Input('a');
    let shader = combinedShaderPartsWithCode([param], `
        void main() {
            vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
            float k = xy.y * 4.0 + xy.x;
            vec2 a1 = read_a(k * 2.0);
            vec2 a2 = read_a(k * 2.0 + 1.0);
            gl_FragColor = vec4(a1, a2);
        }`);

    let floats = randomFloat32Array(64);
    let bytes = encodeFloatsIntoBytes(floats);

    let texSquare = Shaders.data(bytes).toByteTexture(8, 8);
    assertThat(shader.withArgs(...param.argsFor(texSquare)).readFloatOutputs(4, 4)).isEqualTo(floats);
    texSquare.ensureDeinitialized();

    let texLopsided = Shaders.data(bytes).toByteTexture(2, 32);
    assertThat(shader.withArgs(...param.argsFor(texLopsided)).readFloatOutputs(4, 4)).isEqualTo(floats);
    texLopsided.ensureDeinitialized();

    assertThrows(() => param.argsFor(Shaders.data(new Float32Array([0, 0, 0, 0])).toFloatTexture(1, 1)));
});

suite.webGlTest("vec4Input_bytes", () => {
    let param = SHADER_CODER_BYTES.vec4Input('test_input');
    let shader = combinedShaderPartsWithCode([param], `
        void main() {
            vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
            float k = xy.y * 2.0 + xy.x;
            gl_FragColor = read_test_input(k);
        }`);

    let floats = randomFloat32Array(64);
    let bytes = encodeFloatsIntoBytes(floats);

    let texSquare = Shaders.data(bytes).toByteTexture(8, 8);
    assertThat(shader.withArgs(...param.argsFor(texSquare)).readFloatOutputs(2, 8)).isEqualTo(floats);
    texSquare.ensureDeinitialized();

    let texLopsided = Shaders.data(bytes).toByteTexture(4, 16);
    assertThat(shader.withArgs(...param.argsFor(texLopsided)).readFloatOutputs(2, 8)).isEqualTo(floats);
    texLopsided.ensureDeinitialized();

    assertThrows(() => param.argsFor(Shaders.data(new Float32Array([0, 0, 0, 0])).toFloatTexture(1, 1)));
});

suite.webGlTest("vec4Input_floats", () => {
    let param = SHADER_CODER_FLOATS.vec4Input('test_input');
    let shader = combinedShaderPartsWithCode([param], `
        void main() {
            vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
            float k = xy.y * 4.0 + xy.x;
            gl_FragColor = read_test_input(k);
        }`);

    let floats = randomFloat32Array(64);

    let texSquare = Shaders.data(floats).toFloatTexture(4, 4);
    assertThat(shader.withArgs(...param.argsFor(texSquare)).readFloatOutputs(4, 4)).isEqualTo(floats);
    texSquare.ensureDeinitialized();

    let texLopsided = Shaders.data(floats).toFloatTexture(2, 8);
    assertThat(shader.withArgs(...param.argsFor(texLopsided)).readFloatOutputs(4, 4)).isEqualTo(floats);
    texLopsided.ensureDeinitialized();

    assertThrows(() => param.argsFor(Shaders.data(new Uint8Array([0, 0, 0, 0])).toByteTexture(1, 1)));
});

suite.webGlTest("vec2Input_floats", () => {
    let param = SHADER_CODER_FLOATS.vec2Input('fancy');
    let shader = combinedShaderPartsWithCode([param], `
        void main() {
            vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
            float k = xy.y * 4.0 + xy.x;
            vec2 a1 = read_fancy(k * 2.0);
            vec2 a2 = read_fancy(k * 2.0 + 1.0);
            gl_FragColor = vec4(a1, a2);
        }`);

    let floats = randomFloat32Array(64);
    let spread = new Float32Array(floats.length * 2);
    for (let i = 0; 2*i < floats.length; i+= 1) {
        spread[4*i] = floats[2*i];
        spread[4*i+1] = floats[2*i+1];
    }

    let texSquare = Shaders.data(spread).toFloatTexture(8, 4);
    assertThat(shader.withArgs(...param.argsFor(texSquare)).readFloatOutputs(4, 4)).isEqualTo(floats);
    texSquare.ensureDeinitialized();

    let texLopsided = Shaders.data(spread).toFloatTexture(2, 16);
    assertThat(shader.withArgs(...param.argsFor(texLopsided)).readFloatOutputs(4, 4)).isEqualTo(floats);
    texLopsided.ensureDeinitialized();

    assertThrows(() => param.argsFor(Shaders.data(new Uint8Array([0, 0, 0, 0])).toByteTexture(1, 1)));
});

suite.webGlTest("vec2Output_floats", () => {
    let output = SHADER_CODER_FLOATS.vec2Output;
    let shader = combinedShaderPartsWithCode([output], `
        vec2 outputFor(float k) {
            return vec2(k, k + 0.5);
        }`);

    assertThat(shaderWithOutputPartAndArgs(shader, output, []).readFloatOutputs(2, 1)).isEqualTo(new Float32Array([
        0, 0.5, 0, 0,
        1, 1.5, 0, 0
    ]));

    assertThat(shaderWithOutputPartAndArgs(shader, output, []).readFloatOutputs(4, 1)).isEqualTo(new Float32Array([
        0, 0.5, 0, 0,
        1, 1.5, 0, 0,
        2, 2.5, 0, 0,
        3, 3.5, 0, 0
    ]));

    assertThat(shaderWithOutputPartAndArgs(shader, output, []).readFloatOutputs(2, 2)).isEqualTo(new Float32Array([
        0, 0.5, 0, 0,
        1, 1.5, 0, 0,
        2, 2.5, 0, 0,
        3, 3.5, 0, 0
    ]));
});

suite.webGlTest("vec4Output_floats", () => {
    let output = SHADER_CODER_FLOATS.vec4Output;
    let shader = combinedShaderPartsWithCode([output], `
        vec4 outputFor(float k) {
            return vec4(k, k + 0.25, k + 0.5, k + 0.75);
        }`);

    assertThat(shaderWithOutputPartAndArgs(shader, output, []).readFloatOutputs(2, 1)).isEqualTo(new Float32Array([
        0, 0.25, 0.5, 0.75,
        1, 1.25, 1.5, 1.75
    ]));

    assertThat(shaderWithOutputPartAndArgs(shader, output, []).readFloatOutputs(4, 1)).isEqualTo(new Float32Array([
        0, 0.25, 0.5, 0.75,
        1, 1.25, 1.5, 1.75,
        2, 2.25, 2.5, 2.75,
        3, 3.25, 3.5, 3.75
    ]));

    assertThat(shaderWithOutputPartAndArgs(shader, output, []).readFloatOutputs(2, 2)).isEqualTo(new Float32Array([
        0, 0.25, 0.5, 0.75,
        1, 1.25, 1.5, 1.75,
        2, 2.25, 2.5, 2.75,
        3, 3.25, 3.5, 3.75
    ]));
});

suite.webGlTest("vec2Output_bytes", () => {
    let output = SHADER_CODER_BYTES.vec2Output;
    let shader = combinedShaderPartsWithCode([output], `
        vec2 outputFor(float k) {
            return vec2(k, k + 0.5);
        }`);

    assertThat(decodeBytesIntoFloats(shaderWithOutputPartAndArgs(shader, output, []).readByteOutputs(4, 1))).
        isEqualTo(new Float32Array([
            0, 0.5,
            1, 1.5
        ]));

    assertThat(decodeBytesIntoFloats(shaderWithOutputPartAndArgs(shader, output, []).readByteOutputs(8, 1))).
        isEqualTo(new Float32Array([
            0, 0.5,
            1, 1.5,
            2, 2.5,
            3, 3.5
        ]));

    assertThat(decodeBytesIntoFloats(shaderWithOutputPartAndArgs(shader, output, []).readByteOutputs(2, 4))).
        isEqualTo(new Float32Array([
            0, 0.5,
            1, 1.5,
            2, 2.5,
            3, 3.5
        ]));
});

suite.webGlTest("vec4Output_bytes", () => {
    let output = SHADER_CODER_BYTES.vec4Output;
    let shader = combinedShaderPartsWithCode([output], `
        vec4 outputFor(float k) {
            return vec4(k, k + 0.25, k + 0.5, k + 0.75);
        }`);

    assertThat(decodeBytesIntoFloats(shaderWithOutputPartAndArgs(shader, output, []).readByteOutputs(8, 1))).
        isEqualTo(new Float32Array([
            0, 0.25, 0.5, 0.75,
            1, 1.25, 1.5, 1.75
        ]));

    assertThat(decodeBytesIntoFloats(shaderWithOutputPartAndArgs(shader, output, []).readByteOutputs(16, 1))).
        isEqualTo(new Float32Array([
            0, 0.25, 0.5, 0.75,
            1, 1.25, 1.5, 1.75,
            2, 2.25, 2.5, 2.75,
            3, 3.25, 3.5, 3.75
        ]));

    assertThat(decodeBytesIntoFloats(shaderWithOutputPartAndArgs(shader, output, []).readByteOutputs(4, 4))).
        isEqualTo(new Float32Array([
            0, 0.25, 0.5, 0.75,
            1, 1.25, 1.5, 1.75,
            2, 2.25, 2.5, 2.75,
            3, 3.25, 3.5, 3.75
        ]));
});

suite.webGlTest("bytes_passthrough_vec2", () => {
    let input = SHADER_CODER_BYTES.vec2Input('prev');
    let output = SHADER_CODER_BYTES.vec2Output;
    let shader = combinedShaderPartsWithCode(
        [input, output], `
        vec2 outputFor(float k) {
            return read_prev(k);
        }`);

    let floats = randomFloat32Array(64);
    floats[0] = 0;
    floats[1] = 1;
    floats[2] = 1.1;
    floats[3] = -1;
    floats[4] = 2;
    let bytes = encodeFloatsIntoBytes(floats);

    let tex = Shaders.data(bytes).toByteTexture(8, 8);
    let configuredShader = shaderWithOutputPartAndArgs(shader, output, input.argsFor(tex));
    let outFloats = decodeBytesIntoFloats(configuredShader.readByteOutputs(8, 8));
    tex.ensureDeinitialized();

    assertThat(outFloats).isEqualTo(floats);
});

suite.webGlTest("bytes_passthrough_vec4", () => {
    let input = SHADER_CODER_BYTES.vec4Input('prev');
    let output = SHADER_CODER_BYTES.vec4Output;
    let shader = combinedShaderPartsWithCode(
        [input, output], `
        vec4 outputFor(float k) {
            return read_prev(k);
        }`);

    let floats = randomFloat32Array(64);
    floats[0] = 0;
    floats[1] = 1;
    floats[2] = 1.1;
    floats[3] = -1;
    floats[4] = 2;
    let bytes = encodeFloatsIntoBytes(floats);

    let tex = Shaders.data(bytes).toByteTexture(8, 8);
    let configuredShader = shaderWithOutputPartAndArgs(shader, output, input.argsFor(tex));
    let outFloats = decodeBytesIntoFloats(configuredShader.readByteOutputs(8, 8));
    tex.ensureDeinitialized();

    assertThat(outFloats).isEqualTo(floats);
});

suite.webGlTest("bytes_zip_through", () => {
    let inputA = SHADER_CODER_BYTES.vec4Input('a');
    let inputB = SHADER_CODER_BYTES.vec4Input('b');
    let output = SHADER_CODER_BYTES.vec4Output;
    let shader = combinedShaderPartsWithCode(
        [inputA, inputB, output], `
        vec4 outputFor(float k) {
            return read_a(k) + read_b(15.0 - k);
        }`);

    let floatsA = randomFloat32Array(64);
    let floatsB = randomFloat32Array(64);
    let bytesA = encodeFloatsIntoBytes(floatsA);
    let bytesB = encodeFloatsIntoBytes(floatsB);

    let texA = Shaders.data(bytesA).toByteTexture(8, 8);
    let texB = Shaders.data(bytesB).toByteTexture(8, 8);
    let configuredShader = shaderWithOutputPartAndArgs(
        shader, output, [...inputA.argsFor(texA), ...inputB.argsFor(texB)]);
    let outFloats = decodeBytesIntoFloats(configuredShader.readByteOutputs(8, 8));
    texA.ensureDeinitialized();
    texB.ensureDeinitialized();

    let expectedFloats = new Float32Array(floatsA.length);
    for (let i = 0; i < expectedFloats.length; i++) {
        let r = i % 4;
        let q = i >> 2;
        expectedFloats[i] = floatsA[i] + floatsB[(15 - q)*4 + r];
    }
    assertThat(outFloats).isEqualTo(expectedFloats);
});
