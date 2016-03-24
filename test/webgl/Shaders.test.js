import { Suite, assertThat, assertThrows } from "../TestUtil.js"
import Shaders from "src/webgl/Shaders.js"

import Seq from "../../src/base/Seq.js"

let suite = new Suite("Shaders");

suite.webGlTest("color", () => {
    assertThat(Shaders.color(2, 3, -5, 7.5).readFloatOutputs(2, 2)).isEqualTo(new Float32Array([
        2, 3, -5, 7.5,
        2, 3, -5, 7.5,
        2, 3, -5, 7.5,
        2, 3, -5, 7.5
    ]));
    assertThat(Shaders.color(1.5, 2, 0, 121).readFloatOutputs(4, 2)).isEqualTo(new Float32Array([
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
    assertThat(Shaders.coords.readFloatOutputs(2, 2)).isEqualTo(new Float32Array([
        0,0,0,0,
        1,0,0,0,
        0,1,0,0,
        1,1,0,0
    ]));

    assertThat(Shaders.coords.readFloatOutputs(4, 2)).isEqualTo(new Float32Array([
        0,0,0,0,
        1,0,0,0,
        2,0,0,0,
        3,0,0,0,
        0,1,0,0,
        1,1,0,0,
        2,1,0,0,
        3,1,0,0
    ]));

    assertThat(Shaders.coords.readFloatOutputs(2, 4)).isEqualTo(new Float32Array([
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
    let input = Shaders.coords.toFloatTexture(2, 2);
    assertThat(Shaders.passthrough(input).readFloatOutputs(2, 2)).isEqualTo(new Float32Array([
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
    assertThat(Shaders.data(data2x2).readFloatOutputs(2, 2)).isEqualTo(data2x2);

    let data2x4 = new Float32Array(Seq.range(2*4*4).map(e => e*e + (e - Math.sqrt(2)) / 3).toArray());
    assertThat(Shaders.data(data2x4).readFloatOutputs(2, 4)).isEqualTo(data2x4);

    assertThrows(() => Shaders.data(data2x4).readFloatOutputs(2, 2));
});

suite.webGlTest("overlay", () => {
    let fore = Shaders.data(new Float32Array(Seq.range(2*2*4).map(e => e + 900).toArray())).toFloatTexture(2, 2);
    let back = Shaders.data(new Float32Array(Seq.range(4*4*4).map(e => -e).toArray())).toFloatTexture(4, 4);

    assertThat(Shaders.overlay(0, 0, fore, back).readFloatOutputs(4, 4)).isEqualTo(new Float32Array([
        900, 901, 902, 903, 904, 905, 906, 907,  -8,  -9, -10, -11, -12, -13, -14, -15,
        908, 909, 910, 911, 912, 913, 914, 915, -24, -25, -26, -27, -28, -29, -30, -31,
        -32, -33, -34, -35, -36, -37, -38, -39, -40, -41, -42, -43, -44, -45, -46, -47,
        -48, -49, -50, -51, -52, -53, -54, -55, -56, -57, -58, -59, -60, -61, -62, -63
    ]));

    assertThat(Shaders.overlay(1, 0, fore, back).readFloatOutputs(4, 4)).isEqualTo(new Float32Array([
        -0,   -1,  -2,  -3, 900, 901, 902, 903, 904, 905, 906, 907, -12, -13, -14, -15,
        -16, -17, -18, -19, 908, 909, 910, 911, 912, 913, 914, 915, -28, -29, -30, -31,
        -32, -33, -34, -35, -36, -37, -38, -39, -40, -41, -42, -43, -44, -45, -46, -47,
        -48, -49, -50, -51, -52, -53, -54, -55, -56, -57, -58, -59, -60, -61, -62, -63
    ]));

    assertThat(Shaders.overlay(0, 1, fore, back).readFloatOutputs(4, 4)).isEqualTo(new Float32Array([
        -0,   -1,  -2,  -3,  -4,  -5,  -6,  -7,  -8,  -9, -10, -11, -12, -13, -14, -15,
        900, 901, 902, 903, 904, 905, 906, 907, -24, -25, -26, -27, -28, -29, -30, -31,
        908, 909, 910, 911, 912, 913, 914, 915, -40, -41, -42, -43, -44, -45, -46, -47,
        -48, -49, -50, -51, -52, -53, -54, -55, -56, -57, -58, -59, -60, -61, -62, -63
    ]));

    assertThat(Shaders.overlay(2, 1, fore, back).readFloatOutputs(4, 4)).isEqualTo(new Float32Array([
        -0,   -1,  -2,  -3,  -4,  -5,  -6,  -7,  -8,  -9, -10, -11, -12, -13, -14, -15,
        -16, -17, -18, -19, -20, -21, -22, -23, 900, 901, 902, 903, 904, 905, 906, 907,
        -32, -33, -34, -35, -36, -37, -38, -39, 908, 909, 910, 911, 912, 913, 914, 915,
        -48, -49, -50, -51, -52, -53, -54, -55, -56, -57, -58, -59, -60, -61, -62, -63
    ]));

    assertThat(Shaders.overlay(2, 2, fore, back).readFloatOutputs(4, 4)).isEqualTo(new Float32Array([
        -0,   -1,  -2,  -3,  -4,  -5,  -6,  -7,  -8,  -9, -10, -11, -12, -13, -14, -15,
        -16, -17, -18, -19, -20, -21, -22, -23, -24, -25, -26, -27, -28, -29, -30, -31,
        -32, -33, -34, -35, -36, -37, -38, -39, 900, 901, 902, 903, 904, 905, 906, 907,
        -48, -49, -50, -51, -52, -53, -54, -55, 908, 909, 910, 911, 912, 913, 914, 915
    ]));
});

suite.webGlTest("scale", () => {
    let amps = Shaders.data(new Float32Array([
        2, 3, 0, 0,
        0.5, 0.5, 0, 0,
        1, 2, 3, 4,
        0.25, 0.5, 0, 0,
        Math.sqrt(1/2), 0, 0, 0,
        0, Math.sqrt(1/3), 0, 0,
        3/5, 4/5, 0, 0,
        1, 0, 0, 0
    ])).toFloatTexture(4, 2);

    assertThat(Shaders.scale(amps, 3).readFloatOutputs(4, 2)).isApproximatelyEqualTo(new Float32Array([
        6, 9, 0, 0,
        1.5, 1.5, 0, 0,
        3, 6, 9, 12,
        0.75, 1.5, 0, 0,
        Math.sqrt(9/2), 0, 0, 0,
        0, Math.sqrt(3), 0, 0,
        9/5, 12/5, 0, 0,
        3, 0, 0, 0
    ]));
});

suite.webGlTest("sumFold", () => {
    let coords = Shaders.coords.toFloatTexture(8, 4);
    assertThat(Shaders.sumFold(coords, 4, 0).readFloatOutputs(4, 4)).isEqualTo(new Float32Array([
        4,0,0,0, 6,0,0,0, 8,0,0,0, 10,0,0,0,
        4,2,0,0, 6,2,0,0, 8,2,0,0, 10,2,0,0,
        4,4,0,0, 6,4,0,0, 8,4,0,0, 10,4,0,0,
        4,6,0,0, 6,6,0,0, 8,6,0,0, 10,6,0,0
    ]));
    assertThat(Shaders.sumFold(coords, 1, 2).readFloatOutputs(2, 2)).isEqualTo(new Float32Array([
        1,2,0,0, 3,2,0,0,
        1,4,0,0, 3,4,0,0
    ]));

    let solid = Shaders.color(2, 3, 5, 7).toFloatTexture(2, 2);
    assertThat(Shaders.sumFold(solid, 1, 0).readFloatOutputs(1, 2)).isEqualTo(new Float32Array([
        4,6,10,14,
        4,6,10,14
    ]));
});

suite.webGlTest("encodeFloatsIntoBytes_vs_decodeByteBufferToFloatBuffer", () => {
    let data = new Float32Array([
        0, NaN, Infinity, -Infinity,
        Math.PI, Math.E, Math.sqrt(2), 0.1,
        1, 0.5, -1, -2,
        Math.log(3), Math.sin(5), Math.cos(7), Math.exp(11)
    ]);
    let dataTex = Shaders.data(data).toFloatTexture(2, 2);
    let encodedPixels = Shaders.encodeFloatsIntoBytes(dataTex).readByteOutputs(4, 4);
    let decodedPixels = Shaders.decodeByteBufferToFloatBuffer(encodedPixels, 2, 2);
    assertThat(decodedPixels).isEqualTo(data);
});
