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

import {Complex} from "../math/Complex.js"
import {Config} from "../Config.js"
import {Gate} from "../circuit/Gate.js"
import {GatePainting} from "../draw/GatePainting.js"
import {GateShaders} from "../circuit/GateShaders.js"
import {MathPainter} from "../draw/MathPainter.js"
import {Matrix} from "../math/Matrix.js"
import {Point} from "../math/Point.js"
import {Rect} from "../math/Rect.js"
import {Seq} from "../base/Seq.js"
import {Shaders} from "../webgl/Shaders.js"
import {Util} from "../base/Util.js"
import {WglConfiguredShader} from "../webgl/WglConfiguredShader.js"
import {
    Inputs,
    Outputs,
    currentShaderCoder,
    makePseudoShaderWithInputsAndOutputAndCode
} from "../webgl/ShaderCoders.js"
import {WglTexturePool} from "../webgl/WglTexturePool.js"
import {WglTextureTrader} from "../webgl/WglTextureTrader.js"

/**
 * Derives conditional computational basis measurement probabilities from the state vector.
 *
 * @param {!WglTexture} ketTexture The texture storing the wavefunction.
 * @param {!WglTexture} controlTexture A precomputed texture storing a control mask set to 1 for satisfying states.
 * @param {!int} rangeOffset Which wire the probability display starts on.
 * @param {!int} rangeLength How many wires the probability display covers.
 * @returns {!WglTexture} Texture storing the probabilities. Not normalized.
 */
function probabilityStatTexture(ketTexture, controlTexture, rangeOffset, rangeLength) {
    let trader = new WglTextureTrader(ketTexture);
    trader.dontDeallocCurrentTexture();
    let n = currentShaderCoder().vec2.arrayPowerSizeOfTexture(ketTexture);

    trader.shadeAndTrade(tex => amplitudesToProbabilities(tex, controlTexture), WglTexturePool.takeVecFloatTex(n));
    trader.shadeAndTrade(tex => GateShaders.cycleAllBitsFloat(tex, -rangeOffset));

    while (n > rangeLength) {
        n -= 1;
        trader.shadeHalveAndTrade(Shaders.sumFoldFloat);
    }

    if (currentShaderCoder().float.needRearrangingToBeInVec4Format) {
        trader.shadeQuarterAndTrade(Shaders.packFloatIntoVec4);
    }
    return trader.currentTexture;
}

/**
 * @param {!WglTexture} inputTexture
 * @param {!WglTexture} controlTex
 * @returns {!WglConfiguredShader}
 */
let amplitudesToProbabilities = (inputTexture, controlTex) =>
    AMPLITUDES_TO_PROBABILITIES_SHADER(inputTexture, controlTex);
const AMPLITUDES_TO_PROBABILITIES_SHADER = makePseudoShaderWithInputsAndOutputAndCode(
    [
        Inputs.vec2('input'),
        Inputs.bool('control')
    ],
    Outputs.float(),
    `float outputFor(float k) {
        vec2 amp = read_input(k);
        return dot(amp, amp) * read_control(k);
    }`);

/**
 * Post-processes the pixels that come out of makeProbabilitySpanPipeline into a vector of normalized probabilities.
 * @param {!Float32Array} pixels
 * @param {!int} span
 * @returns {!Matrix}
 */
function probabilityPixelsToColumnVector(pixels, span) {
    let n = 1 << span;
    // CAUTION: pixels may be longer than n due to the length rounding up to a multiple of 4.

    let unity = 0;
    for (let i = 0; i < n; i++) {
        unity += pixels[i];
    }
    if (isNaN(unity) || unity < 0.000001) {
        return Matrix.zero(1, n).times(NaN);
    }
    let buf = new Float32Array(n*2);
    for (let i = 0; i < n; i++) {
        buf[i*2] = pixels[i] / unity;
    }
    return new Matrix(1, n, buf);
}

/**
 * Produces the exported simulator data associated with a probability display.
 * @param {!Matrix} data
 * @returns {!{probabilities: !float[]}}
 */
function probabilityDataToJson(data) {
    return {
        probabilities: Seq.range(data.height()).map(k => Complex.realPartOf(data.cell(0, k))).toArray()
    };
}

/**
 * @param {!GateDrawParams} args
 * @private
 */
function _paintMultiProbabilityDisplay_grid(args) {
    let {painter, rect: {x, y, w, h}} = args;
    let n = 1 << args.gate.height;
    let d = h / n;
    painter.fillRect(args.rect, Config.DISPLAY_GATE_BACK_COLOR);

    if (d < 1) {
        args.painter.ctx.save();
        args.painter.ctx.globalAlpha *= 0.2;
        painter.fillRect(args.rect, 'lightgray');
        args.painter.ctx.restore();
        return;
    }
    let r = args.gate.height - 5;
    painter.trace(tracer => {
        for (let i = 1; i < n; i++) {
            tracer.line(x, y + d * i, x + w, y + d * i);
        }
    }).thenStroke('lightgray', r <= 0 ? 1 : 1 / r);
    painter.strokeRect(args.rect, 'lightgray');
}

function _paintMultiProbabilityDisplay_probabilityBars(args) {
    let {painter, rect: {x, y, w, h}, customStats: probabilities} = args;
    let n = 1 << args.gate.height;
    let d = h / n;
    let e = Math.max(d, 1);

    painter.ctx.save();
    painter.ctx.beginPath();
    painter.ctx.moveTo(x, y);
    for (let i = 0; i < n; i++) {
        let p = probabilities.rawBuffer()[i * 2];
        let px = x + w * p;
        let py = y + d * i;
        painter.ctx.lineTo(px, py);
        painter.ctx.lineTo(px, py + e);
    }
    painter.ctx.lineTo(x, y + h);
    painter.ctx.lineTo(x, y);

    painter.ctx.strokeStyle = 'gray';
    painter.ctx.lineWidth = 1;
    painter.ctx.stroke();
    painter.ctx.fillStyle = Config.DISPLAY_GATE_FORE_COLOR;
    painter.ctx.fill();
    painter.ctx.restore();
}

