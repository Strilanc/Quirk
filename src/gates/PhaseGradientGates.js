import {Gate} from "src/circuit/Gate.js"
import {GatePainting} from "src/draw/GatePainting.js"
import {ketArgs, ketShaderPhase} from "src/circuit/KetShaderUtil.js"
import {WglArg} from "src/webgl/WglArg.js"

const PHASE_GRADIENT_SHADER = ketShaderPhase(
    'uniform float factor;',
    `
        float angle = out_id * factor;
        return vec2(cos(angle), sin(angle));
    `);

let PhaseGradientGates = {};

PhaseGradientGates.PhaseGradientFamily = Gate.buildFamily(1, 16, (span, builder) => builder.
    setSerializedId("PhaseGradient" + span).
    setSymbol("Grad^½").
    setTitle("Half Gradient Gate").
    setBlurb("Phases the target by an amount proportional its value.").
    setActualEffectToShaderProvider(ctx => PHASE_GRADIENT_SHADER.withArgs(
        ...ketArgs(ctx, span),
        WglArg.float("factor", Math.PI / (1 << span)))).
    setKnownEffectToPhaser(k => k / (2 << span)));

PhaseGradientGates.PhaseDegradientFamily = Gate.buildFamily(1, 16, (span, builder) => builder.
    setSerializedId("PhaseUngradient" + span).
    setSymbol("Grad^-½").
    setTitle("Inverse Half Gradient Gate").
    setBlurb("Counter-phases the target by an amount proportional its value.").
    setActualEffectToShaderProvider(ctx => PHASE_GRADIENT_SHADER.withArgs(
        ...ketArgs(ctx, span),
        WglArg.float("factor", -Math.PI / (1 << span)))).
    setKnownEffectToPhaser(k => -k / (2 << span)));

PhaseGradientGates.DynamicPhaseGradientFamily = Gate.buildFamily(1, 16, (span, builder) => builder.
    setSerializedId("grad^t" + span).
    setSymbol("Grad^t").
    setTitle("Cycling Gradient Gate").
    setBlurb("Phases the target by a cycling amount proportional its value.").
    setActualEffectToShaderProvider(ctx => PHASE_GRADIENT_SHADER.withArgs(
        ...ketArgs(ctx, span),
        WglArg.float("factor", ctx.time * Math.PI * 2))).
    promiseEffectOnlyPhases().
    setDrawer(GatePainting.makeCycleDrawer(-1, -1)));

PhaseGradientGates.DynamicPhaseDegradientFamily = Gate.buildFamily(1, 16, (span, builder) => builder.
    setSerializedId("grad^-t" + span).
    setSymbol("Grad^-t").
    setTitle("Inverse Cycling Gradient Gate").
    setBlurb("Counter-phases the target by a cycling amount proportional its value.").
    setActualEffectToShaderProvider(ctx => PHASE_GRADIENT_SHADER.withArgs(
        ...ketArgs(ctx, span),
        WglArg.float("factor", -ctx.time * Math.PI * 2))).
    promiseEffectOnlyPhases().
    setDrawer(GatePainting.makeCycleDrawer(1, -1)));

PhaseGradientGates.all = [
    ...PhaseGradientGates.PhaseGradientFamily.all,
    ...PhaseGradientGates.PhaseDegradientFamily.all,
    ...PhaseGradientGates.DynamicPhaseGradientFamily.all,
    ...PhaseGradientGates.DynamicPhaseDegradientFamily.all,
];

export {PhaseGradientGates, PHASE_GRADIENT_SHADER}
