import {DetailedError} from "src/base/DetailedError.js"
import {Gate} from "src/circuit/Gate.js"
import {GatePainting} from "src/draw/GatePainting.js"

let ErrorInjectionGate = Gate.withoutKnownMatrix(
    "ERR!",
    "Error Injection Gate",
    "Throws an exception during circuit stat computations, for testing error paths.").
    markedAsStable().
    withCustomShader(ctx => {
        throw new DetailedError("Applied an Error Injection Gate", {qubit: ctx.row});
    }).
    withSerializedId("__error__").
    withCustomDrawer(GatePainting.MAKE_HIGHLIGHTED_DRAWER('red', 'red'));

export {ErrorInjectionGate}
