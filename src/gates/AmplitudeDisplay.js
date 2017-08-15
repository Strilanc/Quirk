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

import {Config} from "src/Config.js"
import {CircuitShaders} from "src/circuit/CircuitShaders.js"
import {Gate} from "src/circuit/Gate.js"
import {GatePainting} from "src/draw/GatePainting.js"
import {GateShaders} from "src/circuit/GateShaders.js"
import {Format} from "src/base/Format.js"
import {MathPainter} from "src/draw/MathPainter.js"
import {Matrix} from "src/math/Matrix.js"
import {Point} from "src/math/Point.js"
import {Util} from "src/base/Util.js"
import {WglArg} from "src/webgl/WglArg.js"
import {WglConfiguredShader} from "src/webgl/WglConfiguredShader.js"
import {
    Inputs,
    Outputs,
    currentShaderCoder,
    makePseudoShaderWithInputsAndOutputAndCode
} from "src/webgl/ShaderCoders.js"
import {WglTexturePool} from "src/webgl/WglTexturePool.js"
import {WglTextureTrader} from "src/webgl/WglTextureTrader.js"

/**
 * @param {!WglTexture} stateKet
 * @param {!Controls} controls
 * @param {!int} rangeOffset
 * @param {!int} rangeLength
 * @returns {!Array.<!WglTexture>}
 */
function amplitudeDisplayStatTextures(stateKet, controls, rangeOffset, rangeLength) {
    let trader = new WglTextureTrader(stateKet);
    trader.dontDeallocCurrentTexture();

    // Put into normal form by throwing away areas not satisfying the controls and cycling the offset away.
    let startingQubits = currentShaderCoder().vec2.arrayPowerSizeOfTexture(stateKet);
    let lostQubits = Util.numberOfSetBits(controls.inclusionMask);
    let lostHeadQubits = Util.numberOfSetBits(controls.inclusionMask & ((1<<rangeOffset)-1));
    let involvedQubits = startingQubits - lostQubits;
    trader.shadeAndTrade(
        tex => CircuitShaders.controlSelect(controls, tex),
        WglTexturePool.takeVec2Tex(involvedQubits));
    trader.shadeAndTrade(tex => GateShaders.cycleAllBits(tex, lostHeadQubits-rangeOffset));
    let ketJustAfterCycle = trader.dontDeallocCurrentTexture();

    // Look over all superposed values of the target qubits and pick the one with the most amplitude.
    trader.shadeAndTrade(amplitudesToPolarKets, WglTexturePool.takeVec4Tex(involvedQubits));
    spreadLengthAcrossPolarKets(trader, rangeLength);
    reduceToLongestPolarKet(trader, rangeLength);
    trader.shadeAndTrade(convertAwayFromPolar);
    let amps = trader.dontDeallocCurrentTexture();

    // Compare the chosen case against other cases. If they aren't multiples, we're not separable (i.e. incoherent).
    trader.shadeAndTrade(
        winningVectorKet => toRatiosVsRepresentative(ketJustAfterCycle, winningVectorKet),
        WglTexturePool.takeVec4Tex(involvedQubits));
    ketJustAfterCycle.deallocByDepositingInPool("ketJustAfterCycle in makeAmplitudeSpanPipeline");
    foldConsistentRatios(trader, rangeLength);
    signallingSumAll(trader);

    return [amps, trader.currentTexture];
}

/**
 * @param {!int} span
 * @param {!Array.<!Float32Array>} pixelGroups
 * @param {!CircuitDefinition} circuitDefinition
 * @returns {!{probabilities: undefined|!Float32Array, superposition: undefined|!Matrix, phaseLockIndex:undefined|!int}}
 */
