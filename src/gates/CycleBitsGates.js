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
import {Gate} from "../circuit/Gate.js"
import {GatePainting} from "../draw/GatePainting.js"
import {ketArgs, ketShaderPermute} from "../circuit/KetShaderUtil.js"
import {Matrix} from "../math/Matrix.js"
import {Point} from "../math/Point.js"
import {Util} from "../base/Util.js"
import {WglArg} from "../webgl/WglArg.js"
import {WglConfiguredShader} from "../webgl/WglConfiguredShader.js"

let CycleBitsGates = {};

/**
 * @param {!CircuitEvalContext} ctx
 * @param {!int} qubitSpan
 * @param {!int} shiftAmount
 * @returns {!WglConfiguredShader}
 */
let cycleBitsShader = (ctx, qubitSpan, shiftAmount) =>
    CYCLE_SHADER.withArgs(
        ...ketArgs(ctx, qubitSpan),
        WglArg.float("amount", 1 << Util.properMod(-shiftAmount, qubitSpan)));
const CYCLE_SHADER = ketShaderPermute(
    'uniform float amount;',
    'out_id *= amount; return mod(out_id, span) + floor(out_id / span);');

const makeCycleBitsPermutation = (shift, span) => e => {
    shift = Util.properMod(shift, span);
    return ((e << shift) & ((1 << span) - 1)) | (e >> (span - shift));
};
const makeCycleBitsMatrix = (shift, span) => Matrix.generateTransition(1<<span, makeCycleBitsPermutation(shift, span));

let cyclePainter = reverse => args => {
    if (args.positionInCircuit !== undefined) {
        GatePainting.PERMUTATION_DRAWER(args);
        return;
    }

    GatePainting.paintBackground(args);
    GatePainting.paintOutline(args);
    GatePainting.paintResizeTab(args);

    let x1 = args.rect.x + 6;
    let x2 = args.rect.right() - 6;
    let y = args.rect.center().y - Config.GATE_RADIUS + 6;
    let dh = (Config.GATE_RADIUS - 6)*2 / 2;

    for (let i = 0; i < 3; i++) {
        let j = (i + (reverse ? 2 : 1)) % 3;
        let y1 = y + i*dh;
        let y2 = y + j*dh;
        args.painter.strokePath([
            new Point(x1, y1),
            new Point(x1 + 8, y1),
            new Point(x2 - 8, y2),
            new Point(x2, y2)
        ]);
    }
};

CycleBitsGates.CycleBitsFamily = Gate.buildFamily(2, 16, (span, builder) => builder.
    setSerializedId("<<" + span).
    setSymbol("<<<").
    setTitle("Left Rotate").
    setBlurb("Rotates bits downward.").
    setDrawer(cyclePainter(false)).
    setTooltipMatrixFunc(() => makeCycleBitsMatrix(1, span)).
    setActualEffectToShaderProvider(ctx => cycleBitsShader(ctx, span, +1)).
    setKnownEffectToBitPermutation(i => (i + 1) % span));

CycleBitsGates.ReverseCycleBitsFamily = Gate.buildFamily(2, 16, (span, builder) => builder.
    setAlternateFromFamily(CycleBitsGates.CycleBitsFamily).
    setSerializedId(">>" + span).
    setSymbol(">>>").
    setTitle("Right Rotate").
    setBlurb("Rotates bits upward.").
    setDrawer(cyclePainter(true)).
    setTooltipMatrixFunc(() => makeCycleBitsMatrix(-1, span)).
    setActualEffectToShaderProvider(ctx => cycleBitsShader(ctx, span, -1)).
    setKnownEffectToBitPermutation(i => (i + span - 1) % span));

CycleBitsGates.all = [
    ...CycleBitsGates.CycleBitsFamily.all,
    ...CycleBitsGates.ReverseCycleBitsFamily.all
];

export {CycleBitsGates, cycleBitsShader, makeCycleBitsPermutation};
