import Config from "src/Config.js"
import CircuitShaders from "src/circuit/CircuitShaders.js"
import CircuitTextures from "src/circuit/CircuitTextures.js"
import DetailedError from "src/base/DetailedError.js"
import DisplayShaders from "src/circuit/DisplayShaders.js"
import Gate from "src/circuit/Gate.js"
import GatePainting from "src/ui/GatePainting.js"
import GateShaders from "src/circuit/GateShaders.js"
import Format from "src/base/Format.js"
import MathPainter from "src/ui/MathPainter.js"
import Matrix from "src/math/Matrix.js"
import Point from "src/math/Point.js"
import Rect from "src/math/Rect.js"
import {seq, Seq} from "src/base/Seq.js"
import ShaderPipeline from "src/circuit/ShaderPipeline.js"
import Shaders from "src/webgl/Shaders.js"
import Util from "src/base/Util.js"
import WglArg from "src/webgl/WglArg.js"
import WglShader from "src/webgl/WglShader.js"
import { WglConfiguredShader } from "src/webgl/WglShader.js"

/**
 * @param {!WglTexture} valueTexture
 * @param {!Controls} controls
 * @param {!int} rangeOffset
 * @param {!int} rangeLength
 * @returns {!ShaderPipeline}
 */
function makeAmplitudeSpanPipeline(valueTexture, controls, rangeOffset, rangeLength) {
    let [w, h] = [valueTexture.width, valueTexture.height];
    let result = new ShaderPipeline();

    let lostQubits = Util.numberOfSetBits(controls.inclusionMask);
    let totalQubits = Math.round(Math.log2(w * h)) - lostQubits;
    result.addPowerSizedStep(totalQubits, t => CircuitShaders.controlSelect(controls, t));

    let lostHeadQubits = Util.numberOfSetBits(controls.inclusionMask & ((1<<rangeOffset)-1));

    let cycledTex = CircuitTextures.allocQubitTexture(totalQubits);
    result.addPowerSizedStep(totalQubits, inp => new WglConfiguredShader(dst => {
        GateShaders.cycleAllBits(inp, lostHeadQubits-rangeOffset).renderTo(dst);
        Shaders.passthrough(dst).renderTo(cycledTex);
    }));
    result.addPowerSizedStep(totalQubits, amplitudesToPolarKets);
    result.addPipelineSteps(pipelineToSpreadLengthAcrossPolarKets(rangeLength, totalQubits));
    result.addPipelineSteps(pipelineToAggregateRepresentativePolarKet(rangeLength, totalQubits));
    result.addPowerSizedStep(rangeLength, convertAwayFromPolar, true);

    result.addPowerSizedStep(totalQubits, inp => new WglConfiguredShader(dst => {
        toRatiosVsRepresentative(cycledTex)(inp).renderTo(dst);
        CircuitTextures.doneWithTexture(cycledTex);
    }));
    result.addPipelineSteps(pipelineToFoldConsistentRatios(rangeLength, totalQubits));

    let r = totalQubits - rangeLength;
    result.addPipelineSteps(pipelineToSumAll(1 << Math.ceil(r/2), 1 << Math.floor(r/2)));

    return result;
}

/**
 * @param {!Float32Array} ketPixels
 * @param {!Float32Array} consistentPixel
 * @returns {!{probabilities: undefined|!Float32Array, superposition: undefined|!Matrix}}
 */
function processOutputs([ketPixels, consistentPixel]) {
    let n = ketPixels.length >> 2;
    let w = n === 2 ? 2 : 1 << Math.floor(Math.round(Math.log2(n))/2);
    let h = n/w;
    let isPure = !isNaN(consistentPixel[0]);
    let unity = ketPixels[2];

    if (!isPure) {
        let pbuf = new Float32Array(n*2);
        for (let k = 0; k < n; k++) {
            let r = ketPixels[k*4];
            let i = ketPixels[k*4+1];
            pbuf[k*2] = Math.sqrt((r*r + i*i)/unity);
        }
        return {probabilities: new Matrix(w, h, pbuf), superposition: undefined};
    }

    let buf = new Float32Array(n*2);
    let sqrtUnity = Math.sqrt(unity);
    for (let i = 0; i < n; i++) {
        buf[i*2] = ketPixels[i*4]/sqrtUnity;
        buf[i*2+1] = ketPixels[i*4+1]/sqrtUnity;
    }
    return {probabilities: undefined, superposition: new Matrix(w, h, buf)};
}

/**
 * @param {!WglTexture} input
 * @returns {!WglConfiguredShader}
 */
