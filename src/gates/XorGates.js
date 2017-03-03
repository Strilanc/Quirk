import {Config} from "src/Config.js"
import {Gate} from "src/circuit/Gate.js"
import {ketArgs, ketShaderPermute} from "src/circuit/KetShaderUtil.js"
import {WglArg} from "src/webgl/WglArg.js"

let XorGates = {};

const XOR_SHADER = ketShaderPermute(
    'uniform float srcOffset, srcSpan;',
    `
        float srcMask = mod(floor(full_out_id / srcOffset), srcSpan);
        float bitPos = 1.0;
        float result = 0.0;
        for (int i = 0; i < ${Config.MAX_WIRE_COUNT}; i++) {
            float srcBit = mod(floor(srcMask/bitPos), 2.0);
            float dstBit = mod(floor(out_id/bitPos), 2.0);
            result += (dstBit + srcBit - dstBit * srcBit * 2.0) * bitPos;
            bitPos *= 2.0;
        }
        return result;`);

XorGates.XorAFamily = Gate.generateFamily(1, 8, span => Gate.withoutKnownMatrix(
    "⊕A",
    "Xor Gate [input A]",
    "Xors 'input A' into the qubits covered by this gate.").
    markedAsOnlyPermutingAndPhasing().
    markedAsStable().
    withHeight(span).
    withSerializedId("^=A" + span).
    withRequiredContextKeys("Input Range A").
    withCustomShader(ctx => {
        let {offset: inputOffset, length: inputLength} = ctx.customContextFromGates.get('Input Range A');
        let n = Math.min(inputLength, span);
        return XOR_SHADER.withArgs(
            ...ketArgs(ctx, n),
            WglArg.float("srcOffset", 1 << inputOffset),
            WglArg.float("srcSpan", 1 << n));
    }));

XorGates.all = [
    ...XorGates.XorAFamily.all,
];

export {XorGates}
