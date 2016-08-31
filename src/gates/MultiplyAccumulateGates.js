import Gate from "src/circuit/Gate.js"
import GatePainting from "src/draw/GatePainting.js"
import Matrix from "src/math/Matrix.js"
import WglArg from "src/webgl/WglArg.js"
import {WglShader, WglConfiguredShader} from "src/webgl/WglShader.js"

let MultiplyAccumulateGates = {};

let sectionSizes = totalSize => {
    let c = Math.ceil(totalSize / 2);
    let b = Math.ceil((totalSize - c) / 2);
    let a = Math.max(totalSize - c - b, 1);
    return [a, b, totalSize - a - b];
};

const makeScaledMultiplyAddMatrix = (span, scaleFactor) => Matrix.generateTransition(1<<span, e => {
    let [sa, sb, sc] = sectionSizes(span);
    let a = e & ((1 << sa) - 1);
    let b = (e >> sa) & ((1 << sb) - 1);
    let c = e >> (sa + sb);
    c += a*b*scaleFactor;
    c &= ((1 << sc) - 1);
    return a | (b << sa) | (c << (sa+sb));
});

/**
 * @param {!WglTexture} inputTexture
 * @param {!WglTexture} controlTexture
 * @param {!int} srcIndex1
 * @param {!int} srcSpan1
 * @param {!int} srcIndex2
 * @param {!int} srcSpan2
 * @param {!int} dstIndex
 * @param {!int} dstSpan
 * @param {!int} scaleFactor
 * @returns {!WglConfiguredShader}
 */
function multiplyAccumulate(
        inputTexture,
        controlTexture,
        srcIndex1,
        srcSpan1,
        srcIndex2,
        srcSpan2,
        dstIndex,
        dstSpan,
        scaleFactor) {
    return new WglConfiguredShader(destinationTexture => {
        MULTIPLY_ACCUMULATE_SHADER.withArgs(
            WglArg.texture("inputTexture", inputTexture, 0),
            WglArg.texture("controlTexture", controlTexture, 1),
            WglArg.float("outputWidth", destinationTexture.width),
            WglArg.vec2("inputSize", inputTexture.width, inputTexture.height),
            WglArg.float("qubitSrcIndex1", 1 << srcIndex1),
            WglArg.float("qubitSrcSpan1", 1 << srcSpan1),
            WglArg.float("qubitSrcIndex2", 1 << srcIndex2),
            WglArg.float("qubitSrcSpan2", 1 << srcSpan2),
            WglArg.float("qubitDstIndex", 1 << dstIndex),
            WglArg.float("qubitDstSpan", 1 << dstSpan),
            WglArg.float("scaleFactor", scaleFactor)
        ).renderTo(destinationTexture);
    });
}
const MULTIPLY_ACCUMULATE_SHADER = new WglShader(`
    uniform sampler2D inputTexture;
    uniform sampler2D controlTexture;
    uniform float outputWidth;
    uniform vec2 inputSize;
    uniform float scaleFactor;
    uniform float qubitSrcIndex1;
    uniform float qubitSrcSpan1;
    uniform float qubitSrcIndex2;
    uniform float qubitSrcSpan2;
    uniform float qubitDstIndex;
    uniform float qubitDstSpan;

    vec2 uvFor(float state) {
        return (vec2(mod(state, inputSize.x), floor(state / inputSize.x)) + vec2(0.5, 0.5)) / inputSize;
    }

    void main() {
        vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
        float state = xy.y * outputWidth + xy.x;
        float stateSrc1 = mod(floor(state / qubitSrcIndex1), qubitSrcSpan1);
        float stateSrc2 = mod(floor(state / qubitSrcIndex2), qubitSrcSpan2);
        float stateDst = mod(floor(state / qubitDstIndex), qubitDstSpan);
        float newDst = stateDst - stateSrc1 * stateSrc2 * scaleFactor;
        newDst = mod(newDst, qubitDstSpan);
        newDst = mod(newDst + qubitDstSpan, qubitDstSpan);
        float newState = state + (newDst - stateDst) * qubitDstIndex;

        vec2 oldUv = uvFor(state);
        float control = texture2D(controlTexture, oldUv).x;

        vec2 newUv = uvFor(newState);
        vec2 usedUv = control*newUv + (1.0-control)*oldUv;

        gl_FragColor = texture2D(inputTexture, usedUv);
    }`);

