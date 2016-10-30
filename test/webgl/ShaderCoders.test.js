import {Suite, assertThat, assertThrows} from "test/TestUtil.js"
import {
    combinedShaderPartsWithCode,
    SHADER_CODER_BYTES,
    SHADER_CODER_FLOATS,
    shaderWithOutputPartAndArgs,
    makePseudoShaderWithInputsAndOutputAndCode,
    Outputs,
    currentShaderCoder
} from "src/webgl/ShaderCoders.js"
import {
    floatsAsBytes,
    bytesAsFloats,
    PACK_FLOAT_INTO_BYTES_CODE,
    UNPACK_BYTES_INTO_FLOAT_CODE,
} from "src/webgl/ShaderCoders_intoBytes.js"
import {seq, Seq} from "src/base/Seq.js"
import {Shaders} from "src/webgl/Shaders.js"
import {WglArg} from "src/webgl/WglArg.js"
import {WglConfiguredShader} from "src/webgl/WglConfiguredShader.js"
import {WglShader} from "src/webgl/WglShader.js"
import {WglTexture} from "src/webgl/WglTexture.js"
import {WglTextureTrader} from "src/webgl/WglTextureTrader.js"

let suite = new Suite("ShaderCoders");

suite.test("floatsAsBytes", () => {
    assertThat(floatsAsBytes(new Float32Array([0]))).isEqualTo(new Uint8Array(
        [0, 0, 0, 0]));
    assertThat(floatsAsBytes(new Float32Array([1]))).isEqualTo(new Uint8Array(
        [0, 0, 128, 63]));
    assertThat(floatsAsBytes(new Float32Array([2]))).isEqualTo(new Uint8Array(
        [0, 0, 0, 64]));
    assertThat(floatsAsBytes(new Float32Array([-1]))).isEqualTo(new Uint8Array(
        [0, 0, 128, 191]));

    assertThat(floatsAsBytes(new Float32Array([1.1]))).isEqualTo(new Uint8Array(
        [0b11001101, 0b11001100, 0b10001100, 0b00111111]));
    assertThat(floatsAsBytes(new Float32Array([-0.1]))).isEqualTo(new Uint8Array(
        [0b11001101, 0b11001100, 0b11001100, 0b10111101]));
});

suite.test("bytesAsFloats", () => {
    assertThat(bytesAsFloats(new Uint8Array([0, 0, 0, 0]))).isEqualTo(new Float32Array(
        [0]));
    assertThat(bytesAsFloats(new Uint8Array([0, 0, 128, 63]))).isEqualTo(new Float32Array(
        [1]));
    assertThat(bytesAsFloats(new Uint8Array([0, 0, 0, 64]))).isEqualTo(new Float32Array(
        [2]));
    assertThat(bytesAsFloats(new Uint8Array([0, 0, 128, 191]))).isEqualTo(new Float32Array(
        [-1]));

    assertThat(bytesAsFloats(new Uint8Array([0b11001101, 0b11001100, 0b10001100, 0b00111111]))).
        isEqualTo(new Float32Array([1.1]));
    assertThat(bytesAsFloats(new Uint8Array([0b11001101, 0b11001100, 0b11001100, 0b10111101]))).
        isEqualTo(new Float32Array([-0.1]));
});

const INTERESTING_FLOATS = new Float32Array([
    0,
    0.5,
    1,
    2,
    -1,
    1.1,
    42,
    16777215,
    16777216,
    16777218, // (16777217 is the first integer that can't be represented exactly.)
    0.9999999403953552, // An ulp below 1.
    1.0000001192092896, // An ulp above 1.
    Math.pow(2.0, -126), // Smallest non-denormalized 32-bit float.
    0.9999999403953552 * Math.pow(2.0, 128), // Largest finite 32-bit float.
    Math.PI,
    Math.E,
    16211.8955078125
]);

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

