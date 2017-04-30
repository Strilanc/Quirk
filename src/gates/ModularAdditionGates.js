import {Gate} from "src/circuit/Gate.js"
import {ketArgs, ketShaderPermute, ketInputGateShaderCode} from "src/circuit/KetShaderUtil.js"
import {Util} from "src/base/Util.js"
import {WglArg} from "src/webgl/WglArg.js"
import {modulusTooBigChecker} from "src/gates/ModularIncrementGates.js"

let ModularAdditionGates = {};

const MODULAR_ADDITION_SHADER = ketShaderPermute(
    `
        uniform float factor;
        ${ketInputGateShaderCode('A')}
        ${ketInputGateShaderCode('R')}
    `,
    `
        float r = read_input_R();
        if (out_id >= r) {
            return out_id;
        }
        float d = read_input_A();
        d *= factor;
        d = mod(d, r);
        float result = mod(out_id + r - d, r);

        // Despite sanity, I consistently get result=33 instead of result=0 when out_id=0, d=0, r=33.
        // HACK: Fix it by hand.
        if (result >= r) {
            result -= r;
        }

        return result;
    `);

ModularAdditionGates.PlusAModRFamily = Gate.buildFamily(1, 16, (span, builder) => builder.
    setSerializedId("+AmodR" + span).
    setSymbol("+A\nmod R").
    setTitle("Modular Addition Gate").
    setBlurb("Adds input A into the target, mod input R.\nOnly affects values below R.").
    setRequiredContextKeys("Input Range A", "Input Range R").
    setExtraDisableReasonFinder(modulusTooBigChecker("R", span)).
    setActualEffectToShaderProvider(ctx => MODULAR_ADDITION_SHADER.withArgs(
        ...ketArgs(ctx, span, ['A', 'R']),
        WglArg.float("factor", +1))).
    setKnownEffectToParametrizedPermutation((t, a, b) => t < b ? (t + a) % b : t));

ModularAdditionGates.MinusAModRFamily = Gate.buildFamily(1, 16, (span, builder) => builder.
    setSerializedId("-AmodR" + span).
    setSymbol("−A\nmod R").
    setTitle("Modular Subtraction Gate").
    setBlurb("Subtracts input A out of the target, mod input R.\nOnly affects values below R.").
    setRequiredContextKeys("Input Range A", "Input Range R").
    setExtraDisableReasonFinder(modulusTooBigChecker("R", span)).
    setActualEffectToShaderProvider(ctx => MODULAR_ADDITION_SHADER.withArgs(
        ...ketArgs(ctx, span, ['A', 'R']),
        WglArg.float("factor", -1))).
    setKnownEffectToParametrizedPermutation((t, a, b) => t < b ? Util.properMod(t - a, b) : t));

ModularAdditionGates.all = [
    ...ModularAdditionGates.PlusAModRFamily.all,
    ...ModularAdditionGates.MinusAModRFamily.all,
];

export {ModularAdditionGates}
