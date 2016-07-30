import Gate from "src/circuit/Gate.js"
import GatePainting from "src/draw/GatePainting.js"

let LetVariableGates = {};

let makeLetGate = key => Gate.generateFamily(1, 16, span => Gate.fromIdentity(
    `input ${key}`,
    `Input Gate [${key}]`,
    `Marks some qubits as input '${key}'.`).
    withSerializedId(`input${key}${span}`).
    withHeight(span).
    markedAsControlWireSource().
    withCustomColumnContextProvider(qubitIndex => [{
        key: `Input Range ${key}`,
        val: {
            offset: qubitIndex,
            length: span
        }
    }]).
    withCustomDrawer(args => {
        if (args.isInToolbox) {
            GatePainting.paintBackground(args);
            GatePainting.paintOutline(args);
        } else {
            let ctx = args.painter.ctx;
            ctx.save();
            args.painter.strokeRect(args.rect, '#888');
            args.painter.strokeLine(args.rect.topCenter(), args.rect.bottomCenter());
            ctx.globalAlpha *= 0.93;
            GatePainting.paintBackground(args);
            ctx.restore();
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
            key,
            x,
            y+2,
            'center',
            'top',
            'black',
            '16px sans-serif',
            args.rect.w - 2,
            args.rect.h / 2);
    }));

LetVariableGates.LetAFamily = makeLetGate('A');
LetVariableGates.LetBFamily = makeLetGate('B');

LetVariableGates.all = [
    ...LetVariableGates.LetAFamily.all,
    ...LetVariableGates.LetBFamily.all
];

export default LetVariableGates;
export {LetVariableGates}
