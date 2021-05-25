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

import {GateBuilder} from "../circuit/Gate.js"
import {amplitudesToProbabilities} from "../gates/ProbabilityDisplay.js"
import {WglTexturePool} from "../webgl/WglTexturePool.js";
import {WglTextureTrader} from "../webgl/WglTextureTrader.js";
import {Shaders} from "../webgl/Shaders.js"
import {currentShaderCoder, Inputs} from "../webgl/ShaderCoders.js";
import {CircuitShaders} from "../circuit/CircuitShaders.js"
import {Controls} from "../circuit/Controls.js";
import {WglArg} from "../webgl/WglArg.js";
import {Config} from "../Config.js"
import {GatePainting} from "../draw/GatePainting.js"
import {makePseudoShaderWithInputsAndOutputAndCode, Outputs} from "../webgl/ShaderCoders.js";
import {Matrix} from "../math/Matrix.js";
import {GateShaders} from "../circuit/GateShaders.js";
import {Point} from "../math/Point.js";
import {DetailedError} from "../base/DetailedError.js";
import {QuarterTurnGates} from "./QuarterTurnGates.js";
import {HalfTurnGates} from "./HalfTurnGates.js";

/**
 * @param {!CircuitEvalContext} ctx
 * @param {!Controls} controls
 * @returns {!WglTexture}
 */
function controlMaskTex(ctx, controls) {
    let powerSize = currentShaderCoder().vec2.arrayPowerSizeOfTexture(ctx.stateTrader.currentTexture);
    return CircuitShaders.controlMask(controls).toBoolTexture(powerSize);
}

/**
 * Prepares a 1x1 texture containing the total squared-magnitude of states matching the given controls.
 * @param {!WglTexture} ketTexture
 * @param {!WglTexture} controlMaskTex
 * @param {!boolean} forStats
 * @returns {!WglTexture}
 */
function textureWithTotalWeightMatchingGivenControls(ketTexture, controlMaskTex, forStats=false) {
    let powerSize = currentShaderCoder().vec2.arrayPowerSizeOfTexture(ketTexture);

    // Convert the matching amplitudes to probabilities (and the non-matching ones to 0).
    let trader = new WglTextureTrader(ketTexture);
    trader.dontDeallocCurrentTexture();
    trader.shadeAndTrade(
        tex => amplitudesToProbabilities(tex, controlMaskTex),
        WglTexturePool.takeVecFloatTex(powerSize));

    // Sum the probabilities.
    let n = currentShaderCoder().vec2.arrayPowerSizeOfTexture(ketTexture);
    while (n > 0) {
        n -= 1;
        trader.shadeHalveAndTrade(Shaders.sumFoldFloat);
    }

    trader.shadeAndTrade(Shaders.packFloatIntoVec4, WglTexturePool.takeVec4Tex(0));
    return trader.currentTexture;
}

/**
 * @param {!CircuitEvalContext} ctx
 * @returns {!WglTexture}
 */
function detectorStatTexture(ctx) {
    let mask = controlMaskTex(ctx, ctx.controls.and(Controls.bit(ctx.row, true)));
    try {
        return textureWithTotalWeightMatchingGivenControls(ctx.stateTrader.currentTexture, mask, true);
    } finally {
        mask.deallocByDepositingInPool('textureWithTotalWeightMatchingPositiveMeasurement:mask')
    }
}

/**
 * Discards states that don't meet the detection result.
 */
let detectorShader = makePseudoShaderWithInputsAndOutputAndCode(
    [
        Inputs.float('total_weight'),
        Inputs.float('detection_weight'),
        Inputs.bool('classification'),
        Inputs.vec2('ket'),
    ],
    Outputs.vec2(),
    `
        uniform float rnd;
    
        vec2 outputFor(float k) {
            float detectChance = read_detection_weight(0.0) / read_total_weight(0.0);
            float detection_type = float(rnd < detectChance);
            float own_type = read_classification(k);
            if (detection_type == own_type) {
                float matchChance = detectChance * own_type + (1.0 - own_type) * (1.0 - detectChance);
                return read_ket(k) / sqrt(matchChance);
            } else {
                return vec2(0.0, 0.0);
            }
        }
    `);

