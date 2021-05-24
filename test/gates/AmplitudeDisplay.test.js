/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Suite, assertThat} from "../TestUtil.js"
import {
    amplitudeDisplayStatTextures,
    AMPS_TO_SQUARED_MAGS_SHADER,
    MAGS_TO_INDEXED_MAGS_SHADER,
    FOLD_MAX_INDEXED_MAG_SHADER,
    LOOKUP_KET_AT_INDEXED_MAG_SHADER,
    POINTWISE_CMUL_CONJ_SHADER,
} from "../../src/gates/AmplitudeDisplay.js"

import {Complex} from "../../src/math/Complex.js"
import {Controls} from "../../src/circuit/Controls.js"
import {CircuitDefinition} from "../../src/circuit/CircuitDefinition.js"
import {CircuitStats} from "../../src/circuit/CircuitStats.js"
import {CircuitShaders} from "../../src/circuit/CircuitShaders.js"
import {Serializer} from "../../src/circuit/Serializer.js"
import {seq} from "../../src/base/Seq.js"
import {Shaders} from "../../src/webgl/Shaders.js"
import {currentShaderCoder} from "../../src/webgl/ShaderCoders.js"

let suite = new Suite("AmplitudeDisplay");

suite.testUsingWebGL("AMPS_TO_SQUARED_MAGS_SHADER", () => {
    let input = Shaders.vec2Data(new Float32Array([
        1,0,
        3,4,
        -1,1,
        0,0.5
    ])).toVec2Texture(2);
    assertThat(AMPS_TO_SQUARED_MAGS_SHADER(input).readVecFloatOutputs(2)).isApproximatelyEqualTo(new Float32Array([
        1,
        25,
        2,
        0.25,
    ]), 0.001);
    input.deallocByDepositingInPool();
});

suite.testUsingWebGL("MAGS_TO_INDEXED_MAGS_SHADER", () => {
    let input = Shaders.floatData(new Float32Array([
        2,
        3,
        5,
        7,
    ])).toVecFloatTexture(2);
    assertThat(MAGS_TO_INDEXED_MAGS_SHADER(input).readVec2Outputs(2)).isApproximatelyEqualTo(new Float32Array([
        0, 2,
        1, 3,
        2, 5,
        3, 7,
    ]), 0.001);
    input.deallocByDepositingInPool();
});

suite.testUsingWebGL("FOLD_MAX_INDEXED_MAG_SHADER", () => {
    let input = Shaders.vec2Data(new Float32Array([
        0, 4.2,
        8, 2.1,
        13, 1.5,
        23, 3.3,
    ])).toVec2Texture(2);
    assertThat(FOLD_MAX_INDEXED_MAG_SHADER(input).readVec2Outputs(1)).isApproximatelyEqualTo(new Float32Array([
        0, 4.2,
        23, 3.3,
    ]), 0.001);
    input.deallocByDepositingInPool();
});

suite.testUsingWebGL("LOOKUP_KET_AT_INDEXED_MAG_SHADER", () => {
    let input = Shaders.vec2Data(new Float32Array([
        0, 1, 2, 3, 4, 5, 6, 7,
        2, 3, 5, 7, 11, 13, 17, 19,
        0, 1, 4, 9, 16, 25, 36, 49,
        1, 2, 4, 8, 16, 32, 64, 128,
    ])).toVec2Texture(4);
    let index = Shaders.vec2Data(new Float32Array([
        1, 5000.3,
    ])).toVec2Texture(0);
    assertThat(LOOKUP_KET_AT_INDEXED_MAG_SHADER(input, index).readVec2Outputs(2)).isApproximatelyEqualTo(new Float32Array([
        2, 3, 5, 7, 11, 13, 17, 19,
    ]), 0.001);
    index.deallocByDepositingInPool();
    input.deallocByDepositingInPool();
});

suite.testUsingWebGL("POINTWISE_CMUL_CONJ_SHADER", () => {
    let small_input = Shaders.vec2Data(new Float32Array([
        1, 2,
    ])).toVec2Texture(0);
    let large_input = Shaders.vec2Data(new Float32Array([
        0, 1, 2, 3, 4, 5, 6, 7,
        2, 3, 5, 7, 11, 13, 17, 19,
        0, 1, 4, 9, 16, 25, 36, 49,
        1, 2, 4, 8, 16, 32, 64, 128,
    ])).toVec2Texture(4);
    assertThat(POINTWISE_CMUL_CONJ_SHADER(small_input, large_input).readVec2Outputs(4)).isApproximatelyEqualTo(new Float32Array([
        2, 1, 8, -1, 14, -3, 20, -5,
        8, -1, 19, -3, 37, -9, 55, -15,
        2, 1, 22, 1, 66, -7, 134, -23,
        5, 0, 20, 0, 80, 0, 320, 0
    ]), 0.001);
    small_input.deallocByDepositingInPool();
    large_input.deallocByDepositingInPool();
});

