// Copyright 2017 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {GateBuilder} from "src/circuit/Gate.js"
import {GatePainting} from "src/draw/GatePainting.js"
import {ketArgs, ketShader, ketShaderPhase, ketInputGateShaderCode} from "src/circuit/KetShaderUtil.js"
import {WglArg} from "src/webgl/WglArg.js"
import {Util} from "src/base/Util.js";

let ParametrizedRotationGates = {};

/**
 * @param {!GateDrawParams} args
 */
function exponent_to_A_len_painter(args) {
    let v = args.getGateContext('Input Range A');
    let denom_exponent = v === undefined ? 'ⁿ' : Util.digits_to_superscript_digits('' + v.length);
    let symbol = args.gate.symbol.replace('ⁿ', denom_exponent);
    GatePainting.paintBackground(args);
    GatePainting.paintOutline(args);
    GatePainting.paintGateSymbol(args, symbol);
}

const X_TO_A_SHADER = ketShader(
    `
        uniform float factor;
        ${ketInputGateShaderCode('A')}
    `,
    `
        float angle = read_input_A() * factor / _gen_input_span_A;
        float c = cos(angle) * 0.5;
        float s = sin(angle) * 0.5;
        vec2 u = vec2(0.5 + c, s);
        vec2 v = vec2(0.5 - c, -s);
        // multiply state by the matrix [[u, v], [v, u]]
        vec2 amp2 = inp(1.0-out_id);
        return cmul(u, amp) + cmul(v, amp2);
    `);

const Y_TO_A_SHADER = ketShader(
    `
        uniform float factor;
        ${ketInputGateShaderCode('A')}
    `,
    `
        float angle = read_input_A() * factor / _gen_input_span_A;
        float c = cos(angle) * 0.5;
        float s = sin(angle) * 0.5;
        vec2 u = vec2(c + 0.5, s);
        vec2 v = vec2(s, 0.5 - c);
        // multiply state by the matrix [[u, v], [-v, u]]
        vec2 amp2 = inp(1.0-out_id);
        vec2 vs = v * (-1.0 + 2.0 * out_id);
        return cmul(u, amp) + cmul(vs, amp2);
    `);

const Z_TO_A_SHADER = ketShaderPhase(
    `
        uniform float factor;
        ${ketInputGateShaderCode('A')}
    `,
    `
        return read_input_A() * out_id * factor / _gen_input_span_A;
    `);

ParametrizedRotationGates.XToA = new GateBuilder().
    setSerializedId("X^(A/2^n)").
    setSymbol("X^A/2ⁿ").
    setTitle("Parametrized X Gate").
    setBlurb("Rotates the target by input A / 2ⁿ'th of a half turn around the X axis.\n" +
        "n is the number of qubits in input A.").
    setRequiredContextKeys('Input NO_DEFAULT Range A').
    setDrawer(exponent_to_A_len_painter).
    setActualEffectToShaderProvider(ctx => X_TO_A_SHADER.withArgs(
        ...ketArgs(ctx, 1, ['A']),
        WglArg.float('factor', Math.PI))).
    promiseEffectIsStable().
    promiseEffectIsUnitary().
    gate;

ParametrizedRotationGates.XToMinusA = new GateBuilder().
    setSerializedId("X^(-A/2^n)").
    setSymbol("X^-A/2ⁿ").
    setTitle("Parametrized -X Gate").
    setBlurb("Counter-rotates the target by input A / 2ⁿ'th of a half turn around the X axis.\n" +
        "n is the number of qubits in input A.").
    setRequiredContextKeys('Input NO_DEFAULT Range A').
    setDrawer(exponent_to_A_len_painter).
    setActualEffectToShaderProvider(ctx => X_TO_A_SHADER.withArgs(
        ...ketArgs(ctx, 1, ['A']),
        WglArg.float('factor', -Math.PI))).
    promiseEffectIsStable().
    promiseEffectIsUnitary().
    gate;

ParametrizedRotationGates.YToA = new GateBuilder().
    setSerializedId("Y^(A/2^n)").
    setSymbol("Y^A/2ⁿ").
    setTitle("Parametrized Y Gate").
    setBlurb("Rotates the target by input A / 2ⁿ'th of a half turn around the Y axis.\n" +
        "n is the number of qubits in input A.").
    setRequiredContextKeys('Input NO_DEFAULT Range A').
    setDrawer(exponent_to_A_len_painter).
    setActualEffectToShaderProvider(ctx => Y_TO_A_SHADER.withArgs(
        ...ketArgs(ctx, 1, ['A']),
        WglArg.float('factor', Math.PI))).
    promiseEffectIsStable().
    promiseEffectIsUnitary().
    gate;

ParametrizedRotationGates.YToMinusA = new GateBuilder().
    setSerializedId("Y^(-A/2^n)").
    setSymbol("Y^-A/2ⁿ").
    setTitle("Parametrized -Y Gate").
    setBlurb("Counter-rotates the target by input A / 2ⁿ'th of a half turn around the Y axis.\n" +
        "n is the number of qubits in input A.").
    setRequiredContextKeys('Input NO_DEFAULT Range A').
    setDrawer(exponent_to_A_len_painter).
    setActualEffectToShaderProvider(ctx => Y_TO_A_SHADER.withArgs(
        ...ketArgs(ctx, 1, ['A']),
        WglArg.float('factor', -Math.PI))).
    promiseEffectIsStable().
    promiseEffectIsUnitary().
    gate;

ParametrizedRotationGates.ZToA = new GateBuilder().
    setSerializedId("Z^(A/2^n)").
    setSymbol("Z^A/2ⁿ").
    setTitle("Parametrized Z Gate").
    setBlurb("Rotates the target by input A / 2ⁿ'th of a half turn around the Z axis.\n" +
        "n is the number of qubits in input A.").
    setRequiredContextKeys('Input NO_DEFAULT Range A').
    setDrawer(exponent_to_A_len_painter).
    setActualEffectToShaderProvider(ctx => Z_TO_A_SHADER.withArgs(
        ...ketArgs(ctx, 1, ['A']),
        WglArg.float('factor', Math.PI))).
    promiseEffectIsStable().
    promiseEffectOnlyPhases().
    gate;

ParametrizedRotationGates.ZToMinusA = new GateBuilder().
    setSerializedId("Z^(-A/2^n)").
    setSymbol("Z^-A/2ⁿ").
    setTitle("Parametrized -Z Gate").
    setBlurb("Counter-rotates the target by input A / 2ⁿ'th of a half turn around the Z axis.\n" +
        "n is the number of qubits in input A.").
    setRequiredContextKeys('Input NO_DEFAULT Range A').
    setDrawer(exponent_to_A_len_painter).
    setActualEffectToShaderProvider(ctx => Z_TO_A_SHADER.withArgs(
        ...ketArgs(ctx, 1, ['A']),
        WglArg.float('factor', -Math.PI))).
    promiseEffectIsStable().
    promiseEffectOnlyPhases().
    gate;

ParametrizedRotationGates.all =[
    ParametrizedRotationGates.XToA,
    ParametrizedRotationGates.XToMinusA,
    ParametrizedRotationGates.YToA,
    ParametrizedRotationGates.YToMinusA,
    ParametrizedRotationGates.ZToA,
    ParametrizedRotationGates.ZToMinusA,
];

export {ParametrizedRotationGates}
