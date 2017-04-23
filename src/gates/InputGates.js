import {Gate, GateBuilder} from "src/circuit/Gate.js"
import {GatePainting} from "src/draw/GatePainting.js"
import {reverseShaderForSize} from "src/gates/ReverseBitsGate.js"

let InputGates = {};

/**
 * @param {!GateDrawParams} args
 * @param {!string} key
 * @param {!boolean} reverse
 */
function drawInputGate(args, key, reverse) {
    GatePainting.paintBackground(args, '#DDD', '#DDD');
    if (args.isInToolbox) {
        GatePainting.paintOutline(args);
    } else {
        args.painter.strokeRect(args.rect, '#888');
    }
    GatePainting.paintResizeTab(args);

    let {x, y} = args.rect.center();
    args.painter.print(
        'input',
        x,
        y-2,
        'center',
        'bottom',
        'black',
        '16px sans-serif',
        args.rect.w - 2,
        args.rect.h / 2);
    args.painter.print(
        key + (reverse ? '[::-1]' : ''),
        x,
        y+2,
        'center',
        'top',
        'black',
        '16px sans-serif',
        args.rect.w - 2,
        args.rect.h / 2);
}

let makeInputGate = (key, reverse) => Gate.buildFamily(1, 16, (span, builder) => builder.
    setSerializedId((reverse ? 'rev' : '') + `input${key}${span}`).
    setSymbol((reverse ? 'rev ' : '') + `input ${key}`).
    setTitle(`Input Gate [${key}]` + (reverse ? ' [reversed]' : '')).
    setBlurb(`Temporarily uses some qubits as input ${key}${reverse ? ', in big-endian order' : ''}.`).
    setDrawer(args => drawInputGate(args, key, reverse)).
    promiseHasNoNetEffectOnStateVector().
    markAsNotInterestedInControls().
    setSetupCleanupEffectsToShaderProviders(
        reverse && span > 1 ? reverseShaderForSize(span) : undefined,
        reverse && span > 1 ? reverseShaderForSize(span) : undefined).
    setContextProvider(qubitIndex => [{
        key: `Input Range ${key}`,
        val: {
            offset: qubitIndex,
            length: span
        }
    }]));

let makeSetInputGate = key => new GateBuilder().
    setSerializedIdAndSymbol(`set${key}`).
    setTitle(`Set Default ${key}`).
    setBlurb(`Sets a default value for input ${key}, for when an inline input isn't given.`).
    setWidth(2).
    promiseHasNoNetEffectOnStateVector().
    markAsNotInterestedInControls().
    setStickyContextProvider((qubitIndex, gate) => [{
        key: `Input Default ${key}`,
        val: gate.param,
        sticky: true
    }]).
    setDrawer(args => {
        GatePainting.paintBackground(args, '#EEE', '#EEE');
        GatePainting.paintOutline(args);
        if (args.isInToolbox) {
            GatePainting.paintGateSymbol(args, `${key}=#\ndefault`);
        } else {
            GatePainting.paintGateSymbol(args, `${key}=${args.gate.param}`);
        }
    }).
    gate.
    withParam(0);

InputGates.InputAFamily = makeInputGate('A', false);
InputGates.InputBFamily = makeInputGate('B', false);
InputGates.InputRFamily = makeInputGate('R', false);
InputGates.InputRevAFamily = makeInputGate('A', true);
InputGates.InputRevBFamily = makeInputGate('B', true);
InputGates.SetA = makeSetInputGate('A');
InputGates.SetB = makeSetInputGate('B');
InputGates.SetR = makeSetInputGate('R');

InputGates.all = [
    ...InputGates.InputAFamily.all,
    ...InputGates.InputBFamily.all,
    ...InputGates.InputRFamily.all,
    ...InputGates.InputRevAFamily.all,
    ...InputGates.InputRevBFamily.all,
    InputGates.SetA,
    InputGates.SetB,
    InputGates.SetR,
];

export {InputGates}