function processOutputs(span, pixelGroups, circuitDefinition) {
    let [ketPixels, consistentPixel] = pixelGroups;
    let n = ketPixels.length >> 2;
    let w = n === 2 ? 2 : 1 << Math.floor(Math.round(Math.log2(n))/2);
    let h = n/w;
    let isPure = !isNaN(consistentPixel[0]) && consistentPixel[0] !== -666.0;
    let unity = ketPixels[2];

    if (!isPure) {
        return _processOutputs_probabilities(w, h, n, unity, ketPixels);
    }

    let phaseIndex = span === circuitDefinition.numWires ? undefined : _processOutputs_pickPhaseLockIndex(ketPixels);
    let phase = phaseIndex === undefined ? 0 : Math.atan2(ketPixels[phaseIndex*4+1], ketPixels[phaseIndex*4]);
    let c = Math.cos(phase);
    let s = -Math.sin(phase);

    let buf = new Float32Array(n*2);
    let sqrtUnity = Math.sqrt(unity);
    for (let i = 0; i < n; i++) {
        let real = ketPixels[i*4]/sqrtUnity;
        let imag = ketPixels[i*4+1]/sqrtUnity;
        buf[i*2] = real*c + imag*-s;
        buf[i*2+1] = real*s + imag*c;
    }
    return {
        probabilities: undefined,
        superposition: new Matrix(w, h, buf),
        phaseLockIndex: phaseIndex
    };
}

/**
 * @param {!Float32Array} ketPixels
 * @returns {!int}
 * @private
 */
function _processOutputs_pickPhaseLockIndex(ketPixels) {
    let result = 0;
    let best = 0;
    for (let k = 0; k < ketPixels.length; k += 4) {
        let r = ketPixels[k];
        let i = ketPixels[k+1];
        let m = r*r + i*i;
        if (m > best*10000) {
            best = m;
            result = k >> 2;
        }
    }
    return result;
}

function _processOutputs_probabilities(w, h, n, unity, ketPixels) {
    let pBuf = new Float32Array(n*2);
    for (let k = 0; k < n; k++) {
        let r = ketPixels[k*4];
        let i = ketPixels[k*4+1];
        pBuf[k*2] = Math.sqrt((r*r + i*i)/unity);
    }
    return {
        probabilities: new Matrix(w, h, pBuf),
        superposition: undefined,
        phaseLockIndex: undefined
    };
}

/**
 * @param {!WglTexture} input
 * @returns {!WglConfiguredShader}
 */
function amplitudesToPolarKets(input) {
    return AMPLITUDES_TO_POLAR_KETS_SHADER(input);
}
const AMPLITUDES_TO_POLAR_KETS_SHADER = makePseudoShaderWithInputsAndOutputAndCode(
    [Inputs.vec2('input')],
    Outputs.vec4(),
    `vec4 outputFor(float k) {
        vec2 ri = read_input(k);
        float mag = dot(ri, ri);
        float phase = mag == 0.0 ? 0.0 : atan(ri.y, ri.x);
        return vec4(mag, phase, mag, 0.0);
    }`);

/**
 * Goes from (mag, angle, mag, 0) form to (mag, angle, total_vector_mag, 0) form.
 * @param {!WglTextureTrader} textureTrader
 * @param {!int} includedQubitCount
 * @returns {void}
 */
function spreadLengthAcrossPolarKets(textureTrader, includedQubitCount) {
    for (let bit = 0; bit < includedQubitCount; bit++) {
        textureTrader.shadeAndTrade(inp => SPREAD_LENGTH_ACROSS_POLAR_KETS_SHADER(
            inp,
            WglArg.float('bit', 1 << bit)));
    }
}
const SPREAD_LENGTH_ACROSS_POLAR_KETS_SHADER = makePseudoShaderWithInputsAndOutputAndCode(
    [Inputs.vec4('input')],
    Outputs.vec4(),
    `
    uniform float bit;

    float xorBit(float v) {
        float b = mod(floor(v/bit), 2.0);
        float d = 1.0 - 2.0*b;
        return v + bit*d;
    }

    vec4 outputFor(float k) {
        float partner = xorBit(k);
        vec4 v = read_input(k);
        vec4 p = read_input(partner);
        return vec4(v.x, v.y, v.z + p.z, 0.0);
    }`);

/**
 * Reduces a list of vectors in (mag, angle, total_mag_of_vector, 0) form to the single highest-total-magnitude vector.
 * @param {!WglTextureTrader} textureTrader
 * @param {!int} includedQubitCount
 * @returns {void}
 */