function amplitudesToPolarKets(input) {
    return new WglConfiguredShader(dst => AMPLITUDES_TO_POLAR_KETS_SHADER.withArgs(
        WglArg.vec2('inputSize', input.width, input.height),
        WglArg.float('outputWidth', dst.width),
        WglArg.texture('inputTexture', input, 0)
    ).renderTo(dst));
}
const AMPLITUDES_TO_POLAR_KETS_SHADER = new WglShader(`
    uniform float outputWidth;
    uniform vec2 inputSize;
    uniform sampler2D inputTexture;

    vec2 toUv(float state) {
        return vec2(mod(state, inputSize.x) + 0.5, floor(state / inputSize.x) + 0.5) / inputSize;
    }

    void main() {
        vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
        float state = xy.y * outputWidth + xy.x;
        vec2 ri = texture2D(inputTexture, toUv(state)).xy;
        float mag = dot(ri, ri);
        float phase = atan(ri.y, ri.x);
        gl_FragColor = vec4(mag, phase, mag, 0.0);
    }`);

/**
 * @param {!int} includedQubitCount
 * @param {!int} totalQubitCount
 * @returns {!ShaderPipeline}
 */
function pipelineToSpreadLengthAcrossPolarKets(includedQubitCount, totalQubitCount) {
    let result = new ShaderPipeline();
    for (let bit = 0; bit < includedQubitCount; bit++) {
        result.addPowerSizedStep(
            totalQubitCount,
            inp => new WglConfiguredShader(dst => SPREAD_LENGTH_ACROSS_POLAR_KETS_SHADER.withArgs(
                WglArg.vec2('inputSize', inp.width, inp.height),
                WglArg.float('outputWidth', dst.width),
                WglArg.texture('inputTexture', inp, 0),
                WglArg.float('bit', 1 << bit)
            ).renderTo(dst)));
    }
    return result;
}
const SPREAD_LENGTH_ACROSS_POLAR_KETS_SHADER = new WglShader(`
    uniform float outputWidth;
    uniform vec2 inputSize;
    uniform sampler2D inputTexture;
    uniform float bit;

    vec2 toUv(float state) {
        return vec2(mod(state, inputSize.x) + 0.5, floor(state / inputSize.x) + 0.5) / inputSize;
    }
    float xorBit(float v) {
        float b = mod(floor(v/bit), 2.0);
        float d = 1.0 - 2.0*b;
        return v + bit*d;
    }

    void main() {
        vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
        float state = xy.y * outputWidth + xy.x;
        float partner = xorBit(state);
        vec4 v = texture2D(inputTexture, toUv(state));
        vec4 p = texture2D(inputTexture, toUv(partner));
        gl_FragColor = vec4(v.x, v.y, v.z + p.z, 0.0);
    }`);

/**
 * @param {!int} includedQubitCount
 * @param {!int} totalQubitCount
 * @returns {!ShaderPipeline}
 */
function pipelineToAggregateRepresentativePolarKet(includedQubitCount, totalQubitCount) {
    let result = new ShaderPipeline();
    for (let bit = 0; bit < totalQubitCount - includedQubitCount; bit++) {
        result.addPowerSizedStep(
            totalQubitCount - bit - 1,
            inp => new WglConfiguredShader(dst => FOLD_REPRESENTATIVE_POLAR_KET_SHADER.withArgs(
                WglArg.vec2('inputSize', inp.width, inp.height),
                WglArg.float('outputWidth', dst.width),
                WglArg.texture('inputTexture', inp, 0),
                WglArg.float('offset', 1 << (totalQubitCount - bit - 1))
            ).renderTo(dst)));
    }
    return result;
}
const FOLD_REPRESENTATIVE_POLAR_KET_SHADER = new WglShader(`
    uniform float outputWidth;
    uniform vec2 inputSize;
    uniform sampler2D inputTexture;
    uniform float offset;

    vec2 toUv(float state) {
        return vec2(mod(state, inputSize.x) + 0.5, floor(state / inputSize.x) + 0.5) / inputSize;
    }

    void main() {
        vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
        float state = xy.y * outputWidth + xy.x;
        vec4 p1 = texture2D(inputTexture, toUv(state));
        vec4 p2 = texture2D(inputTexture, toUv(state + offset));
        gl_FragColor = vec4(
            p1.x + p2.x,
            p1.z >= p2.z ? p1.y : p2.y,
            p1.z + p2.z,
            0.0);
    }`);

/**
 * @param {!WglTexture} input
 * @returns {!WglConfiguredShader}
 */
function convertAwayFromPolar(input) {
    return new WglConfiguredShader(dst => CONVERT_AWAY_FROM_POLAR_SHADER.withArgs(
        WglArg.vec2('inputSize', input.width, input.height),
        WglArg.float('outputWidth', dst.width),
        WglArg.texture('inputTexture', input, 0)
    ).renderTo(dst));
}
const CONVERT_AWAY_FROM_POLAR_SHADER = new WglShader(`
    uniform float outputWidth;
    uniform vec2 inputSize;
    uniform sampler2D inputTexture;

    vec2 toUv(float state) {
        return vec2(mod(state, inputSize.x) + 0.5, floor(state / inputSize.x) + 0.5) / inputSize;
    }

    void main() {
        vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
        float state = xy.y * outputWidth + xy.x;
        vec4 polar = texture2D(inputTexture, toUv(state));
        float mag = sqrt(polar.x);
        gl_FragColor = vec4(mag * cos(polar.y), mag * sin(polar.y), polar.z, 0.0);
    }`);

