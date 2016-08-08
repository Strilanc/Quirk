import Gate from "src/circuit/Gate.js"
import GatePainting from "src/draw/GatePainting.js"
import { shadersForReverseOfSize } from "src/gates/ReverseBitsGateFamily.js"

let LetVariableGates = {};

let makeLetGate = (key, reverse) => Gate.generateFamily(1, 16, span => Gate.fromIdentity(
    (reverse ? 'rev ' : '') + `input ${key}`,
    `Input Gate [${key}]` + (reverse ? ' [reversed]' : ''),
    `Marks some qubits as input '${key}'.`).
    withSerializedId((reverse ? 'rev' : '') + `input${key}${span}`).
    withHeight(span).
    markedAsControlWireSource().
    withCustomColumnContextProvider(qubitIndex => [{
        key: `Input Range ${key}`,
        val: {
            offset: qubitIndex,
            length: span
        }
    }]).
    withSetupShaders(
        reverse ? shadersForReverseOfSize(span) : [],
        reverse ? shadersForReverseOfSize(span) : []).
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

LetVariableGates.LetAFamily = makeLetGate('A', false);
LetVariableGates.LetBFamily = makeLetGate('B', false);
LetVariableGates.RevLetAFamily = makeLetGate('A', true);
LetVariableGates.RevLetBFamily = makeLetGate('B', true);

LetVariableGates.all = [
    ...LetVariableGates.LetAFamily.all,
    ...LetVariableGates.LetBFamily.all,
    ...LetVariableGates.RevLetAFamily.all,
    ...LetVariableGates.RevLetBFamily.all
];

export default LetVariableGates;
export {LetVariableGates}
