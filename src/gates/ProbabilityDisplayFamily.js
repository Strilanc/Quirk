import Config from "src/Config.js"
import DisplayShaders from "src/circuit/DisplayShaders.js"
import Gate from "src/circuit/Gate.js"
import GatePainting from "src/ui/GatePainting.js"
import GateShaders from "src/circuit/GateShaders.js"
import MathPainter from "src/ui/MathPainter.js"
import Matrix from "src/math/Matrix.js"
import Point from "src/math/Point.js"
import Rect from "src/math/Rect.js"
import {seq, Seq} from "src/base/Seq.js"
import ShaderPipeline from "src/circuit/ShaderPipeline.js"
import Shaders from "src/webgl/Shaders.js"
import Util from "src/base/Util.js"

/**
 * @param {!WglTexture} controlTexture
 * @param {!int} rangeOffset
 * @param {!int} rangeLength
 * @returns {!ShaderPipeline} Computes the marginal probabilities for a range of qubits from a superposition texture.
 */
function makeProbabilitySpanPipeline(controlTexture, rangeOffset, rangeLength) {
    let [w, h] = [controlTexture.width, controlTexture.height];
    let result = new ShaderPipeline();

    result.addSizedStep(w, h, t => DisplayShaders.amplitudesToProbabilities(t, controlTexture));
    result.addSizedStep(w, h, t => GateShaders.cycleAllBits(t, -rangeOffset));

    let remainingQubitCount = Math.round(Math.log2(w*h));
    while (remainingQubitCount > rangeLength) {
        if (h > 1) {
            h >>= 1;
            result.addSizedStep(w, h, (h=>t=>Shaders.sumFold(t, 0, h))(h));
        } else {
            w >>= 1;
            result.addSizedStep(w, h, (w=>t=>Shaders.sumFold(t, w, 0))(w));
        }
        remainingQubitCount -= 1;
    }

    return result;
}

/**
 * Post-processes the pixels that come out of makeProbabilitySpanPipeline into a vector of normalized probabilities.
 * @param {!Float32Array} pixels
 * @returns {!Matrix}
 */
function probabilityPixelsToColumnVector(pixels) {
    let unity = 0;
    for (let e of pixels) {
        unity += e;
    }
    if (isNaN(unity) || unity < 0.000001) {
        return Matrix.zero(1, pixels.length >> 2).times(NaN);
    }
    let ps = new Float32Array(pixels.length >> 1);
    for (let i = 0; i < ps.length; i++) {
        ps[i*2] = pixels[i*4]/unity;
    }
    return new Matrix(1, pixels.length >> 2, ps);
}

function _paintMultiProbabilityDisplay_grid(args) {
    let {painter, rect: {x, y, w, h}} = args;
    let n = 1 << args.gate.height;
    let d = h/n;
    painter.fillRect(args.rect, Config.DISPLAY_GATE_BACK_COLOR);
    painter.trace(tracer => {
        for (let i = 1; i < n; i++) {
            tracer.line(x, y + d*i, x+w, y+d*i);
        }
    }).thenStroke('lightgray');
    painter.strokeRect(args.rect, 'lightgray');
}

function _paintMultiProbabilityDisplay_probabilityBars(args) {
    let {painter, rect: {x, y, w, h}, customStats: probabilities} = args;
    let n = 1 << args.gate.height;
    let d = h/n;

    painter.ctx.beginPath();
    painter.ctx.moveTo(x, y);
    for (let i = 0; i < n; i++) {
        let p = probabilities.rawBuffer()[i*2];
        let px = x + w*p;
        let py = y + d*i;
        painter.ctx.lineTo(px, py);
        painter.ctx.lineTo(px, py+d);
    }
    painter.ctx.lineTo(x, y+h);
    painter.ctx.lineTo(x, y);

    painter.ctx.strokeStyle = 'gray';
    painter.ctx.stroke();
    painter.ctx.fillStyle = Config.DISPLAY_GATE_FORE_COLOR;
    painter.ctx.fill();
}

function _paintMultiProbabilityDisplay_logarithmHints(args) {
    let {painter, rect: {x, y, w, h}, customStats: probabilities} = args;
    let n = 1 << args.gate.height;
    let d = h/n;

    painter.ctx.beginPath();
    painter.ctx.moveTo(x, y);
    for (let i = 0; i < n; i++) {
        let p = probabilities.rawBuffer()[i * 2];
        let px = x + w * Math.min(1, Math.max(0, 1 + Math.log(p) / 12));
        let py = y + d * i;
        painter.ctx.lineTo(px, py);
        painter.ctx.lineTo(px, py + d);
    }
    painter.ctx.lineTo(x, y + h);

    painter.ctx.strokeStyle = '#CCC';
    painter.ctx.stroke();
}

function _paintMultiProbabilityDisplay_tooltips(args) {
    let {painter, rect: {x, y, w, h}, customStats: probabilities} = args;
    let n = 1 << args.gate.height;
    let d = h/n;

    for (let pt of args.focusPoints) {
        let k = Math.floor((pt.y - y) / d);
        if (args.rect.containsPoint(pt) && k >= 0 && k < n) {
            let p = probabilities === undefined ? NaN : probabilities.rawBuffer()[k*2];
            painter.strokeRect(new Rect(x, y + k*d, w, d), 'orange', 2);
            MathPainter.paintDeferredValueTooltip(
                painter,
                x + w,
                y + k*d,
                `Chance of |${Util.bin(k, args.gate.height)}⟩ if measured`,
                'raw: ' + (p*100).toFixed(4) + "%",
                'log: ' + (Math.log10(p)*10).toFixed(1) + " dB");
        }
    }
}

function _paintMultiProbabilityDisplay_probabilityTexts(args) {
    let {painter, rect: {x, y, w, h}, customStats: probabilities} = args;
    let d = h/probabilities.height();

    for (let i = 0; i < probabilities.height(); i++) {
        let p = probabilities.rawBuffer()[i*2];
        painter.print(
            (p*100).toFixed(1) + "%",
            x+w-2,
            y+d*(i+0.5),
            'right',
            'middle',
            'black',
            '8pt monospace',
            w-4,
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
        let textFits = args.rect.h/probabilities.height() > 8;
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

function multiChanceGateMaker(span) {
    return new Gate(
        "Chance",
        Matrix.identity(1 << span),
        "Probability Display",
        "Shows chances of outcomes if a measurement was performed.\nUse controls to see conditional probabilities.").
        withHeight(span).
        withSerializedId("Chance" + span).
        withCustomStatPipelineMaker((val, con, bit) => makeProbabilitySpanPipeline(con, bit, span)).
        withCustomStatPostProcessor(probabilityPixelsToColumnVector).
        withCustomDrawer(GatePainting.makeDisplayDrawer(paintMultiProbabilityDisplay));
}

let SingleChanceGate = new Gate(
    "Chance",
    Matrix.identity(2),
    "Probability Display",
    "Shows the chance that measuring a wire would return ON.\nUse controls to see conditional probabilities.").
    withCustomDrawer(GatePainting.makeDisplayDrawer(args => {
        let {row, col} = args.positionInCircuit;
        MathPainter.paintProbabilityBox(
            args.painter,
            args.stats.controlledWireProbabilityJustAfter(row, col),
            args.rect,
            args.focusPoints);
    }));

let ProbabilityDisplayFamily = Gate.generateFamily(1, 8, span =>
    span === 1 ? SingleChanceGate : multiChanceGateMaker(span));
export default ProbabilityDisplayFamily;
export { makeProbabilitySpanPipeline, probabilityPixelsToColumnVector };
