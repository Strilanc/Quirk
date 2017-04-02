import {Gate} from "src/circuit/Gate.js"
import {ketArgs, ketShaderPermute, ketInputGateShaderCode} from "src/circuit/KetShaderUtil.js"
import {WglConfiguredShader} from "src/webgl/WglConfiguredShader.js"

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

ComparisonGates.ALessThanB = Gate.withoutKnownMatrix(
    "⊕A<B",
    "Less-Than Gate",
    "Toggles a qubit if input A is less than input B.").
    markedAsOnlyPermutingAndPhasing().
    markedAsStable().
    withSerializedId("^A<B").
    withRequiredContextKeys("Input Range A", "Input Range B").
    withCustomShader(customComparisonShader('lhs < rhs'));

ComparisonGates.AGreaterThanB = Gate.withoutKnownMatrix(
    "⊕A>B",
    "Greater-Than Gate",
    "Toggles a qubit if input A is greater than input B.").
    markedAsOnlyPermutingAndPhasing().
    markedAsStable().
    withSerializedId("^A>B").
    withRequiredContextKeys("Input Range A", "Input Range B").
    withCustomShader(customComparisonShader('lhs > rhs'));

ComparisonGates.ALessThanOrEqualToB = Gate.withoutKnownMatrix(
    "⊕A≤B",
    "At-Most Gate",
    "Toggles a qubit if input A is at most input B.").
    markedAsOnlyPermutingAndPhasing().
    markedAsStable().
    withSerializedId("^A<=B").
    withRequiredContextKeys("Input Range A", "Input Range B").
    withCustomShader(customComparisonShader('lhs <= rhs'));

ComparisonGates.AGreaterThanOrEqualToB = Gate.withoutKnownMatrix(
    "⊕A≥B",
    "At-Least Gate",
    "Toggles a qubit if input A is at least input B.").
    markedAsOnlyPermutingAndPhasing().
    markedAsStable().
    withSerializedId("^A>=B").
    withRequiredContextKeys("Input Range A", "Input Range B").
    withCustomShader(customComparisonShader('lhs >= rhs'));

ComparisonGates.AEqualToB = Gate.withoutKnownMatrix(
    "⊕A=B",
    "Equality Gate",
    "Toggles a qubit if input A is equal to input B.").
    markedAsOnlyPermutingAndPhasing().
    markedAsStable().
    withSerializedId("^A=B").
    withRequiredContextKeys("Input Range A", "Input Range B").
    withCustomShader(customComparisonShader('lhs == rhs'));

ComparisonGates.ANotEqualToB = Gate.withoutKnownMatrix(
    "⊕A≠B",
    "Inequality Gate",
    "Toggles the target if input A isn't equal to input B.").
    markedAsOnlyPermutingAndPhasing().
    markedAsStable().
    withSerializedId("^A!=B").
    withRequiredContextKeys("Input Range A", "Input Range B").
    withCustomShader(customComparisonShader('lhs != rhs'));

ComparisonGates.all = [
    ComparisonGates.ALessThanB,
    ComparisonGates.AGreaterThanB,
    ComparisonGates.AEqualToB,
    ComparisonGates.ANotEqualToB,
    ComparisonGates.ALessThanOrEqualToB,
    ComparisonGates.AGreaterThanOrEqualToB,
];

export {ComparisonGates}