/**
 * @param {!CircuitEvalContext} ctx
 * @param {!string} axis
 * @param {!boolean} inverse
 */
function switchToBasis(ctx, axis, inverse) {
    switch (axis) {
        case 'X':
            GateShaders.applyMatrixOperation(ctx, HalfTurnGates.H.knownMatrixAt(0));
            break;
        case 'Y':
            if (inverse) {
                GateShaders.applyMatrixOperation(ctx, QuarterTurnGates.SqrtXBackward.knownMatrixAt(0));
            } else {
                GateShaders.applyMatrixOperation(ctx, QuarterTurnGates.SqrtXForward.knownMatrixAt(0));
            }
            break;
        case 'Z':
            break; // Already in the right basis.
        default:
            throw new DetailedError('Unrecognized axis.', {axis});
    }

}
/**
 * Applies a sample measurement operation to the state.
 * @param {!CircuitEvalContext} ctx
 */
function sampleMeasure(ctx) {
    let maskAll = controlMaskTex(ctx, Controls.NONE);
    let maskMatch = controlMaskTex(ctx, ctx.controls.and(Controls.bit(ctx.row, true)));
    let weightAll = textureWithTotalWeightMatchingGivenControls(ctx.stateTrader.currentTexture, maskAll);
    let weightMatch = textureWithTotalWeightMatchingGivenControls(ctx.stateTrader.currentTexture, maskMatch);

    ctx.applyOperation(detectorShader(
        weightAll,
        weightMatch,
        maskMatch,
        ctx.stateTrader.currentTexture,
        WglArg.float('rnd', Math.random())));

    weightMatch.deallocByDepositingInPool();
    weightAll.deallocByDepositingInPool();
    maskMatch.deallocByDepositingInPool();
    maskAll.deallocByDepositingInPool();
}

/**
 * @param {!GateDrawParams} args
 * @param {!string} axis
 */
function drawDetector(args, axis) {
    drawHighlight(args);
    drawWedge(args, axis);
    drawClick(args, axis);
}

/**
 * @param {!GateDrawParams} args
 */
function drawHighlight(args) {
    // Can't use the typical highlight function because the detector has no box outline.
    if (args.isHighlighted || args.isInToolbox) {
        args.painter.fillRect(
            args.rect,
            args.isHighlighted ? Config.HIGHLIGHTED_GATE_FILL_COLOR : Config.GATE_FILL_COLOR);
        GatePainting.paintOutline(args);
    }
}

/**
 * @param {!GateDrawParams} args
 * @param {!string} axis
 */
function drawWedge(args, axis) {
    // Draw semi-circle wedge.
    const τ = Math.PI * 2;
    let r = Math.min(args.rect.h / 2, args.rect.w) - 1;
    let {x, y} = args.rect.center();
    x -= r*0.5;
    x += 0.5;
    y += 0.5;
    args.painter.trace(trace => {
        trace.ctx.arc(x, y, r, τ*3/4, τ/4);
        trace.ctx.lineTo(x, y - r - 1);
    }).thenStroke('black', 2).thenFill(Config.TIME_DEPENDENT_HIGHLIGHT_COLOR);
    args.painter.printLine(axis, args.rect, 0.5, undefined, undefined, undefined, 0.5);
}

/**
 * @param {!GateDrawParams} args
 * @param {undefined|!string} axis
 */