function variedFloat32Array(length) {
    return new Float32Array([...INTERESTING_FLOATS, ...randomFloat32Array(length - INTERESTING_FLOATS.length)]);
}

suite.test("roundTripInterestingFloats", () => {
    let floats = variedFloat32Array(64);
    let roundTripped = bytesAsFloats(floatsAsBytes(floats));
    assertThat(roundTripped).isEqualTo(floats);
});

suite.testUsingWebGLFloatTextures("decodeInterestingFloatsWithShader", () => {
    let shader = new WglShader(
        UNPACK_BYTES_INTO_FLOAT_CODE + `
        uniform sampler2D tex;
        void main() {
            vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
            vec2 uv = xy / vec2(8.0, 8.0);
            vec4 bytes = texture2D(tex, uv);
            float f = _gen_unpackBytesIntoFloat(bytes);
            gl_FragColor = vec4(f, 0.0, 0.0, 0.0);
        }`);

    let floats = variedFloat32Array(64);
    let bytes = floatsAsBytes(floats);
    let tex = Shaders.data(bytes).toRawByteTexture(6);
    let outFloats = shader.withArgs(WglArg.texture('tex', tex)).readRawFloatOutputs(6);

    let packedOutFloats = new Float32Array(outFloats.length >> 2);
    for (let i = 0; i < packedOutFloats.length; i++) {
        packedOutFloats[i] = outFloats[i << 2];
    }

    tex.deallocByDepositingInPool();
    assertThat(packedOutFloats).isEqualTo(floats);
});

suite.testUsingWebGL("generateEncodedInterestingFloatsWithShader", () => {
    let shader = new WglShader(
        PACK_FLOAT_INTO_BYTES_CODE + `
        uniform float vals[64];
        void main() {
            vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
            float k = xy.y * 8.0 + xy.x;
            float f = 0.0;
            ${Seq.range(64).
                mapWithIndex(i => `if (k == ${i}.0) f = vals[${i}];`).
                join('\n            ')}
            gl_FragColor = _gen_packFloatIntoBytes(f);
        }`);

    let inFloats = variedFloat32Array(64);
    let outBytes = shader.withArgs(WglArg.float_array('vals', inFloats)).readRawByteOutputs(6);
    let outFloats = bytesAsFloats(outBytes);
    assertThat(outFloats).isEqualTo(inFloats);
});

suite.testUsingWebGLFloatTextures("encodeInterestingFloatsWithShader", () => {
    let shader = new WglShader(
        PACK_FLOAT_INTO_BYTES_CODE + `
        uniform sampler2D tex;
        void main() {
            vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
            vec2 uv = xy / vec2(8.0, 8.0);
            float f = texture2D(tex, uv).x;
            gl_FragColor = _gen_packFloatIntoBytes(f);
        }`);

    let floats = variedFloat32Array(64);
    let spreadOutFloats = new Float32Array(floats.length << 2);
    for (let i = 0; i < floats.length; i++) {
        spreadOutFloats[i << 2] = floats[i];
    }
    let tex = Shaders.data(spreadOutFloats).toRawFloatTexture(6);
    let outBytes = shader.withArgs(WglArg.texture('tex', tex)).readRawByteOutputs(6);
    let outFloats = bytesAsFloats(outBytes);

    tex.deallocByDepositingInPool();
    assertThat(outFloats).isEqualTo(floats);
});

suite.test("floats_vs_bytes_round_trip", () => {
    let floats = randomFloat32Array(32);
    let bytes = floatsAsBytes(floats);
    assertThat(bytesAsFloats(bytes)).isEqualTo(floats);
});

