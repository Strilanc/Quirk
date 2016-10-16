import {CircuitShaders} from "src/circuit/CircuitShaders.js"
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
let reverseShaderForSize = span => ketShaderPermute(
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

let ReverseBitsGateFamily = Gate.generateFamily(2, 16, span => {
    let shader = reverseShaderForSize(span);
    return Gate.withoutKnownMatrix(
        "Reverse",
        "Reverse Bits Gate",
        "Swaps some bits into the opposite order.").
        markedAsStable().
        markedAsOnlyPermutingAndPhasing().
        withSerializedId("rev" + span).
        withHeight(span).
        withKnownMatrix(span < 5 ? reverseBitsMatrix(span) : undefined).
        withCustomShader(args => shader.withArgs(...ketArgs(args, span)));
});

export {ReverseBitsGateFamily}
