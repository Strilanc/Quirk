import {Config} from "src/Config.js"
import {Gate} from "src/circuit/Gate.js"
import {ketArgs, ketShaderPermute} from "src/circuit/KetShaderUtil.js"
import {Seq} from "src/base/Seq.js"

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

let ReverseBitsGateFamily = Gate.buildFamily(2, 16, (span, builder) => builder.
    setSerializedId("rev" + span).
    setSymbol("Reverse").
    setTitle("Reverse Order").
    setBlurb("Swaps bits into the opposite order.").
    setKnownEffectToBitPermutation(i => span - 1 - i).
    setActualEffectToShaderProvider(reverseShaderForSize(span)));

export {ReverseBitsGateFamily, reverseShaderForSize}