suite.testUsingWebGLFloatTextures("boolInputs", () => {
    assertThat(SHADER_CODER_FLOATS.bool).is(SHADER_CODER_BYTES.bool);
    let inp = SHADER_CODER_BYTES.bool.inputPartGetter('a');
    let shader = combinedShaderPartsWithCode([inp], `
        void main() {
            vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
            float k = xy.y * 4.0 + xy.x;
            gl_FragColor = vec4(read_a(k), k, 0.0, 0.0);
        }`);

    let tex = Shaders.data(new Uint8Array([255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0])).toRawByteTexture(2);
    assertThat(shader.withArgs(...inp.argsFor(tex)).readRawFloatOutputs(2)).isEqualTo(new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 2, 0, 0,
        1, 3, 0, 0
    ]));
    tex.deallocByDepositingInPool();
});

suite.testUsingWebGLFloatTextures("vec2Input_bytes", () => {
    let param = SHADER_CODER_BYTES.vec2.inputPartGetter('a');
    let shader = combinedShaderPartsWithCode([param], `
        void main() {
            vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
            float k = xy.y * 4.0 + xy.x;
            vec2 a1 = read_a(k * 2.0);
            vec2 a2 = read_a(k * 2.0 + 1.0);
            gl_FragColor = vec4(a1, a2);
        }`);

    let floats = variedFloat32Array(64);
    let bytes = floatsAsBytes(floats);

    let texSquare = Shaders.data(bytes).toRawByteTexture(6);
    assertThat(shader.withArgs(...param.argsFor(texSquare)).readRawFloatOutputs(4)).isEqualTo(floats);
    texSquare.deallocByDepositingInPool();

    // Wrong type.
    assertThrows(() => {
        let tex = Shaders.data(new Float32Array([0, 0, 0, 0])).toRawFloatTexture(0);
        try {
            param.argsFor(tex);
        } finally {
            tex.deallocByDepositingInPool();
        }
    });
});

suite.testUsingWebGLFloatTextures("vec4Input_bytes", () => {
    let param = SHADER_CODER_BYTES.vec4.inputPartGetter('test_input');
    let shader = combinedShaderPartsWithCode([param], `
        void main() {
            vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
            float k = xy.y * 4.0 + xy.x;
            gl_FragColor = read_test_input(k);
        }`);

    let floats = randomFloat32Array(64);
    let bytes = floatsAsBytes(floats);

    let texSquare = Shaders.data(bytes).toRawByteTexture(4 + 2);
    assertThat(shader.withArgs(...param.argsFor(texSquare)).readRawFloatOutputs(4)).isEqualTo(floats);
    texSquare.deallocByDepositingInPool();

    // Wrong type.
    assertThrows(() => {
        let tex = Shaders.data(new Float32Array([0, 0, 0, 0])).toRawFloatTexture(0);
        try {
            param.argsFor(tex);
        } finally {
            tex.deallocByDepositingInPool();
        }
    });
});

suite.testUsingWebGLFloatTextures("vec4Input_floats", () => {
    let param = SHADER_CODER_FLOATS.vec4.inputPartGetter('test_input');
    let shader = combinedShaderPartsWithCode([param], `
        void main() {
            vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
            float k = xy.y * 4.0 + xy.x;
            gl_FragColor = read_test_input(k);
        }`);

    let floats = randomFloat32Array(64);

    let texSquare = Shaders.data(floats).toRawFloatTexture(4);
    assertThat(shader.withArgs(...param.argsFor(texSquare)).readRawFloatOutputs(4)).isEqualTo(floats);
    texSquare.deallocByDepositingInPool();

    // Wrong type.
    assertThrows(() => {
        let tex = Shaders.data(new Uint8Array([0, 0, 0, 0])).toRawByteTexture(0);
        try {
            param.argsFor(tex);
        } finally {
            tex.deallocByDepositingInPool();
        }
    });
});

suite.testUsingWebGLFloatTextures("vec2Input_floats", () => {
    let param = SHADER_CODER_FLOATS.vec2.inputPartGetter('fancy');
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

    let texSquare = Shaders.data(spread).toRawFloatTexture(5);
    assertThat(shader.withArgs(...param.argsFor(texSquare)).readRawFloatOutputs(4)).isEqualTo(floats);
    texSquare.deallocByDepositingInPool();

    // Wrong type.
    assertThrows(() => {
        let tex = Shaders.data(new Uint8Array([0, 0, 0, 0])).toRawByteTexture(0);
        try {
            param.argsFor(tex);
        } finally {
            tex.deallocByDepositingInPool();
        }
    });
});