MultiplyAccumulateGates.MultiplyAddFamily = Gate.generateFamily(3, 16, span => Gate.withoutKnownMatrix(
    "c+=ab",
    "Multiply-Add Gate",
    "Adds the product of two numbers into a third.").
    markedAsOnlyPermutingAndPhasing().
    markedAsStable().
    withKnownMatrix(span >= 5 ? undefined : makeScaledMultiplyAddMatrix(span, +1)).
    withSerializedId("c+=ab" + span).
    withCustomDrawer(GatePainting.SECTIONED_DRAWER_MAKER(
        ["a", "b", "c+=ab"],
        sectionSizes(span).slice(0, 2).map(e => e/span))).
    withHeight(span).
    withCustomShader(args => {
        let [a, b, c] = sectionSizes(span);
        return multiplyAccumulate(
            args.stateTexture,
            args.controlsTexture,
            args.row,
            a,
            args.row + a,
            b,
            args.row + a + b,
            c,
            +1)
    }));

MultiplyAccumulateGates.MultiplySubtractFamily = Gate.generateFamily(3, 16, span => Gate.withoutKnownMatrix(
    "c-=ab",
    "Multiply-Subtract Gate",
    "Subtracts the product of two numbers from a third.").
    markedAsOnlyPermutingAndPhasing().
    markedAsStable().
    withKnownMatrix(span >= 5 ? undefined : makeScaledMultiplyAddMatrix(span, -1)).
    withSerializedId("c-=ab" + span).
    withCustomDrawer(GatePainting.SECTIONED_DRAWER_MAKER(
        ["a", "b", "c-=ab"],
        sectionSizes(span).slice(0, 2).map(e => e/span))).
    withHeight(span).
    withCustomShader(args => {
        let [a, b, c] = sectionSizes(span);
        return multiplyAccumulate(
            args.stateTexture,
            args.controlsTexture,
            args.row,
            a,
            args.row + a,
            b,
            args.row + a + b,
            c,
            -1)
    }));

MultiplyAccumulateGates.MultiplyAddInputsFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "+=AB",
    "Multiply-Add Gate [Inputs A, B]",
    "Adds the product of inputs A and B into the qubits covered by this gate.").
    markedAsOnlyPermutingAndPhasing().
    markedAsStable().
    withSerializedId("+=AB" + span).
    withHeight(span).
    withCustomDisableReasonFinder(Gate.disableReasonFinder_needInput('need\ninput\nA, B',
        'Input Range A', 'Input Range B')).
    withCustomShader(args => {
        let {offset: inputOffsetA, length: inputLengthA} = args.customContextFromGates.get('Input Range A');
        let {offset: inputOffsetB, length: inputLengthB} = args.customContextFromGates.get('Input Range B');
        return multiplyAccumulate(
            args.stateTexture,
            args.controlsTexture,
            inputOffsetA,
            inputLengthA,
            inputOffsetB,
            inputLengthB,
            args.row,
            span,
            +1)
    }));

MultiplyAccumulateGates.MultiplySubtractInputsFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "-=AB",
    "Multiply-Subtract Gate [Inputs A, B]",
    "Subtracts the product of inputs A and B out of the qubits covered by this gate.").
    markedAsOnlyPermutingAndPhasing().
    markedAsStable().
    withSerializedId("-=AB" + span).
    withHeight(span).
    withCustomDisableReasonFinder(Gate.disableReasonFinder_needInput('need\ninput\nA, B',
        'Input Range A', 'Input Range B')).
    withCustomShader(args => {
        let {offset: inputOffsetA, length: inputLengthA} = args.customContextFromGates.get('Input Range A');
        let {offset: inputOffsetB, length: inputLengthB} = args.customContextFromGates.get('Input Range B');
        return multiplyAccumulate(
            args.stateTexture,
            args.controlsTexture,
            inputOffsetA,
            inputLengthA,
            inputOffsetB,
            inputLengthB,
            args.row,
            span,
            -1)
    }));

MultiplyAccumulateGates.all = [
    ...MultiplyAccumulateGates.MultiplyAddFamily.all,
    ...MultiplyAccumulateGates.MultiplySubtractFamily.all,
    ...MultiplyAccumulateGates.MultiplyAddInputsFamily.all,
    ...MultiplyAccumulateGates.MultiplySubtractInputsFamily.all
];

export default MultiplyAccumulateGates;
export {MultiplyAccumulateGates}
