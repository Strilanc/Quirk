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

XorGates.XorAFamily = Gate.buildFamily(1, 8, (span, builder) => builder.
    setSerializedId("^=A" + span).
    setSymbol("⊕A").
    setTitle("Xor Gate [input A]").
    setBlurb("Xors input A into the qubits covered by this gate.").
    setRequiredContextKeys("Input Range A").
    setKnownEffectToParametrizedPermutation((t, a) => t ^ (a & ((1<<span)-1))).
    setActualEffectToShaderProvider(ctx => XOR_SHADER.withArgs(...ketArgs(ctx, span, ['A']))));

XorGates.all = [
    ...XorGates.XorAFamily.all,
];

export {XorGates}
