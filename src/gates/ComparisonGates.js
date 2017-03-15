import {Gate} from "src/circuit/Gate.js"
import {ketArgs, ketShaderPermute} from "src/circuit/KetShaderUtil.js"
import {WglArg} from "src/webgl/WglArg.js"
import {WglConfiguredShader} from "src/webgl/WglConfiguredShader.js"

let ComparisonGates = {};

/**
 * @param {!string} compareCode
 * @returns {!function(!CircuitEvalContext) : !WglConfiguredShader}
 */
function customComparisonShader(compareCode) {
    const shader = ketShaderPermute(
        'uniform float lhsOffset, lhsSpan, rhsOffset, rhsSpan;',
        `
            float lhs = mod(floor(full_out_id / lhsOffset), lhsSpan);
            float rhs = mod(floor(full_out_id / rhsOffset), rhsSpan);
            return mod(out_id + ((${compareCode}) ? 1.0 : 0.0), 2.0);`);

    return ctx => {
        let {offset: lhsOffset, length: lhsSpan} = ctx.customContextFromGates.get('Input Range A');
        let {offset: rhsOffset, length: rhsSpan} = ctx.customContextFromGates.get('Input Range B');
        return shader.withArgs(
            ...ketArgs(ctx, 1),
            WglArg.float("lhsOffset", 1 << lhsOffset),
            WglArg.float("rhsOffset", 1 << rhsOffset),
            WglArg.float("lhsSpan", 1 << lhsSpan),
            WglArg.float("rhsSpan", 1 << rhsSpan));
    };
}

ComparisonGates.ALessThanB = Gate.withoutKnownMatrix(
    "⊕A<B",
    "Less-Than Gate",
    "Toggles a qubit if 'input A' is less than 'input B'.").
    markedAsOnlyPermutingAndPhasing().
    markedAsStable().
    withSerializedId("^A<B").
    withRequiredContextKeys("Input Range A", "Input Range B").
    withCustomShader(customComparisonShader('lhs < rhs'));

ComparisonGates.AGreaterThanB = Gate.withoutKnownMatrix(
    "⊕A>B",
    "Greater-Than Gate",
    "Toggles a qubit if 'input A' is greater than 'input B'.").
    markedAsOnlyPermutingAndPhasing().
    markedAsStable().
    withSerializedId("^A>B").
    withRequiredContextKeys("Input Range A", "Input Range B").
    withCustomShader(customComparisonShader('lhs > rhs'));

ComparisonGates.ALessThanOrEqualToB = Gate.withoutKnownMatrix(
    "⊕A≤B",
    "At-Most Gate",
    "Toggles a qubit if 'input A' is less than 'input B'.").
    markedAsOnlyPermutingAndPhasing().
    markedAsStable().
    withSerializedId("^A<=B").
    withRequiredContextKeys("Input Range A", "Input Range B").
    withCustomShader(customComparisonShader('lhs <= rhs'));

ComparisonGates.AGreaterThanOrEqualToB = Gate.withoutKnownMatrix(
    "⊕A≥B",
    "At-Least Gate",
    "Toggles a qubit if 'input A' is greater than 'input B'.").
    markedAsOnlyPermutingAndPhasing().
    markedAsStable().
    withSerializedId("^A>=B").
    withRequiredContextKeys("Input Range A", "Input Range B").
    withCustomShader(customComparisonShader('lhs >= rhs'));

ComparisonGates.AEqualToB = Gate.withoutKnownMatrix(
    "⊕A=B",
    "Equality Gate",
    "Toggles a qubit if 'input A' is equal to 'input B'.").
    markedAsOnlyPermutingAndPhasing().
    markedAsStable().
    withSerializedId("^A=B").
    withRequiredContextKeys("Input Range A", "Input Range B").
    withCustomShader(customComparisonShader('lhs == rhs'));

ComparisonGates.ANotEqualToB = Gate.withoutKnownMatrix(
    "⊕A≠B",
    "Inequality Gate",
    "Toggles the target if 'input A' is equal to 'input B'.").
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
