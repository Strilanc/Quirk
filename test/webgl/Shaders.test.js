import { Suite, assertThat, assertThrows } from "test/TestUtil.js"
import Shaders from "src/webgl/Shaders.js"

import Seq from "src/base/Seq.js"

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

suite.webGlTest("encodeFloatsIntoBytes_vs_decodeByteBufferToFloatBuffer_cornerCases", () => {
    let data = new Float32Array([
        0, NaN, Infinity, -Infinity,
        Math.PI, Math.E, Math.sqrt(2), 0.1,
        1, 0.5, -1, -2,
        Math.log(3), Math.sin(5), Math.cos(7), Math.exp(11)
    ]);
    let dataTex = Shaders.data(data).toFloatTexture(2, 2);
    let encodedPixels = Shaders.encodeFloatsIntoBytes(dataTex).readByteOutputs(4, 4);
    let decodedPixels = Shaders.decodeByteBufferToFloatBuffer(encodedPixels);
    assertThat(decodedPixels).isEqualTo(data);
});

suite.webGlTest("encodeFloatsIntoBytes_vs_decodeByteBufferToFloatBuffer_randomized", () => {
    for (let i = 0; i < 10; i++) {
        let diam = 8;
        let data = new Float32Array(Seq.range(diam*diam*4).map(i => Math.random()*10-5).toFloat32Array());
        let dataTex = Shaders.data(data).toFloatTexture(diam, diam);
        let encodedPixels = Shaders.encodeFloatsIntoBytes(dataTex).readByteOutputs(diam*2, diam*2);
        let decodedPixels = Shaders.decodeByteBufferToFloatBuffer(encodedPixels);
        assertThat(decodedPixels).isEqualTo(data);
    }
});

suite.webGlTest("encodeFloatsIntoBytes_vs_decodeByteBufferToFloatBuffer_caught", () => {
    let data = new Float32Array([
        -0.2509765326976776, 0.2499999850988388, 0, 0
    ]);
    let dataTex = Shaders.data(data).toFloatTexture(1, 1);
    let encodedPixels = Shaders.encodeFloatsIntoBytes(dataTex).readByteOutputs(2, 2);
    let decodedPixels = Shaders.decodeByteBufferToFloatBuffer(encodedPixels);
    assertThat(decodedPixels).isEqualTo(data);
});
