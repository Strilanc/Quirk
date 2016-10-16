import {CircuitShaders} from "src/circuit/CircuitShaders.js"
import {Config} from "src/Config.js"
import {Gate} from "src/circuit/Gate.js"
import {ketArgs, ketShaderPermute} from "src/circuit/KetShaderUtil.js"
import {Matrix} from "src/math/Matrix.js"
import {Seq} from "src/base/Seq.js"

let reverseBits = (val, len) => {
    let r = 0;
    for (let i = 0; i < len; i++) {
        if (((val >> i) & 1) !== 0) {
            r |= 1 << (len - i - 1);
        }
    }
    return r;
};

let reverseBitsMatrix = span => Matrix.generateTransition(1<<span, e => reverseBits(e, span));
let _generateReverseShaderForSize = span => span < 2 ? undefined : ketShaderPermute(
    '',
    `
        float rev = 0.0;
        for (int k = 0; k < ${span}; k++) {
            rev *= 2.0;
            rev += mod(out_id, 2.0);
            out_id = floor(out_id*0.5);
        }
        return rev;
    `,
    span);

let reverseShaders = Seq.range(Config.MAX_WIRE_COUNT + 1).map(_generateReverseShaderForSize).toArray();

/**
 * @param {!int} span
 * @returns {!function(!CircuitEvalContext) : !WglConfiguredShader}
 */
let reverseShaderForSize = span => ctx => reverseShaders[span].withArgs(...ketArgs(ctx, span));

let ReverseBitsGateFamily = Gate.generateFamily(2, 16, span => {
    return Gate.withoutKnownMatrix(
        "Reverse",
        "Reverse Bits Gate",
        "Swaps some bits into the opposite order.").
        markedAsStable().
        markedAsOnlyPermutingAndPhasing().
        withSerializedId("rev" + span).
        withHeight(span).
        withKnownMatrix(span < 5 ? reverseBitsMatrix(span) : undefined).
        withCustomShader(reverseShaderForSize(span));
});

export {ReverseBitsGateFamily, reverseShaderForSize}
