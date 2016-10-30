import {Suite, assertThat, assertThrows} from "test/TestUtil.js"
import {combinedShaderPartsWithCode, shaderWithOutputPartAndArgs} from "src/webgl/ShaderCoders.js"
import {SHADER_CODER_FLOATS} from "src/webgl/ShaderCoders_intoFloats.js"
import {Shaders} from "src/webgl/Shaders.js"

let suite = new Suite("ShaderCoders");

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
