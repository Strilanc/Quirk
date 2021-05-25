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

import {Config} from "../Config.js"
import {Gate, GateBuilder} from "../circuit/Gate.js"
import {GatePainting} from "../draw/GatePainting.js"
import {Matrix} from "../math/Matrix.js"
import {Point} from "../math/Point.js"
import {ketArgs} from "../circuit/KetShaderUtil.js"
import {WglArg} from "../webgl/WglArg.js"

import {offsetShader} from "./IncrementGates.js"
import {makeCycleBitsPermutation, cycleBitsShader} from "./CycleBitsGates.js"

let CountingGates = {};

const staircaseCurve = steps => {
    steps = Math.min(128, steps);
    let curve = [];
    for (let i = 0; i < steps; i++) {
        let x = i/steps;
        let y = i/(steps-1);
        if (steps < 128) {
            curve.push(new Point(x, y));
        }
        curve.push(new Point(x + 1 / steps, y));
    }
    return curve;
};

let STAIRCASE_DRAWER = (timeOffset, steps, flip=false) => args => {
    GatePainting.MAKE_HIGHLIGHTED_DRAWER(Config.TIME_DEPENDENT_HIGHLIGHT_COLOR)(args);

    if (args.isInToolbox && !args.isHighlighted) {
        return;
    }

    let t = (args.stats.time + timeOffset) % 1;
    let yOn = args.rect.y + 3;
    let yNeutral = args.rect.bottom();
    let yOff = args.rect.bottom() - 3;
    if (!flip) {
        [yOn, yOff] = [yOff, yOn];
        yNeutral = args.rect.y;
    }
    let xi = args.rect.x;
    let xf = args.rect.right();

    let xt = p => Math.min(Math.max(xi + (xf - xi)*p, xi), xf);
    let yt = p => yOff + (yOn - yOff)*p;
    let curve = [];
    curve.push(new Point(xi, yNeutral));
    curve.push(...staircaseCurve(steps).map(p => new Point(xt(p.x - t), yt(p.y))));
    curve.push(...staircaseCurve(steps).map(p => new Point(xt(p.x + 1 - t), yt(p.y))));
    curve.push(new Point(xf, yNeutral));

    args.painter.ctx.save();
    args.painter.ctx.globalAlpha *= 0.3;
    args.painter.fillPolygon(curve, 'yellow');
    for (let i = 1; i < curve.length - 2; i++) {
        args.painter.strokeLine(curve[i], curve[i+1], 'black');
    }
    if (steps === 2 && t < 0.5) {
        args.painter.fillRect(args.rect, 'white');
        args.painter.fillRect(args.rect, 'white');
        args.painter.fillRect(args.rect, 'white');
    }
    args.painter.ctx.restore();
};

/**
 * @param {!number} time
 * @param {!int} factor
 * @param {!int} span
 * @param {!int} state
 * @returns {!int}
 */
function offsetPermutation(time, factor, span, state) {
    let offset = Math.floor(time * (1 << span)) * factor;
    return (state + offset) & ((1 << span) - 1);
}

/**
 * @param {!number} time
 * @param {!int} factor
 * @param {!int} span
 * @param {!int} state
 * @returns {!int}
 */
function bitOffsetPermutation(time, factor, span, state) {
    let offset = Math.floor(time*span) * factor;
    return makeCycleBitsPermutation(offset, span)(state)
}

CountingGates.ClockPulseGate = new GateBuilder().
    setSerializedIdAndSymbol("X^⌈t⌉").
    setTitle("Clock Pulse Gate").
    setBlurb("Xors a square wave into the target wire.").
    setDrawer(STAIRCASE_DRAWER(0, 2)).
    setEffectToTimeVaryingMatrix(t => (t % 1) < 0.5 ? Matrix.identity(2) : Matrix.PAULI_X).
    promiseEffectOnlyPermutesAndPhases().
    gate;

CountingGates.QuarterPhaseClockPulseGate = new GateBuilder().
    setSerializedIdAndSymbol("X^⌈t-¼⌉").
    setTitle("Clock Pulse Gate (Quarter Phase)").
    setBlurb("Xors a quarter-phased square wave into the target wire.").
    setDrawer(STAIRCASE_DRAWER(0.75, 2)).
    setEffectToTimeVaryingMatrix(t => ((t+0.75) % 1) < 0.5 ? Matrix.identity(2) : Matrix.PAULI_X).
    promiseEffectOnlyPermutesAndPhases().
    gate;

CountingGates.CountingFamily = Gate.buildFamily(1, 16, (span, builder) => builder.
    setSerializedId("Counting" + span).
    setSymbol("+⌈t⌉").
    setTitle("Counting Gate").
    setBlurb("Adds an increasing little-endian count into a block of qubits.").
    setDrawer(STAIRCASE_DRAWER(0, 1 << span)).
    setActualEffectToShaderProvider(ctx => offsetShader.withArgs(
        ...ketArgs(ctx, span),
        WglArg.float("amount", Math.floor(ctx.time*(1<<span))))).
    setKnownEffectToTimeVaryingPermutation((t, i) => offsetPermutation(t, +1, span, i)));

CountingGates.UncountingFamily = Gate.buildFamily(1, 16, (span, builder) => builder.
    setAlternateFromFamily(CountingGates.CountingFamily).
    setSerializedId("Uncounting" + span).
    setSymbol("-⌈t⌉").
    setTitle("Down Counting Gate").
    setBlurb("Subtracts an increasing little-endian count from a block of qubits.").
    setDrawer(STAIRCASE_DRAWER(0, 1 << span, true)).
    setActualEffectToShaderProvider(ctx => offsetShader.withArgs(
        ...ketArgs(ctx, span),
        WglArg.float("amount", -Math.floor(ctx.time*(1<<span))))).
    setKnownEffectToTimeVaryingPermutation((t, i) => offsetPermutation(t, -1, span, i)));

CountingGates.RightShiftRotatingFamily = Gate.buildFamily(2, 16, (span, builder) => builder.
    setSerializedId(">>t" + span).
    setSymbol("↟⌈t⌉").
    setTitle("Right-Shift Cycling Gate").
    setBlurb("Right-rotates a block of bits by more and more.").
    setDrawer(STAIRCASE_DRAWER(0, span, true)).
    setActualEffectToShaderProvider(ctx => cycleBitsShader(ctx, span, -Math.floor(ctx.time*span))).
    setKnownEffectToTimeVaryingPermutation((t, i) => bitOffsetPermutation(t, -1, span, i)));

CountingGates.LeftShiftRotatingFamily = Gate.buildFamily(2, 16, (span, builder) => builder.
    setSerializedId("<<t" + span).
    setSymbol("↡⌈t⌉").
    setTitle("Left-Shift Cycling Gate").
    setBlurb("Left-rotates a block of bits by more and more.").
    setDrawer(STAIRCASE_DRAWER(0, span)).
    setActualEffectToShaderProvider(ctx => cycleBitsShader(ctx, span, Math.floor(ctx.time*span))).
    setKnownEffectToTimeVaryingPermutation((t, i) => bitOffsetPermutation(t, +1, span, i)));

CountingGates.all = [
    CountingGates.ClockPulseGate,
    CountingGates.QuarterPhaseClockPulseGate,
    ...CountingGates.CountingFamily.all,
    ...CountingGates.UncountingFamily.all,
    ...CountingGates.RightShiftRotatingFamily.all,
    ...CountingGates.LeftShiftRotatingFamily.all
];

export {CountingGates}
