import {Gate} from "src/circuit/Gate.js"
import {ketArgs, ketShaderPhase} from "src/circuit/KetShaderUtil.js"
import {WglArg} from "src/webgl/WglArg.js"
import {WglConfiguredShader} from "src/webgl/WglConfiguredShader.js"

const PHASE_GRADIENT_SHADER = ketShaderPhase(
    'uniform float factor;',
    `
        float angle = out_id * factor;
        return vec2(cos(angle), sin(angle));
    `);

let PhaseGradientGates = {};

PhaseGradientGates.PhaseGradientFamily = Gate.buildFamily(1, 16, (span, builder) => builder.
    setSerializedId("PhaseGradient" + span).
    setSymbol("e^iπ%").
    setTitle("Phase Gradient Gate").
    setBlurb("Phases by an amount proportional to the target value.").
    setActualEffectToShaderProvider(ctx => PHASE_GRADIENT_SHADER.withArgs(
        ...ketArgs(ctx, span),
        WglArg.float("factor", Math.PI / (1 << span)))).
    setKnownEffectToPhaser(k => k / (2 << span)));

PhaseGradientGates.PhaseDegradientFamily = Gate.buildFamily(1, 16, (span, builder) => builder.
    setSerializedId("PhaseUngradient" + span).
    setSymbol("e^-iπ%").
    setTitle("Inverse Phase Gradient Gate").
    setBlurb("Counter-phases by an amount proportional to the target value.").
    setActualEffectToShaderProvider(ctx => PHASE_GRADIENT_SHADER.withArgs(
        ...ketArgs(ctx, span),
        WglArg.float("factor", -Math.PI / (1 << span)))).
    setKnownEffectToPhaser(k => -k / (2 << span)));

PhaseGradientGates.all = [
    ...PhaseGradientGates.PhaseGradientFamily.all,
    ...PhaseGradientGates.PhaseDegradientFamily.all,
];

export {PhaseGradientGates, PHASE_GRADIENT_SHADER}
