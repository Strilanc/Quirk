import {Gate} from "src/circuit/Gate.js"
import {GatePainting} from "src/draw/GatePainting.js"
import {reverseShaderForSize} from "src/gates/ReverseBitsGate.js"

let InputGates = {};

let makeInputGate = (key, reverse) => Gate.generateFamily(1, 16, span => Gate.fromIdentity(
    (reverse ? 'rev ' : '') + `input ${key}`,
    `Input Gate [${key}]` + (reverse ? ' [reversed]' : ''),
    `Marks some qubits as input '${key}'${reverse ? ', in big-endian order' : ''}.`).
    withSerializedId((reverse ? 'rev' : '') + `input${key}${span}`).
    withHeight(span).
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
        GatePainting.paintBackground(args);
        if (args.isInToolbox) {
            GatePainting.paintOutline(args);
        } else {
            args.painter.strokeRect(args.rect, '#AAA');
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

InputGates.InputAFamily = makeInputGate('A', false);
InputGates.InputBFamily = makeInputGate('B', false);
InputGates.InputRevAFamily = makeInputGate('A', true);
InputGates.InputRevBFamily = makeInputGate('B', true);

InputGates.all = [
    ...InputGates.InputAFamily.all,
    ...InputGates.InputBFamily.all,
    ...InputGates.InputRevAFamily.all,
    ...InputGates.InputRevBFamily.all
];

export {InputGates}