function _paintMultiProbabilityDisplay_logarithmHints(args) {
    let {painter, rect: {x, y, w, h}, customStats: probabilities} = args;
    let n = 1 << args.gate.height;
    let d = h / n;
    let e = Math.max(d, 1);

    painter.ctx.save();
    painter.ctx.beginPath();
    painter.ctx.moveTo(x, y);
    let s = 1 / (4 + Math.max(8, args.gate.height));
    for (let i = 0; i < n; i++) {
        let p = probabilities.rawBuffer()[i * 2];
        let px = x + w * Math.min(1, Math.max(0, 1 + Math.log(p) * s));
        let py = y + d * i;
        painter.ctx.lineTo(px, py);
        painter.ctx.lineTo(px, py + e);
    }
    painter.ctx.lineTo(x, y + h);

    painter.ctx.lineWidth = 1;
    painter.ctx.strokeStyle = '#CCC';
    painter.ctx.stroke();
    painter.ctx.restore();
}

function _paintMultiProbabilityDisplay_tooltips(args) {
    let {painter, rect: {x, y, w, h}, customStats: probabilities} = args;
    let n = 1 << args.gate.height;
    let d = h / n;

    for (let pt of args.focusPoints) {
        let k = Math.floor((pt.y - y) / d);
        if (args.rect.containsPoint(pt) && k >= 0 && k < n) {
            let p = probabilities === undefined ? NaN : probabilities.rawBuffer()[k * 2];
            painter.strokeRect(new Rect(x, y + k * d, w, d), 'orange', 2);
            MathPainter.paintDeferredValueTooltip(
                painter,
                x + w,
                y + k * d,
                `Chance of |${Util.bin(k, args.gate.height)}⟩ (decimal ${k}) if measured`,
                'raw: ' + (p * 100).toFixed(4) + "%",
                'log: ' + (Math.log10(p) * 10).toFixed(1) + " dB");
        }
    }
}

function _paintMultiProbabilityDisplay_probabilityTexts(args) {
    let {painter, rect: {x, y, w, h}, customStats: probabilities} = args;
    let d = h / probabilities.height();

    for (let i = 0; i < probabilities.height(); i++) {
        let p = probabilities.rawBuffer()[i * 2];
        painter.print(
            (p * 100).toFixed(1) + "%",
            x + w - 2,
            y + d * (i + 0.5),
            'right',
            'middle',
            'black',
            '8pt monospace',
            w - 4,
            d);
    }
}

function paintMultiProbabilityDisplay(args) {
    _paintMultiProbabilityDisplay_grid(args);

    let probabilities = args.customStats;
    let noData = probabilities === undefined || probabilities.hasNaN();
    if (noData) {
        args.painter.printParagraph("NaN", args.rect, new Point(0.5, 0.5), 'red');
    } else {
        let textFits = args.rect.h / probabilities.height() > 8;
        if (!textFits) {
            _paintMultiProbabilityDisplay_logarithmHints(args);
        }
        _paintMultiProbabilityDisplay_probabilityBars(args);
        if (textFits) {
            _paintMultiProbabilityDisplay_probabilityTexts(args);
        }
    }

    _paintMultiProbabilityDisplay_tooltips(args);
}

/**
 * @param {!GateBuilder} builder
 * @returns {!GateBuilder}
 */
function shared_chanceGateMaker(builder) {
    return builder.
        setSymbol("Chance").
        setTitle("Probability Display").
        setBlurb("Shows chances of outcomes if a measurement was performed.\n" +
            "Use controls to see conditional probabilities.").
        promiseHasNoNetEffectOnStateVector().
        setExtraDisableReasonFinder(args => args.isNested ? "can't\nnest\ndisplays\n(sorry)" : undefined);
}

/**
 * @param {!GateBuilder} builder
 * @param {!int} span
 * @returns {!GateBuilder}
 */
function multiChanceGateMaker(span, builder) {
    return shared_chanceGateMaker(builder).
        setSerializedId("Chance" + span).
        setStatTexturesMaker(ctx =>
            probabilityStatTexture(ctx.stateTrader.currentTexture, ctx.controlsTexture, ctx.row, span)).
        setStatPixelDataPostProcessor(pixels => probabilityPixelsToColumnVector(pixels, span)).
        setProcessedStatsToJsonFunc(probabilityDataToJson).
        setDrawer(GatePainting.makeDisplayDrawer(paintMultiProbabilityDisplay));
}

/**
 * @param {!GateBuilder} builder
 * @returns {!GateBuilder}
 */
function singleChangeGateMaker(builder) {
    return shared_chanceGateMaker(builder).
        setSerializedId("Chance").
        markAsDrawerNeedsSingleQubitDensityStats().
        setDrawer(GatePainting.makeDisplayDrawer(args => {
            let {row, col} = args.positionInCircuit;
            MathPainter.paintProbabilityBox(
                args.painter,
                args.stats.controlledWireProbabilityJustAfter(row, col),
                args.rect,
                args.focusPoints);
        }));
}

let ProbabilityDisplayFamily = Gate.buildFamily(1, 16, (span, builder) =>
    span === 1 ?
        singleChangeGateMaker(builder) :
        multiChanceGateMaker(span, builder));

export {
    ProbabilityDisplayFamily,
    probabilityStatTexture,
    probabilityPixelsToColumnVector,
    amplitudesToProbabilities,
    probabilityDataToJson,
};
