import {Suite, assertThat, assertThrows} from "test/TestUtil.js"
import {SHADER_CODER_FLOATS} from "src/webgl/ShaderCoders_intoFloats.js"
import {Shaders} from "src/webgl/Shaders.js"

let suite = new Suite("ShaderCoders");

suite.testUsingWebGLFloatTextures("packed", () => {
    assertThat(SHADER_CODER_FLOATS.float.dataToPixels(new Float32Array([1, 2, 3, 4]))).isEqualTo(new Float32Array([
        1, 0, 0, 0,
        2, 0, 0, 0,
        3, 0, 0, 0,
        4, 0, 0, 0
    ]));

    assertThat(SHADER_CODER_FLOATS.vec2.dataToPixels(new Float32Array([1, 2, 3, 4]))).isEqualTo(new Float32Array([
        1, 2, 0, 0,
        3, 4, 0, 0
    ]));

    assertThat(SHADER_CODER_FLOATS.vec4.dataToPixels(new Float32Array([1, 2, 3, 4]))).isEqualTo(new Float32Array([
        1, 2, 3, 4
    ]));
});

suite.testUsingWebGLFloatTextures("input_wrongType", () => {
    assertThrows(() => {
        let tex = Shaders.data(new Uint8Array([0, 0, 0, 0])).toRawByteTexture(0);
        try {
            SHADER_CODER_FLOATS.float.inputPartGetter('a').argsFor(tex);
        } finally {
            tex.deallocByDepositingInPool();
        }
    });

    assertThrows(() => {
        let tex = Shaders.data(new Uint8Array([0, 0, 0, 0])).toRawByteTexture(0);
        try {
            SHADER_CODER_FLOATS.vec2.inputPartGetter('a').argsFor(tex);
        } finally {
            tex.deallocByDepositingInPool();
        }
    });

    assertThrows(() => {
        let tex = Shaders.data(new Uint8Array([0, 0, 0, 0])).toRawByteTexture(0);
        try {
            SHADER_CODER_FLOATS.vec4.inputPartGetter('a').argsFor(tex);
        } finally {
            tex.deallocByDepositingInPool();
        }
    });
});
