import {Gate} from "src/circuit/Gate.js"
import {ketArgs, ketShaderPermute} from "src/circuit/KetShaderUtil.js"
import {Util} from "src/base/Util.js"
import {WglArg} from "src/webgl/WglArg.js"

let ModularArithmeticGates = {};

/**
 * @param {!string} inputKey
 * @param {!int} span
 * @returns {!function(!GateCheckArgs) : (undefined|!string)}
 */
let modulusTooBigChecker = (inputKey, span) => args => {
    let r = args.context.get(inputKey);
    if (r !== undefined && r.length > span) {
        return "mod\ntoo\nbig";
    }
    return undefined;
};

const MODULAR_INCREMENT_SHADER = ketShaderPermute(
    'uniform float modOffset, modSpan, amount;',
    `
        float r = mod(floor(full_out_id / modOffset), modSpan);
        return out_id >= r
            ? out_id
            // HACK: sometimes mod(value-equal-to-r, r) returns r instead of 0. The perturbation works around it.
            : floor(mod(out_id + r - amount, r - 0.000001));`);

ModularArithmeticGates.IncrementModAFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "+1%A",
    "Modular Increment Gate",
    "Adds 1 to a block of qubits, but wraps to 0 at A.\n" +
        "Only affects values less than A.").
    withSerializedId("incmodA" + span).
    withHeight(span).
    withRequiredContextKeys("Input Range A").
    withKnownPermutation((t, a) => t < a ? (t + 1) % a : t).
    withCustomDisableReasonFinder(modulusTooBigChecker("Input Range A", span)).
    withCustomShader(ctx => {
        let {offset: modOffset, length: modSpan} = ctx.customContextFromGates.get('Input Range A');
        return MODULAR_INCREMENT_SHADER.withArgs(
            ...ketArgs(ctx, span),
            WglArg.float("modOffset", 1 << modOffset),
            WglArg.float("modSpan", 1 << modSpan),
            WglArg.float("amount", +1));
    }));

ModularArithmeticGates.DecrementModAFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "−1%A",
    "Modular Decrement Gate",
    "Subtracts 1 from a block of qubits, but wraps to A-1 at -1.\n" +
        "Only affects values less than A.").
    withSerializedId("decmodA" + span).
    withHeight(span).
    withRequiredContextKeys("Input Range A").
    withKnownPermutation((t, a) => t < a ? Util.properMod(t - 1, a) : t).
    withCustomDisableReasonFinder(modulusTooBigChecker("Input Range A", span)).
    withCustomShader(ctx => {
        let {offset: modOffset, length: modSpan} = ctx.customContextFromGates.get('Input Range A');
        return MODULAR_INCREMENT_SHADER.withArgs(
            ...ketArgs(ctx, span),
            WglArg.float("modOffset", 1 << modOffset),
            WglArg.float("modSpan", 1 << modSpan),
            WglArg.float("amount", -1));
    }));

const MODULAR_ADDITION_SHADER = ketShaderPermute(
    'uniform float srcOffset, srcSpan, factor, modOffset, modSpan;',
    `
        float d = mod(floor(full_out_id / srcOffset), srcSpan);
        float r = mod(floor(full_out_id / modOffset), modSpan);
        d *= factor;
        d = mod(d, r);
        return out_id >= r
            ? out_id
            // HACK: sometimes mod(value-equal-to-r, r) returns r instead of 0. The perturbation works around it.
            : floor(mod(out_id + r - d, r - 0.000001) + 0.5);`);

ModularArithmeticGates.PlusAModBFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "+A%B",
    "Modular Addition Gate",
    "Adds 'input A' into the qubits covered by this gate.").
    withHeight(span).
    withSerializedId("+AmodB" + span).
    withRequiredContextKeys("Input Range A", "Input Range B").
    withKnownPermutation((t, a, b) => t < b ? (t + a) % b : t).
    withCustomDisableReasonFinder(modulusTooBigChecker("Input Range B", span)).
    withCustomShader(ctx => {
        let {offset: srcOffset, length: srcSpan} = ctx.customContextFromGates.get('Input Range A');
        let {offset: modOffset, length: modSpan} = ctx.customContextFromGates.get('Input Range B');
        return MODULAR_ADDITION_SHADER.withArgs(
            ...ketArgs(ctx, span),
            WglArg.float("srcOffset", 1 << srcOffset),
            WglArg.float("srcSpan", 1 << srcSpan),
            WglArg.float("modOffset", 1 << modOffset),
            WglArg.float("modSpan", 1 << modSpan),
            WglArg.float("factor", +1));
    }));

ModularArithmeticGates.MinusAModBFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "−A%B",
    "Modular Subtraction Gate",
    "Subtracts 'input A' out of the qubits covered by this gate.").
    withHeight(span).
    withSerializedId("-AmodB" + span).
    withRequiredContextKeys("Input Range A", "Input Range B").
    withKnownPermutation((t, a, b) => t < b ? Util.properMod(t - a, b) : t).
    withCustomDisableReasonFinder(modulusTooBigChecker("Input Range B", span)).
    withCustomShader(ctx => {
        let {offset: srcOffset, length: srcSpan} = ctx.customContextFromGates.get('Input Range A');
        let {offset: modOffset, length: modSpan} = ctx.customContextFromGates.get('Input Range B');
        return MODULAR_ADDITION_SHADER.withArgs(
            ...ketArgs(ctx, span),
            WglArg.float("srcOffset", 1 << srcOffset),
            WglArg.float("srcSpan", 1 << srcSpan),
            WglArg.float("modOffset", 1 << modOffset),
            WglArg.float("modSpan", 1 << modSpan),
            WglArg.float("factor", -1));
    }));

ModularArithmeticGates.all = [
    ...ModularArithmeticGates.IncrementModAFamily.all,
    ...ModularArithmeticGates.DecrementModAFamily.all,
    ...ModularArithmeticGates.PlusAModBFamily.all,
    ...ModularArithmeticGates.MinusAModBFamily.all,
];

export {ModularArithmeticGates}
