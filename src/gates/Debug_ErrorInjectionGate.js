import {DetailedError} from "src/base/DetailedError.js"
import {GateBuilder} from "src/circuit/Gate.js"
import {GatePainting} from "src/draw/GatePainting.js"

let ErrorInjectionGate = new GateBuilder().
    setSerializedId("__error__").
    setSymbol("ERR!").
    setTitle("Error Injection Gate").
    setBlurb("Throws an exception during circuit stat computations, for testing error paths.").
    setDrawer(GatePainting.MAKE_HIGHLIGHTED_DRAWER('red', 'red')).
    setActualEffectToUpdateFunc(ctx => {
        throw new DetailedError("Applied an Error Injection Gate", {qubit: ctx.row});
    }).
    promiseEffectIsStable().
    gate;

export {ErrorInjectionGate}
