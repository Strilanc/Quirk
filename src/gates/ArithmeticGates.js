import Gate from "src/circuit/Gate.js"
import GatePainting from "src/draw/GatePainting.js"
import GateShaders from "src/circuit/GateShaders.js"
import Matrix from "src/math/Matrix.js"
import WglArg from "src/webgl/WglArg.js"
import { WglConfiguredShader, WglShader } from "src/webgl/WglShader.js"

let ArithmeticGates = {};

const makeOffsetMatrix = (offset, qubitSpan) =>
    Matrix.generateTransition(1<<qubitSpan, e => (e + offset) & ((1<<qubitSpan)-1));

const INCREMENT_MATRIX_MAKER = span => makeOffsetMatrix(1, span);
const DECREMENT_MATRIX_MAKER = span => makeOffsetMatrix(-1, span);
const ADDITION_MATRIX_MAKER = span => Matrix.generateTransition(1<<span, e => {
    let sa = Math.floor(span/2);
    let sb = Math.ceil(span/2);
    let a = e & ((1 << sa) - 1);
    let b = e >> sa;
    b += a;
    b &= ((1 << sb) - 1);
    return a + (b << sa);
});
const SUBTRACTION_MATRIX_MAKER = span => Matrix.generateTransition(1<<span, e => {
    let sa = Math.floor(span/2);
    let sb = Math.ceil(span/2);
    let a = e & ((1 << sa) - 1);
    let b = e >> sa;
    b -= a;
    b &= ((1 << sb) - 1);
    return a + (b << sa);
});

/**
 * @param {!WglTexture} inputTexture
 * @param {!WglTexture} controlTexture
 * @param {!int} srcOffset
 * @param {!int} srcSpan
 * @param {!int} dstOffset
 * @param {!int} dstSpan
 * @param {!int} scaleFactor
 * @returns {!WglConfiguredShader}
 */
function additionShaderFunc(inputTexture, controlTexture, srcOffset, srcSpan, dstOffset, dstSpan, scaleFactor) {
    return new WglConfiguredShader(destinationTexture => {
        ADDITION_SHADER.withArgs(
            WglArg.texture("inputTexture", inputTexture, 0),
            WglArg.texture("controlTexture", controlTexture, 1),
            WglArg.float("outputWidth", destinationTexture.width),
            WglArg.vec2("inputSize", inputTexture.width, inputTexture.height),
            WglArg.float("qubitSrcIndex", 1 << srcOffset),
            WglArg.float("qubitSrcSpan", 1 << srcSpan),
            WglArg.float("qubitDstIndex", 1 << dstOffset),
            WglArg.float("qubitDstSpan", 1 << dstSpan),
            WglArg.float("scaleFactor", scaleFactor)
        ).renderTo(destinationTexture);
    });
}
const ADDITION_SHADER = new WglShader(`
    uniform sampler2D inputTexture;
    uniform sampler2D controlTexture;
    uniform float outputWidth;
    uniform vec2 inputSize;
    uniform float scaleFactor;
    uniform float qubitSrcIndex;
    uniform float qubitSrcSpan;
    uniform float qubitDstIndex;
    uniform float qubitDstSpan;

    vec2 uvFor(float state) {
        return (vec2(mod(state, inputSize.x), floor(state / inputSize.x)) + vec2(0.5, 0.5)) / inputSize;
    }

    void main() {
        vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
        float state = xy.y * outputWidth + xy.x;
        float stateSrc = mod(floor(state / qubitSrcIndex), qubitSrcSpan);
        float stateDst = mod(floor(state / qubitDstIndex), qubitDstSpan);
        float newDst = mod(stateDst + (qubitDstSpan - stateSrc) * scaleFactor, qubitDstSpan);
        float newState = state + (newDst - stateDst) * qubitDstIndex;

        vec2 oldUv = uvFor(state);
        float control = texture2D(controlTexture, oldUv).x;

        vec2 newUv = uvFor(newState);
        vec2 usedUv = control*newUv + (1.0-control)*oldUv;

        gl_FragColor = texture2D(inputTexture, usedUv);
    }`);

ArithmeticGates.IncrementFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "++",
    "Increment Gate",
    "Adds 1 to the little-endian number represented by a block of qubits.").
    markedAsOnlyPermutingAndPhasing().
    markedAsStable().
    withKnownMatrix(span >= 4 ? undefined : INCREMENT_MATRIX_MAKER(span)).
    withSerializedId("inc" + span).
    withHeight(span).
    withCustomShader(args => GateShaders.increment(
        args.stateTexture,
        args.controlsTexture,
        args.row,
        span,
        +1)));

