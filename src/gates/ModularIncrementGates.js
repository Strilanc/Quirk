import {Gate} from "src/circuit/Gate.js"
import {ketArgs, ketShaderPermute, ketInputGateShaderCode} from "src/circuit/KetShaderUtil.js"
import {Util} from "src/base/Util.js"
import {WglArg} from "src/webgl/WglArg.js"

let ModularIncrementGates = {};

/**
 * @param {!string} inputKey
 * @param {!int} span
 * @returns {!function(!GateCheckArgs) : (undefined|!string)}
 */
let modulusTooBigChecker = (inputKey, span) => args => {
    let r = args.context.get('Input Range ' + inputKey);
    let d = args.context.get('Input Default ' + inputKey);
    if (r !== undefined && r.length > span) {
        return "mod\ntoo\nbig";
    }
    if (r === undefined && d !== undefined && d > 1<<span) {
        return "mod\ntoo\nbig";
    }
    return undefined;
};

const MODULAR_INCREMENT_SHADER = ketShaderPermute(
    `
        uniform float amount;
        ${ketInputGateShaderCode('R')}
    `,
    `
        float r = read_input_R();
        return out_id >= r
            ? out_id
            // HACK: sometimes mod(value-equal-to-r, r) returns r instead of 0. The perturbation works around it.
            : floor(mod(out_id + r - amount, r - 0.000001));`);

ModularIncrementGates.IncrementModRFamily = Gate.buildFamily(1, 16, (span, builder) => builder.
    setSerializedId("incmodR" + span).
    setSymbol("+1\nmod R").
    setTitle("Modular Increment Gate").
    setBlurb("Adds 1 into the target, but wraps R-1 to 0.\n" +
        "Only affects values less than R.").
    setRequiredContextKeys("Input Range R").
    setExtraDisableReasonFinder(modulusTooBigChecker("R", span)).
    setActualEffectToShaderProvider(ctx => MODULAR_INCREMENT_SHADER.withArgs(
        ...ketArgs(ctx, span, ['R']),
        WglArg.float("amount", +1))).
    setKnownEffectToParametrizedPermutation((t, a) => t < a ? (t + 1) % a : t));

ModularIncrementGates.DecrementModRFamily = Gate.buildFamily(1, 16, (span, builder) => builder.
    setSerializedId("decmodR" + span).
    setSymbol("−1\nmod R").
    setTitle("Modular Decrement Gate").
    setBlurb("Subtracts 1 out of the target, but wraps 0 to R-1.\n" +
        "Only affects values less than R.").
    setRequiredContextKeys("Input Range R").
    setExtraDisableReasonFinder(modulusTooBigChecker("R", span)).
    setActualEffectToShaderProvider(ctx => MODULAR_INCREMENT_SHADER.withArgs(
        ...ketArgs(ctx, span, ['R']),
        WglArg.float("amount", -1))).
    setKnownEffectToParametrizedPermutation((t, a) => t < a ? Util.properMod(t - 1, a) : t));

ModularIncrementGates.all = [
    ...ModularIncrementGates.IncrementModRFamily.all,
    ...ModularIncrementGates.DecrementModRFamily.all,
];

export {ModularIncrementGates, modulusTooBigChecker}
