import {Gate} from "src/circuit/Gate.js"
import {ketArgs, ketShaderPermute} from "src/circuit/KetShaderUtil.js"
import {WglArg} from "src/webgl/WglArg.js"

let IncrementGates = {};

const offsetShader = ketShaderPermute(
    'uniform float amount;',
    'return mod(out_id - amount + span, span);');

IncrementGates.IncrementFamily = Gate.buildFamily(1, 16, (span, builder) => builder.
    setSerializedId("inc" + span).
    setSymbol("+1").
    setTitle("Increment Gate").
    setBlurb("Adds 1 to the little-endian number represented by a block of qubits.").
    setActualEffectToShaderProvider(ctx => offsetShader.withArgs(
        ...ketArgs(ctx, span),
        WglArg.float("amount", +1))).
    setKnownEffectToPermutation(t => (t + 1) & ((1 << span) - 1)));

IncrementGates.DecrementFamily = Gate.buildFamily(1, 16, (span, builder) => builder.
    setAlternateFromFamily(IncrementGates.IncrementFamily).
    setSerializedId("dec" + span).
    setSymbol("−1").
    setTitle("Decrement Gate").
    setBlurb("Subtracts 1 from the little-endian number represented by a block of qubits.").
    setActualEffectToShaderProvider(ctx => offsetShader.withArgs(
        ...ketArgs(ctx, span),
        WglArg.float("amount", -1))).
    setKnownEffectToPermutation(t => (t - 1) & ((1 << span) - 1)));

IncrementGates.all = [
    ...IncrementGates.IncrementFamily.all,
    ...IncrementGates.DecrementFamily.all,
];

export {IncrementGates, offsetShader}