ArithmeticGates.DecrementFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "- -",
    "Decrement Gate",
    "Subtracts 1 from the little-endian number represented by a block of qubits.").
    markedAsOnlyPermutingAndPhasing().
    markedAsStable().
    withKnownMatrix(span >= 4 ? undefined : DECREMENT_MATRIX_MAKER(span)).
    withSerializedId("dec" + span).
    withHeight(span).
    withCustomShader(args => GateShaders.increment(
        args.stateTexture,
        args.controlsTexture,
        args.row,
        span,
        -1)));

ArithmeticGates.AdditionFamily = Gate.generateFamily(2, 16, span => Gate.withoutKnownMatrix(
    "b+=a",
    "Addition Gate",
    "Adds a little-endian number into another.").
    markedAsOnlyPermutingAndPhasing().
    markedAsStable().
    withKnownMatrix(span >= 5 ? undefined : ADDITION_MATRIX_MAKER(span)).
    withSerializedId("add" + span).
    withCustomDrawer(GatePainting.SECTIONED_DRAWER_MAKER(["a", "b+=a"], [Math.floor(span/2) / span])).
    withHeight(span).
    withCustomShader(args => additionShaderFunc(
        args.stateTexture,
        args.controlsTexture,
        args.row,
        Math.floor(span/2),
        args.row + Math.floor(span/2),
        Math.ceil(span/2),
        +1)));

ArithmeticGates.SubtractionFamily = Gate.generateFamily(2, 16, span => Gate.withoutKnownMatrix(
    "b-=a",
    "Subtraction Gate",
    "Subtracts a little-endian number from another.").
    markedAsOnlyPermutingAndPhasing().
    markedAsStable().
    withKnownMatrix(span >= 5 ? undefined : SUBTRACTION_MATRIX_MAKER(span)).
    withSerializedId("sub" + span).
    withCustomDrawer(GatePainting.SECTIONED_DRAWER_MAKER(["a", "b-=a"], [Math.floor(span/2) / span])).
    withHeight(span).
    withCustomShader(args => additionShaderFunc(
        args.stateTexture,
        args.controlsTexture,
        args.row,
        Math.floor(span/2),
        args.row + Math.floor(span/2),
        Math.ceil(span/2),
        -1)));

let needKey = key => col => {
    for (let i = 0; i < col.gates.length; i++) {
        let g = col.gates[i];
        if (g !== null && g.customColumnContextProvider(i).map(e => e.key).indexOf('Input Range A') !== -1) {
            return undefined;
        }
    }
    return "need\ninput\nA";
};

ArithmeticGates.PlusAFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "+=A",
    "Addition Gate [input A]",
    "Adds 'input A' qubits into the qubits covered by this gate.").
    markedAsOnlyPermutingAndPhasing().
    markedAsStable().
    withHeight(span).
    withSerializedId("+=A" + span).
    withCustomDisableReasonFinder(needKey('Input Range A')).
    withCustomShader(args => {
        let {offset: inputOffset, length: inputLength} = args.customContextFromGates.get('Input Range A');
        return additionShaderFunc(
            args.stateTexture,
            args.controlsTexture,
            inputOffset,
            inputLength,
            args.row,
            span,
            +1);
    }));

ArithmeticGates.MinusAFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "-=A",
    "Subtraction Gate [input A]",
    "Subtracts 'input A' qubits out of the qubits covered by this gate.").
    markedAsOnlyPermutingAndPhasing().
    markedAsStable().
    withHeight(span).
    withSerializedId("-=A" + span).
    withCustomDisableReasonFinder(needKey('Input Range A')).
    withCustomShader(args => {
        let {offset: inputOffset, length: inputLength} = args.customContextFromGates.get('Input Range A');
        return additionShaderFunc(
            args.stateTexture,
            args.controlsTexture,
            inputOffset,
            inputLength,
            args.row,
            span,
            -1);
    }));

ArithmeticGates.all = [
    ...ArithmeticGates.IncrementFamily.all,
    ...ArithmeticGates.DecrementFamily.all,
    ...ArithmeticGates.AdditionFamily.all,
    ...ArithmeticGates.SubtractionFamily.all,
    ...ArithmeticGates.PlusAFamily.all,
    ...ArithmeticGates.MinusAFamily.all
];

export default ArithmeticGates;
export {ArithmeticGates, makeOffsetMatrix, additionShaderFunc}
