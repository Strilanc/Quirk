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
import {MathPainter} from "../draw/MathPainter.js"
import {Point} from "../math/Point.js"
import {Rect} from "../math/Rect.js"
import {Util} from "../base/Util.js"
import {
    probabilityStatTexture,
    probabilityPixelsToColumnVector,
    probabilityDataToJson
} from "./ProbabilityDisplay.js"

/**
 * Looks up the simulated probability distribution and samples from it using the current graphics PRNG.
 * @param {!GateDrawParams} args
 * @returns {!{i: !number, p: !number}}
 */
function sampleFromDistribution(args) {
    let probabilities = args.customStats;
    let buf = probabilities.rawBuffer();
    let r = args.painter.rng.random();
    let n = probabilities.height();
    //noinspection ForLoopThatDoesntUseLoopVariableJS
    for (let i = 0; ; i++) {
        let p = buf[i*2];
        r -= p;
        if (i === n-1 || r < 0.00001) {
            return {i, p};
        }
    }
}

/**
 * @param {!GateDrawParams} args
 */
function _paintSampleDisplay_result(args) {
    let {painter, rect: {x, y, w, h}} = args;
    let d = Config.WIRE_SPACING;
    let startY = y + h/2 - d*args.gate.height/2;

    let {i: sample, p} = sampleFromDistribution(args);
    for (let i = 0; i < args.gate.height; i++) {
        let bit = ((sample >> i) & 1) !== 0;
        if (bit) {
            painter.fillRect(
                new Rect(x, startY+d*i+5, w, d-10),
                Config.OPERATION_FORE_COLOR);
        }
        painter.print(
            bit ? 'on' : 'off',
            x+w/2,
            startY+d*(i+0.5),
            'center',
            'middle',
            'black',
            '16px sans-serif',
            w,
            d);
    }

    for (let pt of args.focusPoints) {
        let k = Math.floor((pt.y - y) * 2 / d) /2;
        if (args.rect.containsPoint(pt)) {
            MathPainter.paintDeferredValueTooltip(
                painter,
                x + w,
                y + k * d,
                `Sampled |${Util.bin(sample, args.gate.height)}⟩`,
                `decimal: |${sample}⟩`,
                "chance: " + (p * 100).toFixed(4) + "%",
                Config.OPERATION_BACK_COLOR);
        }
    }
}

function paintSampleDisplay(args) {
    args.painter.fillRect(args.rect, Config.OPERATION_BACK_COLOR);

    let probabilities = args.customStats;
    let noData = probabilities === undefined || probabilities.hasNaN();
    if (noData) {
        args.painter.printParagraph("NaN", args.rect, new Point(0.5, 0.5), 'red');
    } else {
        _paintSampleDisplay_result(args);
    }

    args.painter.strokeRect(args.rect, 'lightgray');
}

let SampleDisplayFamily = Gate.buildFamily(1, 16, (span, builder) => builder.
    setSerializedId("Sample" + span).
    setSymbol("Sample").
    setTitle("Sampled Results Display").
    setBlurb("Shows a random sample of possible measurement outcomes.\nUse controls to see conditional samples.").
    setStatTexturesMaker(ctx =>
        probabilityStatTexture(ctx.stateTrader.currentTexture, ctx.controlsTexture, ctx.row, span)).
    setStatPixelDataPostProcessor(e => probabilityPixelsToColumnVector(e, span)).
    promiseHasNoNetEffectOnStateVectorButStillRequiresDynamicRedraw().
    setProcessedStatsToJsonFunc(probabilityDataToJson).
    setDrawer(GatePainting.makeDisplayDrawer(paintSampleDisplay)).
    setExtraDisableReasonFinder(args => args.isNested ? "can't\nnest\ndisplays\n(sorry)" : undefined));

export {SampleDisplayFamily}