function drawClick(args, axis) {
    // Draw tilted "*click*" text.
    let clicked = args.customStats;
    if (!clicked) {
        return;
}
    let r = Math.min(args.rect.h / 2, args.rect.w);
    args.painter.ctx.save();
    args.painter.ctx.translate(args.rect.center().x, args.rect.center().y);
    args.painter.ctx.rotate(axis === undefined ? Math.PI/3 : Math.PI/4);
    args.painter.ctx.strokeStyle = 'white';
    args.painter.ctx.lineWidth = 3;
    args.painter.print(
        '*click*',
        0,
        axis === undefined ? 0 : -5,
        'center',
        'middle',
        'black',
        'bold 16px sans-serif',
        r*2.8,
        r*2.8,
        undefined,
        true);

    if (axis !== undefined) {
        args.painter.print(
            axis,
            0,
            10,
            'center',
            'middle',
            'black',
            'bold 16px sans-serif',
            r * 2.8,
            r * 2.8,
            undefined,
            true);
    }
    args.painter.ctx.restore();
}

/**
 * @param {!GateDrawParams} args
 * @param {!string} axis
 */
function drawControlBulb(args, axis) {
    redrawControlWires(args);
    let p = args.rect.center();
    switch (axis) {
        case 'X':
            args.painter.fillCircle(p, 5);
            args.painter.strokeCircle(p, 5);
            args.painter.strokeLine(p.offsetBy(0, -5), p.offsetBy(0, +5));
            args.painter.strokeLine(p.offsetBy(-5, 0), p.offsetBy(+5, 0));
            break;
        case 'Y':
            args.painter.fillCircle(p, 5);
            args.painter.strokeCircle(p, 5);
            let r = 5*Math.sqrt(0.5)*1.1;
            args.painter.strokeLine(p.offsetBy(+r, -r), p.offsetBy(-r, +r));
            args.painter.strokeLine(p.offsetBy(-r, -r), p.offsetBy(+r, +r));
            break;
        case 'Z':
            args.painter.fillCircle(p, 5, "black");
            break;
        default:
            throw new DetailedError('Unrecognized axis.', {axis});
    }
}

/**
 * @param {!GateDrawParams} args
 * @param {!string} axis
 */
function drawDetectClearReset(args, axis) {
    let fullRect = args.rect;
    let detectorRect = fullRect.leftHalf();
    let resetRect = fullRect.rightHalf();

    // Draw background.
    let clearWireRect = fullRect.rightHalf();
    clearWireRect.y += clearWireRect.h / 2 - 2;
    clearWireRect.h = 5;
    args.painter.fillRect(clearWireRect, 'white');
    drawHighlight(args);

    // Draw text elements.
    args.painter.printLine('|0⟩', resetRect, 1, undefined, undefined, undefined, 0.5);

    // Draw detector.
    args.rect = detectorRect;
    drawWedge(args, axis);

    args.rect = fullRect;
    drawControlBulb(args, axis);
    args.rect = detectorRect;
    drawClick(args, undefined);

    args.rect = fullRect;
}

/**
 * @param {!GateDrawParams} args
 */
function redrawControlWires(args) {
    if (args.positionInCircuit === undefined || args.isHighlighted) {
        return;
    }
    let painter = args.painter;
    let columnIndex = args.positionInCircuit.col;
    let x = Math.round(args.rect.center().x - 0.5) + 0.5;

    // Dashed line indicates effects from non-unitary gates may affect, or appear to affect, other wires.
    let circuit = args.stats.circuitDefinition;
    if (circuit.columns[columnIndex].hasGatesWithGlobalEffects()) {
        painter.ctx.save();
        painter.ctx.setLineDash([1, 4]);
        painter.strokeLine(new Point(x, args.rect.y), new Point(x, args.rect.bottom()));
        painter.ctx.restore();
    }

    let row = args.positionInCircuit.row;
    for (let {first, last, measured} of circuit.controlLinesRanges(columnIndex)) {
        if (first <= row && row <= last) {
            let y1 = first === row ? args.rect.center().y : args.rect.y;
            let y2 = last === row ? args.rect.center().y : args.rect.bottom();
            if (measured) {
                painter.strokeLine(new Point(x + 1, y1), new Point(x + 1, y2));
                painter.strokeLine(new Point(x - 1, y1), new Point(x - 1, y2));
            } else {
                painter.strokeLine(new Point(x, y1), new Point(x, y2));
            }
        }
    }
}

