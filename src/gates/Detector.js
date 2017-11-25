// Copyright 2017 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {GateBuilder} from 'src/circuit/Gate.js'
import {amplitudesToProbabilities} from 'src/gates/ProbabilityDisplay.js'
import {WglTexturePool} from 'src/webgl/WglTexturePool.js';
import {WglTextureTrader} from 'src/webgl/WglTextureTrader.js';
import {Shaders} from 'src/webgl/Shaders.js'
import {currentShaderCoder, Inputs} from 'src/webgl/ShaderCoders.js';
import {CircuitShaders} from 'src/circuit/CircuitShaders.js'
import {Controls} from 'src/circuit/Controls.js';
import {WglArg} from 'src/webgl/WglArg.js';
import {Config} from 'src/Config.js'
import {GatePainting} from 'src/draw/GatePainting.js'
import {makePseudoShaderWithInputsAndOutputAndCode, Outputs} from 'src/webgl/ShaderCoders.js';

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
            return read_ket(k) * float(detection_type == own_type);
        }
    `);

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
 */
function drawDetector(args) {
    // Draw framing.
    if (args.isHighlighted || args.isInToolbox) {
        args.painter.fillRect(
            args.rect,
            args.isHighlighted ? Config.HIGHLIGHTED_GATE_FILL_COLOR : Config.TIME_DEPENDENT_HIGHLIGHT_COLOR);
        GatePainting.paintOutline(args);
    }

    // Draw semi-circle wedge.
    const τ = Math.PI * 2;
    let r = args.rect.w*0.4;
    let {x, y} = args.rect.center();
    x -= r*0.5;
    x += 0.5;
    y += 0.5;
    args.painter.trace(trace => {
        trace.ctx.arc(x, y, r, τ*3/4, τ/4);
        trace.ctx.lineTo(x, y - r - 1);
    }).thenStroke('black', 2).thenFill(Config.TIME_DEPENDENT_HIGHLIGHT_COLOR);

    // Draw tilted "*click*" text.
    let clicked = args.customStats;
    if (clicked) {
        args.painter.ctx.save();
        args.painter.ctx.translate(args.rect.center().x, args.rect.center().y);
        args.painter.ctx.rotate(τ/8);
        args.painter.ctx.strokeStyle = 'white';
        args.painter.ctx.lineWidth = 2;
        args.painter.print(
            '*click*',
            0,
            0,
            'center',
            'middle',
            'black',
            'bold 16px sans-serif',
            args.rect.w*1.4,
            args.rect.h*1.4,
            undefined,
            true);
        args.painter.ctx.restore();
    }
}

let Detector = new GateBuilder().
    setSerializedIdAndSymbol('Detector').
    setTitle('Detector').
    setBlurb('Makes a *click* when the target qubit is ON and all controls are satisfied.\n' +
             'Measures whether to click, samples the result, then post-selects on it.').
    setDrawer(drawDetector).
    promiseEffectIsDiagonal().
    markAsReachingOtherWires().
    setActualEffectToUpdateFunc(sampleMeasure).
    setStatTexturesMaker(detectorStatTexture).
    setStatPixelDataPostProcessor((pixels, circuit, row, col) => pixels[0] > 0).
    gate;

export {Detector}
