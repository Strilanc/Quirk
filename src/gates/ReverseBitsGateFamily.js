import CircuitShaders from "src/circuit/CircuitShaders.js"
import Gate from "src/circuit/Gate.js"
import Matrix from "src/math/Matrix.js"
import Seq from "src/base/Seq.js"

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

let ReverseBitsGateFamily = Gate.generateFamily(2, 16, span => Gate.withoutKnownMatrix(
    "Reverse",
    "Reverse Bits Gate",
    "Swaps some bits into the opposite order.").
    markedAsStable().
    markedAsOnlyPermutingAndPhasing().
    withSerializedId("rev" + span).
    withHeight(span).
    withKnownMatrix(span < 5 ? reverseBitsMatrix(span) : undefined).
    withCustomShaders(Seq.range(Math.floor(span/2)).
        map(i => args => CircuitShaders.swap(
            args.stateTexture,
            args.row + i,
            args.row + span - i - 1,
            args.controlsTexture)).
        toArray()));

export default ReverseBitsGateFamily;