suite.testUsingWebGL("makeAmplitudeSpanPipeline_coherent", () => {
    let inp = Shaders.vec2Data(new Float32Array([0.6,0.8, 0,0, 0,0, 0,0])).
        toVec2Texture(2);
    let controlTex = CircuitShaders.controlMask(Controls.NONE).toBoolTexture(2);
    let [ketData, qualityData, incoherentKetData] = amplitudeDisplayStatTextures(inp, Controls.NONE, controlTex, 0, 2);
    let ket = currentShaderCoder().vec4.pixelsToData(ketData.readPixels());
    let quality = currentShaderCoder().float.pixelsToData(qualityData.readPixels());
    let incoherentKet = currentShaderCoder().vec4.pixelsToData(incoherentKetData.readPixels());
    assertThat(ket).isApproximatelyEqualTo(new Float32Array([
        0.6,0.8,
        0,0,
        0,0,
        0,0
    ]));
    assertThat(incoherentKet).isApproximatelyEqualTo(new Float32Array([
        1,
        0,
        0,
        0,
    ]));
    assertThat(quality).isApproximatelyEqualTo(new Float32Array([1]));

    inp.deallocByDepositingInPool();
    controlTex.deallocByDepositingInPool();
    ketData.deallocByDepositingInPool();
    qualityData.deallocByDepositingInPool();
    incoherentKetData.deallocByDepositingInPool();
});

suite.testUsingWebGL("AmplitudesDisplayWithOtherQubit_Minus", () => {
    let stats = CircuitStats.fromCircuitAtTime(
        Serializer.fromJson(CircuitDefinition, {cols:[["Amps2"]],init:[0,0,"-"]}),
        0);
    let out = stats.toReadableJson();
    assertThat(out.displays[0].data.ket).isApproximatelyEqualTo([
        {r: 1, i: 0},
        {r: 0, i: 0},
        {r: 0, i: 0},
        {r: 0, i: 0},
    ]);
    assertThat(out.displays[0].data.coherence_measure).isApproximatelyEqualTo(1);
});

suite.testUsingWebGL("AmplitudesDisplayWithOtherQubit_i", () => {
    let stats = CircuitStats.fromCircuitAtTime(
        Serializer.fromJson(CircuitDefinition, {cols:[["Amps2"]],init:[0,0,"i"]}),
        0);
    let out = stats.toReadableJson();
    assertThat(out.displays[0].data.ket).isApproximatelyEqualTo([
        {r: 1, i: 0},
        {r: 0, i: 0},
        {r: 0, i: 0},
        {r: 0, i: 0},
    ]);
    assertThat(out.displays[0].data.coherence_measure).isApproximatelyEqualTo(1);
});

suite.testUsingWebGL("AmplitudesDisplayWithOtherQubit_postselect", () => {
    let stats = CircuitStats.fromCircuitAtTime(
        Serializer.fromJson(CircuitDefinition, {cols:[["Amps2",1,"|0⟩⟨0|"]],init:[0,0,"+"]}),
        0);
    let out = stats.toReadableJson();
    assertThat(out.displays[0].data.ket).isApproximatelyEqualTo([
        {r: 1, i: 0},
        {r: 0, i: 0},
        {r: 0, i: 0},
        {r: 0, i: 0},
    ]);
    assertThat(out.displays[0].data.coherence_measure).isApproximatelyEqualTo(1);
});

suite.testUsingWebGL("AmplitudesDisplayWithOtherQubit_own_i", () => {
    let stats = CircuitStats.fromCircuitAtTime(
        Serializer.fromJson(CircuitDefinition, {cols:[["Amps2"]],init:["i",0,1]}),
        0);
    let out = stats.toReadableJson();
    assertThat(out.displays[0].data.ket).isApproximatelyEqualTo([
        {r: Math.sqrt(0.5), i: 0},
        {r: 0, i: Math.sqrt(0.5)},
        {r: 0, i: 0},
        {r: 0, i: 0},
    ]);
    assertThat(out.displays[0].data.coherence_measure).isApproximatelyEqualTo(1);
});

suite.testUsingWebGL("AmplitudesDisplayIncoherent_sqrt_x", () => {
    let stats = CircuitStats.fromCircuitAtTime(
        Serializer.fromJson(CircuitDefinition, {cols:[[1,"•","X^½"], ["Amps2"]],init:[0,"+",1]}),
        0);
    let out = stats.toReadableJson();
    assertThat(out.displays[0].data.incoherentKet).isApproximatelyEqualTo([
        Math.sqrt(0.5),
        0,
        Math.sqrt(0.5),
        0,
    ]);
    assertThat(out.displays[0].data.coherence_measure).isLessThan(0.85);
});

suite.testUsingWebGL("AmplitudesDisplayIncoherent_hadamard", () => {
    let stats = CircuitStats.fromCircuitAtTime(
        Serializer.fromJson(CircuitDefinition, {cols:[[1,"•","H"], ["Amps2"]],init:[0,"+",1]}),
        0);
    let out = stats.toReadableJson();
    assertThat(out.displays[0].data.incoherentKet).isApproximatelyEqualTo([
        Math.sqrt(0.5),
        0,
        Math.sqrt(0.5),
        0,
    ]);
    assertThat(out.displays[0].data.coherence_measure).isLessThan(0.85);
});

suite.testUsingWebGL("AmplitudesDisplayIncoherent_conditioned", () => {
    let stats = CircuitStats.fromCircuitAtTime(
        Serializer.fromJson(CircuitDefinition, {"cols":[[1,"•","Z"],["•","Amps1"]],"init":["+","+","+"]}),
        0);
    let out = stats.toReadableJson();
    assertThat(out.displays[0].data.incoherentKet).isApproximatelyEqualTo([
        Math.sqrt(0.5),
        Math.sqrt(0.5),
    ]);
    assertThat(out.displays[0].data.coherence_measure).isLessThan(0.85);
});