function reduceToLongestPolarKet(textureTrader, includedQubitCount) {
    let curQubitCount = currentShaderCoder().vec4.arrayPowerSizeOfTexture(textureTrader.currentTexture);
    while (curQubitCount > includedQubitCount) {
        curQubitCount -= 1;
        textureTrader.shadeHalveAndTrade(
            inp => FOLD_REPRESENTATIVE_POLAR_KET_SHADER(
                inp,
                WglArg.float('offset', 1 << curQubitCount)));
    }
}
const FOLD_REPRESENTATIVE_POLAR_KET_SHADER = makePseudoShaderWithInputsAndOutputAndCode(
    [Inputs.vec4('input')],
    Outputs.vec4(),
    `
    uniform float offset;

    vec4 outputFor(float k) {
        vec4 p = read_input(k);
        vec4 q = read_input(k + offset);
        return vec4(
            p.x + q.x,
            // Bias towards p1 is to keep the choice stable in the face of uniform superpositions and noise.
            p.z*1.001 >= q.z ? p.y : q.y,
            p.z + q.z,
            0.0);
    }`);

/**
 * @param {!WglTexture} input
 * @returns {!WglConfiguredShader}
 */
function convertAwayFromPolar(input) {
    return CONVERT_AWAY_FROM_POLAR_SHADER(input);
}
const CONVERT_AWAY_FROM_POLAR_SHADER = makePseudoShaderWithInputsAndOutputAndCode(
    [Inputs.vec4('input')],
    Outputs.vec4(),
    `
    vec4 outputFor(float k) {
        vec4 polar = read_input(k);
        float mag = sqrt(polar.x);
        return vec4(mag * cos(polar.y), mag * sin(polar.y), polar.z, 0.0);
    }`);

/**
 * @param {!WglTexture} ket
 * @param {!WglTexture} rep
 * @returns {!WglConfiguredShader}
 */
let toRatiosVsRepresentative = (ket, rep) => TO_RATIOS_VS_REPRESENTATIVE_SHADER(ket, rep);
const TO_RATIOS_VS_REPRESENTATIVE_SHADER = makePseudoShaderWithInputsAndOutputAndCode(
    [
        Inputs.vec2('ket'),
        Inputs.vec4('rep')
    ],
    Outputs.vec4(),
    `vec4 outputFor(float k) {
        return vec4(read_ket(k), read_rep(mod(k, len_rep())).xy);
    }`);

/**
 * @param {!WglTextureTrader} textureTrader
 * @param {!int} includedQubitCount
 * @returns {void}
 */
function foldConsistentRatios(textureTrader, includedQubitCount) {
    let curQubitCount = currentShaderCoder().vec4.arrayPowerSizeOfTexture(textureTrader.currentTexture);
    let remainingIncludedQubitCount = includedQubitCount;
    while (remainingIncludedQubitCount > 0) {
        remainingIncludedQubitCount -= 1;
        curQubitCount -= 1;
        textureTrader.shadeHalveAndTrade(
            inp => FOLD_CONSISTENT_RATIOS_SHADER(
                inp,
                WglArg.float('bit', 1 << remainingIncludedQubitCount)));
    }
}
const FOLD_CONSISTENT_RATIOS_SHADER = makePseudoShaderWithInputsAndOutputAndCode(
    [Inputs.vec4('input')],
    Outputs.vec4(),
    `
    uniform float bit;

    vec2 mul(vec2 c1, vec2 c2) {
        return vec2(c1.x*c2.x - c1.y*c2.y, c1.x*c2.y + c1.y*c2.x);
    }
    vec4 mergeRatios(vec4 a, vec4 b) {
        vec2 c1 = mul(a.xy, b.zw);
        vec2 c2 = mul(a.zw, b.xy);
        vec2 d = c1 - c2;
        float err = dot(d, d);
        // The max up-scaling controls a tricky tradeoff between noisy false positives and blurry false negatives.
        err /= max(0.00000000001, min(abs(dot(c1, c1)), abs(dot(c2,c2))));
        float m1 = dot(a, a);
        float m2 = dot(b, b);
        return a.x == -666.0 || b.x == -666.0 || err > 0.001 ? vec4(-666.0, -666.0, -666.0, -666.0)
            : m1 >= m2 ? a
            : b;
    }

    vec4 outputFor(float k) {
        float s1 = mod(k, bit) + floor(k/bit)*2.0*bit;
        float s2 = s1 + bit;
        vec4 v1 = read_input(s1);
        vec4 v2 = read_input(s2);

        return mergeRatios(v1, v2);
    }`);

