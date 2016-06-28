import Gate from "src/circuit/Gate.js"
import GatePainting from "src/ui/GatePainting.js"
import GateShaders from "src/circuit/GateShaders.js"
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

const makeScaledMultiplyAddMatrix = (span, scaleFactor) => Matrix.generate(1<<span, 1<<span, (row, col) => {
    let expected = row;
    let input = col;
    let [sa, sb, sc] = sectionSizes(span);
    let a = input & ((1 << sa) - 1);
    let b = (input >> sa) & ((1 << sb) - 1);
    let c = input >> (sa + sb);
    c += a*b*scaleFactor;
    c &= ((1 << sc) - 1);
    let actual = a | (b << sa) | (c << (sa+sb));
    return expected === actual ? 1 : 0;
});

/**
 * @param {!WglTexture} inputTexture
 * @param {!WglTexture} controlTexture
 * @param {!int} qubitIndex
 * @param {!int} srcSpan1
 * @param {!int} srcSpan2
 * @param {!int} dstSpan
 * @param {!int} scaleFactor
 * @returns {!WglConfiguredShader}
 */
GateShaders.multiplyAccumulate = (inputTexture, controlTexture, qubitIndex, srcSpan1, srcSpan2, dstSpan, scaleFactor) =>
    new WglConfiguredShader(destinationTexture => {
        MULTIPLY_ACCUMULATE_SHADER.withArgs(
            WglArg.texture("inputTexture", inputTexture, 0),
            WglArg.texture("controlTexture", controlTexture, 1),
            WglArg.float("outputWidth", destinationTexture.width),
            WglArg.vec2("inputSize", inputTexture.width, inputTexture.height),
            WglArg.float("qubitIndex", 1 << qubitIndex),
            WglArg.float("qubitSrcSpan1", 1 << srcSpan1),
            WglArg.float("qubitSrcSpan2", 1 << srcSpan2),
            WglArg.float("qubitDstSpan", 1 << dstSpan),
            WglArg.float("scaleFactor", scaleFactor)
        ).renderTo(destinationTexture);
    });
const MULTIPLY_ACCUMULATE_SHADER = new WglShader(`
    uniform sampler2D inputTexture;
    uniform sampler2D controlTexture;
    uniform float outputWidth;
    uniform vec2 inputSize;
    uniform float scaleFactor;
    uniform float qubitIndex;
    uniform float qubitSrcSpan1;
    uniform float qubitSrcSpan2;
    uniform float qubitDstSpan;

    vec2 uvFor(float state) {
        return (vec2(mod(state, inputSize.x), floor(state / inputSize.x)) + vec2(0.5, 0.5)) / inputSize;
    }

    void main() {
        vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
        float state = xy.y * outputWidth + xy.x;
        float stateSrc1 = mod(floor(state / qubitIndex), qubitSrcSpan1);
        float stateSrc2 = mod(floor(state / qubitIndex / qubitSrcSpan1), qubitSrcSpan2);
        float stateDst = mod(floor((state / qubitIndex) / qubitSrcSpan1 / qubitSrcSpan2), qubitDstSpan);
        float newDst = mod(stateDst + (qubitDstSpan - stateSrc1*stateSrc2) * scaleFactor, qubitDstSpan);
        float newState = state + (newDst - stateDst) * qubitIndex * qubitSrcSpan1 * qubitSrcSpan2;

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
    withCustomShader((val, con, bit) => {
        let [a, b, c] = sectionSizes(span);
        return GateShaders.multiplyAccumulate(
            val,
            con,
            bit,
            a,
            b,
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
    withCustomShader((val, con, bit) => {
        let [a, b, c] = sectionSizes(span);
        return GateShaders.multiplyAccumulate(
            val,
            con,
            bit,
            a,
            b,
            c,
            -1)
    }));

MultiplyAccumulateGates.all = [
    ...MultiplyAccumulateGates.MultiplyAddFamily.all,
    ...MultiplyAccumulateGates.MultiplySubtractFamily.all
];

export default MultiplyAccumulateGates;
export {MultiplyAccumulateGates}
