import Gate from "src/circuit/Gate.js"
import GatePainting from "src/draw/GatePainting.js"
import GateShaders from "src/circuit/GateShaders.js"
import CircuitShaders from "src/circuit/CircuitShaders.js"
import Matrix from "src/math/Matrix.js"
import Seq from "src/base/Seq.js"

let LetVariableGates = {};

let makeLetGate = key => Gate.generateFamily(1, 16, span => Gate.fromIdentity(
    `Let ${key}`,
    `Input Gate [${key}]`,
    `Marks some qubits as input '${key}'.`).
    withSerializedId(`Let${key}${span}`).
    withHeight(span).
    withCustomColumnContextProvider(qubitIndex => [{
        key: `Let ${key}=`,
        val: {
            offset: qubitIndex,
            length: span
        }
    }]));

LetVariableGates.LetAFamily = makeLetGate('A');
LetVariableGates.LetBFamily = makeLetGate('B');

LetVariableGates.all = [
    ...LetVariableGates.LetAFamily.all,
    ...LetVariableGates.LetBFamily.all
];

export default LetVariableGates;
export {LetVariableGates}
