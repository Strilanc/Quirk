/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Config} from "../Config.js";
import {Gate} from "../circuit/Gate.js"
import {GatePainting} from "../draw/GatePainting.js"
import {ketArgs, ketShaderPhase} from "../circuit/KetShaderUtil.js"
import {MUL_STEP} from "./MultiplyAccumulateGates.js"
import {WglArg} from "../webgl/WglArg.js"
import {Matrix} from "../math/Matrix.js";
import {Complex} from "../math/Complex.js";

const PHASE_GRADIENT_SHADER = ketShaderPhase(
    `
        uniform float factor;

        /// Scales an angle by an integer factor.
        /// Performs the multiplication gradually, to avoid losing precision.
        float angle_mul(float base_angle, float whole_factor) {
            float result = 0.0;
            for (int k = 0; k < ${Math.ceil(Config.MAX_WIRE_COUNT/MUL_STEP)}; k++) {
                result += base_angle * mod(whole_factor, ${1<<MUL_STEP}.0);
                result = mod(result, 6.283185307179586476925286766559);
                whole_factor = floor(whole_factor / ${1<<MUL_STEP}.0);
                base_angle = mod(base_angle * ${1<<MUL_STEP}.0, 6.283185307179586476925286766559);
            }
            return result;
        }
    `,
    `
        return angle_mul(factor, out_id);
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
    setAlternateFromFamily(PhaseGradientGates.PhaseGradientFamily).
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
    setEffectToTimeVaryingMatrix(t => Matrix.generateDiagonal(
        1 << span,
        k => Complex.polar(1, t * 2 * Math.PI * k))).
    promiseEffectOnlyPhases().
    setDrawer(GatePainting.makeCycleDrawer(-1, -1, 1, -Math.PI / 2)));

PhaseGradientGates.DynamicPhaseDegradientFamily = Gate.buildFamily(1, 16, (span, builder) => builder.
    setAlternateFromFamily(PhaseGradientGates.DynamicPhaseGradientFamily).
    setSerializedId("grad^-t" + span).
    setSymbol("Grad^-t").
    setTitle("Inverse Cycling Gradient Gate").
    setBlurb("Counter-phases the target by a cycling amount proportional its value.").
    setActualEffectToShaderProvider(ctx => PHASE_GRADIENT_SHADER.withArgs(
        ...ketArgs(ctx, span),
        WglArg.float("factor", -ctx.time * Math.PI * 2))).
    setEffectToTimeVaryingMatrix(t => Matrix.generateDiagonal(
        1 << span,
        k => Complex.polar(1, t * 2 * Math.PI * -k))).
    promiseEffectOnlyPhases().
    setDrawer(GatePainting.makeCycleDrawer(1, -1, 1, Math.PI / 2)));

PhaseGradientGates.all = [
    ...PhaseGradientGates.PhaseGradientFamily.all,
    ...PhaseGradientGates.PhaseDegradientFamily.all,
    ...PhaseGradientGates.DynamicPhaseGradientFamily.all,
    ...PhaseGradientGates.DynamicPhaseDegradientFamily.all,
];

export {PhaseGradientGates, PHASE_GRADIENT_SHADER}
