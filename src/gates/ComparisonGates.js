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

import {GateBuilder} from "../circuit/Gate.js"
import {ketArgs, ketShaderPermute, ketInputGateShaderCode} from "../circuit/KetShaderUtil.js"
import {WglConfiguredShader} from "../webgl/WglConfiguredShader.js"

let ComparisonGates = {};

/**
 * @param {!string} compareCode
 * @returns {!function(!CircuitEvalContext) : !WglConfiguredShader}
 */
function customComparisonShader(compareCode) {
    const shader = ketShaderPermute(
        `
            ${ketInputGateShaderCode('A')}
            ${ketInputGateShaderCode('B')}
        `,
        `
            float lhs = read_input_A();
            float rhs = read_input_B();
            return mod(out_id + ((${compareCode}) ? 1.0 : 0.0), 2.0);`);

    return ctx => shader.withArgs(...ketArgs(ctx, 1, ['A', 'B']));
}

ComparisonGates.ALessThanB = new GateBuilder().
    setSerializedId("^A<B").
    setSymbol("⊕A<B").
    setTitle("Less-Than Gate").
    setBlurb("Toggles a qubit if input A is less than input B.").
    setRequiredContextKeys("Input Range A", "Input Range B").
    setActualEffectToShaderProvider(customComparisonShader('lhs < rhs')).
    setKnownEffectToParametrizedPermutation((v, a, b) => v ^ (a < b ? 1 : 0)).
    gate;

ComparisonGates.ALessThanOrEqualToB = new GateBuilder().
    setSerializedId("^A<=B").
    setSymbol("⊕A≤B").
    setTitle("At-Most Gate").
    setBlurb("Toggles a qubit if input A is at most input B.").
    setRequiredContextKeys("Input Range A", "Input Range B").
    setActualEffectToShaderProvider(customComparisonShader('lhs <= rhs')).
    setKnownEffectToParametrizedPermutation((v, a, b) => v ^ (a <= b ? 1 : 0)).
    gate;

ComparisonGates.AGreaterThanB = new GateBuilder().
    setAlternate(ComparisonGates.ALessThanOrEqualToB).
    setSerializedId("^A>B").
    setSymbol("⊕A>B").
    setTitle("Greater-Than Gate").
    setBlurb("Toggles a qubit if input A is greater than input B.").
    setRequiredContextKeys("Input Range A", "Input Range B").
    setActualEffectToShaderProvider(customComparisonShader('lhs > rhs')).
    setKnownEffectToParametrizedPermutation((v, a, b) => v ^ (a > b ? 1 : 0)).
    gate;

ComparisonGates.AGreaterThanOrEqualToB = new GateBuilder().
    setAlternate(ComparisonGates.ALessThanB).
    setSerializedId("^A>=B").
    setSymbol("⊕A≥B").
    setTitle("At-Least Gate").
    setBlurb("Toggles a qubit if input A is at least input B.").
    setRequiredContextKeys("Input Range A", "Input Range B").
    setActualEffectToShaderProvider(customComparisonShader('lhs >= rhs')).
    setKnownEffectToParametrizedPermutation((v, a, b) => v ^ (a >= b ? 1 : 0)).
    gate;

ComparisonGates.AEqualToB = new GateBuilder().
    setSerializedId("^A=B").
    setSymbol("⊕A=B").
    setTitle("Equality Gate").
    setBlurb("Toggles a qubit if input A is equal to input B.").
    setRequiredContextKeys("Input Range A", "Input Range B").
    setActualEffectToShaderProvider(customComparisonShader('lhs == rhs')).
    setKnownEffectToParametrizedPermutation((v, a, b) => v ^ (a === b ? 1 : 0)).
    gate;

ComparisonGates.ANotEqualToB = new GateBuilder().
    setAlternate(ComparisonGates.AEqualToB).
    setSerializedId("^A!=B").
    setSymbol("⊕A≠B").
    setTitle("Inequality Gate").
    setBlurb("Toggles a qubit if input A isn't equal to input B.").
    setRequiredContextKeys("Input Range A", "Input Range B").
    setActualEffectToShaderProvider(customComparisonShader('lhs != rhs')).
    setKnownEffectToParametrizedPermutation((v, a, b) => v ^ (a !== b ? 1 : 0)).
    gate;

ComparisonGates.all = [
    ComparisonGates.ALessThanB,
    ComparisonGates.AGreaterThanB,
    ComparisonGates.AEqualToB,
    ComparisonGates.ANotEqualToB,
    ComparisonGates.ALessThanOrEqualToB,
    ComparisonGates.AGreaterThanOrEqualToB,
];

export {ComparisonGates}