/**
 * @param {!WglTexture} superposition
 * @returns {!function(!WglTexture) : !WglConfiguredShader}
 */
function toRatiosVsRepresentative(superposition) {
    return rep => new WglConfiguredShader(dst => TO_RATIOS_VS_REPRESENTATIVE_SHADER.withArgs(
        WglArg.vec2('inputSize', superposition.width, superposition.height),
        WglArg.vec2('repSize', rep.width, rep.height),
        WglArg.float('outputWidth', dst.width),
        WglArg.texture('inputTexture', superposition, 0),
        WglArg.texture('repTexture', rep, 1)
    ).renderTo(dst));
}
const TO_RATIOS_VS_REPRESENTATIVE_SHADER = new WglShader(`
    uniform float outputWidth;
    uniform vec2 inputSize;
    uniform vec2 repSize;
    uniform sampler2D inputTexture;
    uniform sampler2D repTexture;

    vec2 toUv(float state) {
        return vec2(mod(state, inputSize.x) + 0.5, floor(state / inputSize.x) + 0.5) / inputSize;
    }
    vec2 toUvRep(float state) {
        state = mod(state, repSize.x*repSize.y);
        return vec2(mod(state, repSize.x) + 0.5, floor(state / repSize.x) + 0.5) / repSize;
    }

    void main() {
        vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
        float state = xy.y * outputWidth + xy.x;
        vec2 val = texture2D(inputTexture, toUv(state)).xy;
        vec2 rep = texture2D(repTexture, toUvRep(state)).xy;
        gl_FragColor = vec4(val.x, val.y, rep.x, rep.y);
    }`);

/**
 * @param {!int} includedQubitCount
 * @param {!int} totalQubitCount
 * @returns {!ShaderPipeline}
 */
function pipelineToFoldConsistentRatios(includedQubitCount, totalQubitCount) {
    let result = new ShaderPipeline();
    let f = r => '[' + seq(r).partitioned(4).map(e => e.join(",")).join("] [") + ']';
    for (let bit = 0; bit < includedQubitCount; bit++) {
        result.addPowerSizedStep(
            totalQubitCount - bit - 1,
            inp => new WglConfiguredShader(dst => FOLD_CONSISTENT_RATIOS_SHADER.withArgs(
                WglArg.vec2('inputSize', inp.width, inp.height),
                WglArg.float('outputWidth', dst.width),
                WglArg.texture('inputTexture', inp, 0),
                WglArg.float('bit', 1 << (includedQubitCount - bit - 1))
            ).renderTo(dst)));
    }
    return result;
}
const FOLD_CONSISTENT_RATIOS_SHADER = new WglShader(`
    uniform float outputWidth;
    uniform vec2 inputSize;
    uniform sampler2D inputTexture;
    uniform float bit;

    bool isNaN(float val) {
        return val < 0.0 || 0.0 < val || val == 0.0 ? false : true;
    }
    vec2 toUv(float state) {
        return vec2(mod(state, inputSize.x) + 0.5, floor(state / inputSize.x) + 0.5) / inputSize;
    }
    vec2 mul(vec2 c1, vec2 c2) {
        return vec2(c1.x*c2.x - c1.y*c2.y, c1.x*c2.y + c1.y*c2.x);
    }
    vec4 mergeRatios(vec4 a, vec4 b) {
        float m1 = dot(a,a);
        float m2 = dot(b,b);
        vec2 c1 = mul(a.xy, b.zw);
        vec2 c2 = mul(a.zw, b.xy);
        vec2 d = c1 - c2;
        float nan = 0.0*d.x/0.0;
        float err = dot(d, d);
        err /= max(0.000000000000000001, min(abs(dot(c1, c1)), abs(dot(c2,c2))));
        return isNaN(err) || err > 0.0001 ? vec4(nan, nan, nan, nan)
            : m1 >= m2 ? a
            : b;
    }

    void main() {
        vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
        float state = xy.y * outputWidth + xy.x;
        float s1 = mod(state, bit) + floor(state/bit)*2.0*bit;
        float s2 = s1 + bit;
        vec4 v1 = texture2D(inputTexture, toUv(s1));
        vec4 v2 = texture2D(inputTexture, toUv(s2));

        gl_FragColor = mergeRatios(v1, v2);
    }`);

