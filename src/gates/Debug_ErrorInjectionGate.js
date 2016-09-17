import {DetailedError} from "src/base/DetailedError.js"
import {Gate} from "src/circuit/Gate.js"
import {GatePainting} from "src/draw/GatePainting.js"

let ErrorInjectionGate = Gate.withoutKnownMatrix(
    "ERR!",
    "Error Injection Gate",
    "Throws an exception during circuit stat computations, for testing error paths.").
    markedAsStable().
    withCustomShader(args => {
        throw new DetailedError("Applied an Error Injection Gate", {qubit: args.row});
    }).
    withSerializedId("__error__").
    withCustomDrawer(GatePainting.MAKE_HIGHLIGHTED_DRAWER('red', 'red'));

export {ErrorInjectionGate}