suite.testUsingWebGL("boolOutputs", () => {
    assertThat(SHADER_CODER_BYTES.bool.outputPart).is(SHADER_CODER_FLOATS.bool.outputPart);

    let output = SHADER_CODER_FLOATS.bool.outputPart;
    let shader = combinedShaderPartsWithCode([output], `
        bool outputFor(float k) {
            return mod(k, 3.0) == 1.0;
        }`);

    assertThat(shaderWithOutputPartAndArgs(shader, output, []).readBoolOutputs(3)).isEqualTo(new Uint8Array([
        0, 1, 0, 0, 1, 0, 0, 1
    ]));
});

suite.testUsingWebGLFloatTextures("vec2Output_floats", () => {
    let output = SHADER_CODER_FLOATS.vec2.outputPart;
    let shader = combinedShaderPartsWithCode([output], `
        vec2 outputFor(float k) {
            return vec2(k, k + 0.5);
        }`);

    assertThat(shaderWithOutputPartAndArgs(shader, output, []).readRawFloatOutputs(1)).isEqualTo(new Float32Array([
        0, 0.5, 0, 0,
        1, 1.5, 0, 0
    ]));

    assertThat(shaderWithOutputPartAndArgs(shader, output, []).readRawFloatOutputs(2)).isEqualTo(new Float32Array([
        0, 0.5, 0, 0,
        1, 1.5, 0, 0,
        2, 2.5, 0, 0,
        3, 3.5, 0, 0
    ]));
});

suite.testUsingWebGLFloatTextures("vec4Output_floats", () => {
    let output = SHADER_CODER_FLOATS.vec4.outputPart;
    let shader = combinedShaderPartsWithCode([output], `
        vec4 outputFor(float k) {
            return vec4(k, k + 0.25, k + 0.5, k + 0.75);
        }`);

    assertThat(shaderWithOutputPartAndArgs(shader, output, []).readRawFloatOutputs(1)).isEqualTo(new Float32Array([
        0, 0.25, 0.5, 0.75,
        1, 1.25, 1.5, 1.75
    ]));

    assertThat(shaderWithOutputPartAndArgs(shader, output, []).readRawFloatOutputs(2)).isEqualTo(new Float32Array([
        0, 0.25, 0.5, 0.75,
        1, 1.25, 1.5, 1.75,
        2, 2.25, 2.5, 2.75,
        3, 3.25, 3.5, 3.75
    ]));
});

suite.testUsingWebGL("vec2Output_bytes", () => {
    let output = SHADER_CODER_BYTES.vec2.outputPart;
    let shader = combinedShaderPartsWithCode([output], `
        vec2 outputFor(float k) {
            return vec2(k, k + 0.5);
        }`);

    assertThat(bytesAsFloats(shaderWithOutputPartAndArgs(shader, output, []).readRawByteOutputs(2))).
        isEqualTo(new Float32Array([
            0, 0.5,
            1, 1.5
        ]));

    assertThat(bytesAsFloats(shaderWithOutputPartAndArgs(shader, output, []).readRawByteOutputs(3))).
        isEqualTo(new Float32Array([
            0, 0.5,
            1, 1.5,
            2, 2.5,
            3, 3.5
        ]));
});