/**
 * @param {!WglTextureTrader} textureTrader
 */
function signallingSumAll(textureTrader) {
    let curQubitCount = currentShaderCoder().vec4.arrayPowerSizeOfTexture(textureTrader.currentTexture);
    while (curQubitCount > 0) {
        curQubitCount -= 1;
        textureTrader.shadeHalveAndTrade(SIGNALLING_SUM_SHADER_VEC4);
    }
}
const SIGNALLING_SUM_SHADER_VEC4 = makePseudoShaderWithInputsAndOutputAndCode(
    [Inputs.vec4('input')],
    Outputs.vec4(),
    `vec4 outputFor(float k) {
        vec4 a = read_input(k);
        vec4 b = read_input(k + len_output());
        return a.x == -666.0 || b.x == -666.0 ? vec4(-666.0, -666.0, -666.0, -666.0) : a + b;
    }`);

/**
 * @type {!function(!GateDrawParams)}
 */
const AMPLITUDE_DRAWER_FROM_CUSTOM_STATS = GatePainting.makeDisplayDrawer(args => {
    let n = args.gate.height;
    let {probabilities, superposition, phaseLockIndex} = args.customStats || {
        probabilities: undefined,
        superposition: (n === 1 ? Matrix.zero(2, 1) : Matrix.zero(1 << Math.floor(n / 2), 1 << Math.ceil(n / 2))).
            times(NaN),
        phaseLockIndex: undefined
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
        if (phaseLockIndex !== undefined) {
            let cw = drawRect.w/matrix.width();
            let rh = drawRect.h/matrix.height();
            let c = phaseLockIndex % matrix.width();
            let r = Math.floor(phaseLockIndex / matrix.width());
            let cx = drawRect.x + cw*(c+0.5);
            let cy = drawRect.y + rh*(r+0.5);
            args.painter.strokeLine(new Point(cx, cy), new Point(cx + cw/2, cy), 'red', 2);
            args.painter.print(
                'fixed',
                cx + 0.5*cw,
                cy,
                'right',
                'bottom',
                'red',
                '12px monospace',
                cw*0.5,
                rh*0.5);
        }
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
            '12px sans-serif',
            args.rect.w,
            args.rect.h,
            undefined);
    }
}

let AmplitudeDisplayFamily = Gate.buildFamily(1, 16, (span, builder) => builder.
    setSerializedId("Amps" + span).
    setSymbol("Amps").
    setTitle("Amplitude Display").
    setBlurb("Shows the amplitudes of some wires, if separable.\nUse controls to see conditional amplitudes.").
    setWidth(span === 1 ? 2 : span % 2 === 0 ? span : Math.ceil(span/2)).
    promiseHasNoNetEffectOnStateVector().
    setExtraDisableReasonFinder(args => args.isNested ? "can't\nnest\ndisplays\n(sorry)" : undefined).
    setStatTexturesMaker(ctx =>
        amplitudeDisplayStatTextures(ctx.stateTrader.currentTexture, ctx.controls, ctx.row, span)).
    setStatPixelDataPostProcessor((val, def) => processOutputs(span, val, def)).
    setDrawer(AMPLITUDE_DRAWER_FROM_CUSTOM_STATS));

export {
    AmplitudeDisplayFamily,
    amplitudesToPolarKets,
    convertAwayFromPolar,
    amplitudeDisplayStatTextures,
    reduceToLongestPolarKet,
    foldConsistentRatios,
    spreadLengthAcrossPolarKets,
    signallingSumAll,
    toRatiosVsRepresentative
};