/**
 * @param {!function(!CircuitEvalContext) : T} func
 * @returns {!function(!CircuitEvalContext) : T}
 * @template T
 */
function withClearedControls(func) {
    return ctx => {
        let controls = ctx.controls;
        let texture = ctx.controlsTexture;
        try {
            ctx.controls = Controls.NONE;
            ctx.controlsTexture = controlMaskTex(ctx, ctx.controls);
            return func(ctx);
        } finally {
            ctx.controlsTexture.deallocByDepositingInPool('withClearedControls');
            ctx.controlsTexture = texture;
            ctx.controls = controls;
        }
    };
}

/**
 * @param {!string} axis
 * @returns {!Gate}
 */
function makeDetectControlClearGate(axis) {
    let builder = new GateBuilder().
        setSerializedIdAndSymbol(`${axis}DetectControlReset`).
        setTitle(`${axis} Detect-Control-Reset`).
        setBlurb(`Does a sampled ${axis}-axis measurement.\nControls operations with the result.\nResets the target to |0⟩.`).
        setDrawer(args => drawDetectClearReset(args, axis)).
        markAsControlExpecting(true, true).
        markAsReachingOtherWires().
        setActualEffectToUpdateFunc(() => {}).
        setStatTexturesMaker(withClearedControls(detectorStatTexture)).
        setSetupCleanupEffectToUpdateFunc(
            withClearedControls(ctx => {
                switchToBasis(ctx, axis, false);
                sampleMeasure(ctx);
            }),
            withClearedControls(ctx => {
                GateShaders.applyMatrixOperation(ctx, Matrix.square(1, 1, 0, 0));
            })).
        setStatPixelDataPostProcessor((pixels, circuit, row, col) => pixels[0] > 0);
    if (axis === 'Z') {
        builder.promiseEffectIsDiagonal();
    }
    return builder.gate;
}

/**
 * @param {!string} axis
 * @returns {!Gate}
 */
function makeDetector(axis) {
    let state = new Map([
        ['X', '|0⟩-|1⟩'],
        ['Y', '|0⟩-i|1⟩'],
        ['Z', '|1⟩'],
    ]).get(axis);
    let builder = new GateBuilder().
        setSerializedIdAndSymbol(`${axis}Detector`).
        setTitle(`${axis} Axis Detector`).
        setBlurb(
            `Sampled ${axis}-axis measurement.\n` +
            `Shows *click* when the target qubit is ${state} and controls are satisfied.`).
        setDrawer(args => drawDetector(args, axis)).
        markAsReachingOtherWires().
        setSetupCleanupEffectToUpdateFunc(
            ctx => switchToBasis(ctx, axis, false),
            ctx => switchToBasis(ctx, axis, true)).
        setActualEffectToUpdateFunc(sampleMeasure).
        setStatTexturesMaker(detectorStatTexture).
        setStatPixelDataPostProcessor((pixels, circuit, row, col) => pixels[0] > 0);
    if (axis === 'Z') {
        builder.promiseEffectIsDiagonal();
    }
    return builder.gate;
}

let Detectors = {};

Detectors.XDetector = makeDetector('X');
Detectors.YDetector = makeDetector('Y');
Detectors.ZDetector = makeDetector('Z');

Detectors.XDetectControlClear = makeDetectControlClearGate('X');
Detectors.YDetectControlClear = makeDetectControlClearGate('Y');
Detectors.ZDetectControlClear = makeDetectControlClearGate('Z');

Detectors.all = [
    Detectors.XDetector,
    Detectors.YDetector,
    Detectors.ZDetector,
    Detectors.XDetectControlClear,
    Detectors.YDetectControlClear,
    Detectors.ZDetectControlClear,
];

export {Detectors}
