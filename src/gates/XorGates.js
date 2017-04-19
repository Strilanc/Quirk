import {Config} from "src/Config.js"
import {Gate} from "src/circuit/Gate.js"
import {ketArgs, ketShaderPermute, ketInputGateShaderCode} from "src/circuit/KetShaderUtil.js"

let XorGates = {};

const XOR_SHADER = ketShaderPermute(
    ketInputGateShaderCode('A'),
    `
        float srcMask = mod(read_input_A(), span);
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
    "Xors input A into the qubits covered by this gate.").
    withHeight(span).
    withSerializedId("^=A" + span).
    withRequiredContextKeys("Input Range A").
    withKnownPermutation((t, a) => t ^ (a & ((1<<span)-1))).
    withCustomShader(ctx => XOR_SHADER.withArgs(...ketArgs(ctx, span, ['A']))));

XorGates.all = [
    ...XorGates.XorAFamily.all,
];

export {XorGates}