suite.testUsingWebGL("vec4Output_bytes", () => {
    let output = SHADER_CODER_BYTES.vec4.outputPart;
    let shader = combinedShaderPartsWithCode([output], `
        vec4 outputFor(float k) {
            return vec4(k, k + 0.25, k + 0.5, k + 0.75);
        }`);

    assertThat(bytesAsFloats(shaderWithOutputPartAndArgs(shader, output, []).readRawByteOutputs(3))).
        isEqualTo(new Float32Array([
            0, 0.25, 0.5, 0.75,
            1, 1.25, 1.5, 1.75
        ]));

    assertThat(bytesAsFloats(shaderWithOutputPartAndArgs(shader, output, []).readRawByteOutputs(4))).
        isEqualTo(new Float32Array([
            0, 0.25, 0.5, 0.75,
            1, 1.25, 1.5, 1.75,
            2, 2.25, 2.5, 2.75,
            3, 3.25, 3.5, 3.75
        ]));
});

suite.testUsingWebGL("bytes_passthrough_vec2", () => {
    let input = SHADER_CODER_BYTES.vec2.inputPartGetter('prev');
    let output = SHADER_CODER_BYTES.vec2.outputPart;
    let shader = combinedShaderPartsWithCode(
        [input, output], `
        vec2 outputFor(float k) {
            return read_prev(k);
        }`);

    let floats = randomFloat32Array(64);
    let bytes = floatsAsBytes(floats);

    let tex = Shaders.data(bytes).toRawByteTexture(6);
    let configuredShader = shaderWithOutputPartAndArgs(shader, output, input.argsFor(tex));
    let outFloats = bytesAsFloats(configuredShader.readRawByteOutputs(6));
    tex.deallocByDepositingInPool();

    assertThat(outFloats).isEqualTo(floats);
});

suite.testUsingWebGL("bytes_passthrough_vec4", () => {
    let input = SHADER_CODER_BYTES.vec4.inputPartGetter('prev');
    let output = SHADER_CODER_BYTES.vec4.outputPart;
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
    let bytes = floatsAsBytes(floats);

    let tex = Shaders.data(bytes).toRawByteTexture(6);
    let configuredShader = shaderWithOutputPartAndArgs(shader, output, input.argsFor(tex));
    let outFloats = bytesAsFloats(configuredShader.readRawByteOutputs(6));
    tex.deallocByDepositingInPool();

    assertThat(outFloats).isEqualTo(floats);
});

suite.testUsingWebGL("bytes_zip_through", () => {
    let inputA = SHADER_CODER_BYTES.vec4.inputPartGetter('a');
    let inputB = SHADER_CODER_BYTES.vec4.inputPartGetter('b');
    let output = SHADER_CODER_BYTES.vec4.outputPart;
    let shader = combinedShaderPartsWithCode(
        [inputA, inputB, output], `
        vec4 outputFor(float k) {
            return read_a(k) + read_b(15.0 - k);
        }`);

    let floatsA = randomFloat32Array(64);
    let floatsB = randomFloat32Array(64);
    let bytesA = floatsAsBytes(floatsA);
    let bytesB = floatsAsBytes(floatsB);

    let texA = Shaders.data(bytesA).toRawByteTexture(6);
    let texB = Shaders.data(bytesB).toRawByteTexture(6);
    let configuredShader = shaderWithOutputPartAndArgs(
        shader, output, [...inputA.argsFor(texA), ...inputB.argsFor(texB)]);
    let outFloats = bytesAsFloats(configuredShader.readRawByteOutputs(6));
    texA.deallocByDepositingInPool();
    texB.deallocByDepositingInPool();

    let expectedFloats = new Float32Array(floatsA);
    for (let i = 0; i < expectedFloats.length; i++) {
        let r = i % 4;
        let q = i >> 2;
        expectedFloats[i] += floatsB[(15 - q)*4 + r];
    }
    assertThat(outFloats).withInfo({floatsA, floatsB}).isEqualTo(expectedFloats);
});

