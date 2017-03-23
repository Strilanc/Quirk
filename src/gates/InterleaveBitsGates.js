import {Config} from "src/Config.js"
import {Gate} from "src/circuit/Gate.js"
import {ketArgs, ketShaderPermute} from "src/circuit/KetShaderUtil.js"
import {GatePainting} from "src/draw/GatePainting.js"
import {Seq} from "src/base/Seq.js"

let InterleaveBitsGates = {};

/**
 * Transforms from a block bit position to a striped bit position.
 * @param {!int} bit
 * @param {!int} len
 * @returns {!int}
 */
function interleaveBit(bit, len) {
    let h = Math.ceil(len / 2);
    let group = Math.floor(bit / h);
    let stride = bit % h;
    return stride * 2 + group;
}

/**
 * Transforms from a striped bit position to a block bit position.
 * @param {!int} bit
 * @param {!int} len
 * @returns {!int}
 */
function deinterleaveBit(bit, len) {
    let h = Math.ceil(len / 2);
    let stride = Math.floor(bit / 2);
    let group = bit % 2;
    return stride + group * h;
}

/**
 * Returns a function that permutes all of the bits in a value using the given bit permutation.
 * @param {!function(bit: !int, len: !int) : !int} bitPermutation
 * @returns {!function(val: !int, len: !int) : !int}
 */
let valPermuteFromBit = bitPermutation => (val, len) => {
    let r = 0;
    for (let i = 0; i < len; i++) {
        let b = (val >> i) & 1;
        r |= b << bitPermutation(i, len);
    }
    return r;
};

/**
 * Interleaves all of the bits in an integer.
 * @param {!int} val
 * @param {!int} len
 * @returns {!int}
 */
let interleave = valPermuteFromBit(interleaveBit);

/**
 * Deinterleaves all of the bits in an integer.
 * @param {!int} val
 * @param {!int} len
 * @returns {!int}
 */
let deinterleave = valPermuteFromBit(deinterleaveBit);

/**
 * Constructs a shader that permutes bits based on the given function.
 * @param {!int} span
 * @param {!function(bit: !int, len: !int) : !int} bitPermutation
 * @return {!{withArgs: !function(args: ...!WglArg) : !WglConfiguredShader}}
 */
let shaderFromBitPermutation = (span, bitPermutation) => ketShaderPermute(
    '',
    `
        float r = 0.0;
        ${Seq.range(span).
            map(i => `r += mod(floor(out_id / ${1<<bitPermutation(i, span)}.0), 2.0) * ${1<<i}.0;`).
            join(`
        `)}
        return r;
    `,
    span);

/**
 * @type {!Map.<!int, !{withArgs: !function(args: ...!WglArg) : !WglConfiguredShader}>}
 */
let _interleaveShadersForSize = Seq.range(Config.MAX_WIRE_COUNT + 1).
    skip(2).
    toMap(k => k, k => shaderFromBitPermutation(k, interleaveBit));

/**
 * @type {!Map.<!int, !{withArgs: !function(args: ...!WglArg) : !WglConfiguredShader}>}
 */
let _deinterleaveShadersForSize = Seq.range(Config.MAX_WIRE_COUNT + 1).
    skip(2).
    toMap(k => k, k => shaderFromBitPermutation(k, interleaveBit));

InterleaveBitsGates.InterleaveBitsGateFamily = Gate.generateFamily(4, 16, span => Gate.withoutKnownMatrix(
    "Weave",
    "Interleave Bits Gate",
    "Re-orders blocks of bits into stripes of bits.").
    withSerializedId("weave" + span).
    withHeight(span).
    withWidth(span <= 8 ? 1 : 2).
    withKnownBitPermutation(b => interleaveBit(b, span)).
    withCustomDrawer(GatePainting.PERMUTATION_DRAWER).
    withCustomShader(ctx => _interleaveShadersForSize.get(span).withArgs(...ketArgs(ctx, span))));

InterleaveBitsGates.DeinterleaveBitsGateFamily = Gate.generateFamily(4, 16, span => Gate.withoutKnownMatrix(
    "Split",
    "Deinterleave Bits Gate",
    "Re-orders stripes of bits into blocks of bits.").
    withSerializedId("split" + span).
    withHeight(span).
    withWidth(span <= 8 ? 1 : 2).
    withKnownBitPermutation(b => deinterleaveBit(b, span)).
    withCustomDrawer(GatePainting.PERMUTATION_DRAWER).
    withCustomShader(ctx => _deinterleaveShadersForSize.get(span).withArgs(...ketArgs(ctx, span))));

InterleaveBitsGates.all = [
    ...InterleaveBitsGates.InterleaveBitsGateFamily.all,
    ...InterleaveBitsGates.DeinterleaveBitsGateFamily.all
];

export {
    InterleaveBitsGates,
    interleaveBit,
    deinterleaveBit,
    valPermuteFromBit,
    interleave,
    deinterleave,
    shaderFromBitPermutation
}