/**
 * @param {!int} w
 * @param {!int} h
 * @returns {!ShaderPipeline}
 */
function pipelineToSumAll(w, h) {
    let result = new ShaderPipeline();
    while (w > 1 || h > 1) {
        if (w > h) {
            w >>= 1;
            result.addSizedStep(w, h, (w=>t=>Shaders.sumFold(t, w, 0))(w));
        } else {
            h >>= 1;
            result.addSizedStep(w, h, (h=>t=>Shaders.sumFold(t, 0, h))(h));
        }
    }
    return result;
}

/**
 * @type {!function(!GateDrawParams)}
 */
const AMPLITUDE_DRAWER_FROM_CUSTOM_STATS = GatePainting.makeDisplayDrawer(args => {
    let n = args.gate.height;
    let {probabilities, superposition} = args.customStats || {
        probabilities: undefined,
        superposition: Matrix.zero(1 << n, 1 << n).times(NaN)
    };
    let matrix = probabilities || superposition;
    let isIncoherent = superposition === undefined;
    let dw = args.rect.w - args.rect.h*matrix.width()/matrix.height();
    let drawRect = args.rect.skipLeft(dw/2).skipRight(dw/2);
    MathPainter.paintMatrix(
        args.painter,
        matrix,
        drawRect,
        Config.SUPERPOSITION_MID_COLOR,
        'black',
        Config.SUPERPOSITION_FORE_COLOR,
        Config.SUPERPOSITION_BACK_COLOR,
        isIncoherent ? 'transparent' : 'black');

    let forceSign = v => (v >= 0 ? '+' : '') + v.toFixed(2);
    if (isIncoherent) {
        MathPainter.paintMatrixTooltip(args.painter, matrix, drawRect, args.focusPoints,
            (c, r) => `Chance of |${Util.bin(r*matrix.width() + c, args.gate.height)}⟩ [amplitude not defined]`,
            (c, r, v) => `raw: ${(v.norm2()*100).toFixed(4)}%, log: ${(Math.log10(v.norm2())*10).toFixed(1)} dB`,
            (c, r, v) => '[entangled with other qubits]');
    } else {
        MathPainter.paintMatrixTooltip(args.painter, matrix, drawRect, args.focusPoints,
            (c, r) => `Amplitude of |${Util.bin(r*matrix.width() + c, args.gate.height)}⟩`,
            (c, r, v) => 'val:' + v.toString(new Format(false, 0, 5, ", ")),
            (c, r, v) => `mag²:${(v.norm2()*100).toFixed(4)}%, phase:${forceSign(v.phase() * 180 / Math.PI)}°`);
    }

    paintErrorIfPresent(args, isIncoherent);
});

/**
 * @param {!GateDrawParams} args
 * @param {!boolean} isIncoherent
 */
function paintErrorIfPresent(args, isIncoherent) {
    /** @type {undefined|!string} */
    let err = undefined;
    let {col, row} = args.positionInCircuit;
    let measured = ((args.stats.circuitDefinition.colIsMeasuredMask(col) >> row) & ((1 << args.gate.height) - 1)) !== 0;
    if (isIncoherent) {
        err = 'incoherent';
    } else if (measured) {
        err = args.gate.width <= 2 ? '(w/ measure defer)' : '(assuming measurement deferred)';
    }
    if (err !== undefined) {
        args.painter.print(
            err,
            args.rect.x+args.rect.w/2,
            args.rect.y+args.rect.h,
            'center',
            'hanging',
            'red',
            '12px Helvetica',
            args.rect.w,
            args.rect.h,
            undefined);
    }
}

/**
 * @param {!int} span
 * @returns {!Gate}
 */
function amplitudeDisplayMaker(span) {
    return new Gate(
        "Amps",
        Matrix.identity(1 << span),
        "Amplitude Display",
        "Shows the amplitudes of some wires, if separable.\nUse controls to see conditional amplitudes.").
        withHeight(span).
        withWidth(span === 1 ? 2 : span % 2 === 0 ? span : Math.ceil(span/2)).
        withSerializedId("Amps" + span).
        withCustomStatPipelineMaker((val, con, bit, controls) => makeAmplitudeSpanPipeline(val, controls, bit, span)).
        withCustomStatPostProcessor(processOutputs).
        withCustomDrawer(AMPLITUDE_DRAWER_FROM_CUSTOM_STATS);
}

let AmplitudeDisplayFamily = Gate.generateFamily(1, 8, amplitudeDisplayMaker);

export default AmplitudeDisplayFamily;
export {
    AmplitudeDisplayFamily,
    amplitudesToPolarKets,
    pipelineToSpreadLengthAcrossPolarKets,
    pipelineToAggregateRepresentativePolarKet,
    convertAwayFromPolar,
    toRatiosVsRepresentative,
    pipelineToFoldConsistentRatios,
    pipelineToSumAll
};