suite.testUsingWebGL("bytes_encoding_precision", () => {
    let inputA = SHADER_CODER_BYTES.vec2.inputPartGetter('a');
    let output = SHADER_CODER_BYTES.vec2.outputPart;
    let shader = combinedShaderPartsWithCode(
        [inputA, output], `
        vec2 outputFor(float k) { return read_a(k); }`);

    let floatsIn = bytesAsFloats(new Uint8Array([
        96, 38, 84, 190,
        97, 38, 84, 62,
        97, 38, 84, 190,
        98, 38, 84, 62
    ]));
    let bytesIn = floatsAsBytes(floatsIn);

    let texA = Shaders.data(bytesIn).toRawByteTexture(2);
    let bytesOut = shaderWithOutputPartAndArgs(shader, output, [...inputA.argsFor(texA)]).readRawByteOutputs(2);
    let floatsOut = bytesAsFloats(bytesOut);
    texA.deallocByDepositingInPool();

    assertThat(bytesOut).isEqualTo(bytesIn);
    assertThat(floatsOut).isEqualTo(floatsIn);
});

suite.testUsingWebGLFloatTextures("testByteToFloatToByteStability", () => {
    let shader = new WglShader(`
        void main() {
            vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
            gl_FragColor = vec4(
                mod(xy.y, 64.0),
                mod(xy.x, 64.0),
                floor(xy.y / 64.0),
                1.0 + floor(xy.x / 64.0)) / 255.0;
        }
    `);

    let sizePower = 16;
    let tex = shader.withArgs().toRawByteTexture(sizePower);

    let bytesToFloatsShader = combinedShaderPartsWithCode(
        [SHADER_CODER_BYTES.vec4.inputPartGetter('prev'), SHADER_CODER_FLOATS.vec4.outputPart],
        'vec4 outputFor(float k) { return read_prev(k); }');
    let texAsFloats = shaderWithOutputPartAndArgs(
        bytesToFloatsShader,
        SHADER_CODER_FLOATS.vec4.outputPart,
        [...SHADER_CODER_BYTES.vec4.inputPartGetter('prev').argsFor(tex)]
    ).toRawFloatTexture(sizePower - 2);

    let floatsToBytesShader = combinedShaderPartsWithCode(
        [SHADER_CODER_FLOATS.vec4.inputPartGetter('prev'), SHADER_CODER_BYTES.vec4.outputPart],
        'vec4 outputFor(float k) { return read_prev(k); }');
    let reBytes = shaderWithOutputPartAndArgs(
        floatsToBytesShader,
        SHADER_CODER_BYTES.vec4.outputPart,
        [...SHADER_CODER_FLOATS.vec4.inputPartGetter('prev').argsFor(texAsFloats)]
    ).readRawByteOutputs(sizePower);

    let bytes = tex.readPixels();
    tex.deallocByDepositingInPool();
    texAsFloats.deallocByDepositingInPool();
    assertThat(reBytes).isEqualTo(bytes);
});

suite.testUsingWebGL("testByteToByteStability", () => {
    let shader = new WglShader(`
        void main() {
            vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
            xy *= 1.0;
            gl_FragColor = vec4(
                mod(xy.y, 64.0),
                mod(xy.x, 64.0),
                floor(xy.y / 64.0),
                1.0 + floor(xy.x / 64.0)) / 255.0;
        }
    `);

    let sizePower = 16;
    let tex = shader.withArgs().toRawByteTexture(sizePower);

    let bytesToBytesShader = combinedShaderPartsWithCode(
        [SHADER_CODER_BYTES.vec4.inputPartGetter('prev'), SHADER_CODER_BYTES.vec4.outputPart],
        'vec4 outputFor(float k) { return read_prev(k); }');
    let reBytes = shaderWithOutputPartAndArgs(
        bytesToBytesShader,
        SHADER_CODER_BYTES.vec4.outputPart,
        [...SHADER_CODER_BYTES.vec4.inputPartGetter('prev').argsFor(tex)]
    ).readRawByteOutputs(sizePower);

    let bytes = tex.readPixels();
    tex.deallocByDepositingInPool();
    assertThat(reBytes).isEqualTo(bytes);
});
