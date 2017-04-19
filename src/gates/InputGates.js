import {Gate} from "src/circuit/Gate.js"
import {GatePainting} from "src/draw/GatePainting.js"
import {reverseShaderForSize} from "src/gates/ReverseBitsGate.js"

let InputGates = {};

let makeInputGate = (key, reverse) => Gate.generateFamily(1, 16, span => Gate.fromIdentity(
    (reverse ? 'rev ' : '') + `input ${key}`,
    `Input Gate [${key}]` + (reverse ? ' [reversed]' : ''),
    `Temporarily uses some qubits as input ${key}${reverse ? ', in big-endian order' : ''}.`).
    withSerializedId((reverse ? 'rev' : '') + `input${key}${span}`).
    withHeight(span).
    markedAsNotInterestedInControls().
    withCustomColumnContextProvider(qubitIndex => [{
        key: `Input Range ${key}`,
        val: {
            offset: qubitIndex,
            length: span
        }
    }]).
    withCustomBeforeOperation(ctx => span > 1 ? reverseShaderForSize(span) : undefined).
    withCustomAfterOperation(ctx => span > 1 ? reverseShaderForSize(span) : undefined).
    withCustomDrawer(args => {
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
    }));

let makeSetInputGate = key => Gate.fromIdentity(
    `set${key}`,
    `Set Default ${key}`,
    `Sets a default value for input ${key}, for when an inline input isn't given.`).
    withWidth(2).
    withParam(0).
    markedAsNotInterestedInControls().
    withStickyContext().
    withCustomColumnContextProvider((qubitIndex, gate) => [{
        key: `Input Default ${key}`,
        val: gate.param,
        sticky: true
    }]).
    withCustomDrawer(args => {
        GatePainting.paintBackground(args, '#EEE', '#EEE');
        GatePainting.paintOutline(args);
        if (args.isInToolbox) {
            GatePainting.paintGateSymbol(args, `${key}=#\ndefault`);
        } else {
            GatePainting.paintGateSymbol(args, `${key}=${args.gate.param}`);
        }
    });

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
