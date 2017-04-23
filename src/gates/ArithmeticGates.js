import {Gate} from "src/circuit/Gate.js"
import {GatePainting} from "src/draw/GatePainting.js"
import {ketArgs, ketShaderPermute, ketInputGateShaderCode} from "src/circuit/KetShaderUtil.js"
import {WglArg} from "src/webgl/WglArg.js"

let ArithmeticGates = {};

const chunkedScaledAdditionPermutationMaker = (span, factor) => e => {
    let sa = Math.floor(span/2);
    let sb = Math.ceil(span/2);
    let a = e & ((1 << sa) - 1);
    let b = e >> sa;
    b += a * factor;
    b &= ((1 << sb) - 1);
    return a + (b << sa);
};

const offsetShader = ketShaderPermute(
    'uniform float amount;',
    'return mod(out_id - amount + span, span);');

const ADDITION_SHADER = ketShaderPermute(
    `
        uniform float factor;
        ${ketInputGateShaderCode('A')}
    `,
    `
        float d = read_input_A();
        d *= factor;
        d = mod(d, span);
        return mod(out_id + span - d, span);`);

ArithmeticGates.IncrementFamily = Gate.buildFamily(1, 16, (span, builder) => builder.
    setSerializedId("inc" + span).
    setSymbol("+1").
    setTitle("Increment Gate").
    setBlurb("Adds 1 to the little-endian number represented by a block of qubits.").
    setActualEffectToShaderProvider(ctx => offsetShader.withArgs(
        ...ketArgs(ctx, span),
        WglArg.float("amount", +1))).
    setKnownEffectToPermutation(t => (t + 1) & ((1 << span) - 1)));

ArithmeticGates.DecrementFamily = Gate.buildFamily(1, 16, (span, builder) => builder.
    setSerializedId("dec" + span).
    setSymbol("-1").
    setTitle("Decrement Gate").
    setBlurb("Subtracts 1 from the little-endian number represented by a block of qubits.").
    setActualEffectToShaderProvider(ctx => offsetShader.withArgs(
        ...ketArgs(ctx, span),
        WglArg.float("amount", -1))).
    setKnownEffectToPermutation(t => (t - 1) & ((1 << span) - 1)));

ArithmeticGates.AdditionFamily = Gate.buildFamily(2, 16, (span, builder) => builder.
    setSerializedId("add" + span).
    setSymbol("b+=a").
    setTitle("Addition Gate").
    setBlurb("Adds a little-endian number into another.").
    setDrawer(GatePainting.SECTIONED_DRAWER_MAKER(["a", "b+=a"], [Math.floor(span/2) / span])).
    setActualEffectToUpdateFunc(ctx =>
        ArithmeticGates.PlusAFamily.ofSize(Math.ceil(span/2)).customOperation(
            ctx.withRow(ctx.row + Math.floor(span/2)).
                withInputSetToRange('A', ctx.row, Math.floor(span/2)))).
    setKnownEffectToPermutation(chunkedScaledAdditionPermutationMaker(span, 1)));

ArithmeticGates.SubtractionFamily = Gate.buildFamily(2, 16, (span, builder) => builder.
    setSerializedId("sub" + span).
    setSymbol("b-=a").
    setTitle("Subtraction Gate").
    setBlurb("Subtracts a little-endian number from another.").
    setDrawer(GatePainting.SECTIONED_DRAWER_MAKER(["a", "b-=a"], [Math.floor(span/2) / span])).
    setActualEffectToUpdateFunc(ctx =>
        ArithmeticGates.MinusAFamily.ofSize(Math.ceil(span/2)).customOperation(
            ctx.withRow(ctx.row + Math.floor(span/2)).
                withInputSetToRange('A', ctx.row, Math.floor(span/2)))).
    setKnownEffectToPermutation(chunkedScaledAdditionPermutationMaker(span, -1)));

ArithmeticGates.PlusAFamily = Gate.buildFamily(1, 16, (span, builder) => builder.
    setSerializedId("+=A" + span).
    setSymbol("+A").
    setTitle("Addition Gate [input A]").
    setBlurb("Adds input A into the qubits covered by this gate.").
    setRequiredContextKeys("Input Range A").
    setActualEffectToShaderProvider(ctx => ADDITION_SHADER.withArgs(
        ...ketArgs(ctx, span, ['A']),
        WglArg.float("factor", +1))).
    setKnownEffectToParametrizedPermutation((v, a) => (v + a) & ((1 << span) - 1)));

ArithmeticGates.MinusAFamily = Gate.buildFamily(1, 16, (span, builder) => builder.
    setSerializedId("-=A" + span).
    setSymbol("−A").
    setTitle("Subtraction Gate [input A]").
    setBlurb("Subtracts input A out of the qubits covered by this gate.").
    setRequiredContextKeys("Input Range A").
    setActualEffectToShaderProvider(ctx => ADDITION_SHADER.withArgs(
        ...ketArgs(ctx, span, ['A']),
        WglArg.float("factor", -1))).
    setKnownEffectToParametrizedPermutation((v, a) => (v - a) & ((1 << span) - 1)));

ArithmeticGates.all = [
    ...ArithmeticGates.IncrementFamily.all,
    ...ArithmeticGates.DecrementFamily.all,
    ...ArithmeticGates.AdditionFamily.all,
    ...ArithmeticGates.SubtractionFamily.all,
    ...ArithmeticGates.PlusAFamily.all,
    ...ArithmeticGates.MinusAFamily.all,
];

export {ArithmeticGates, offsetShader}
