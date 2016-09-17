import {CircuitDefinition} from "src/circuit/CircuitDefinition.js"
import {Serializer} from "src/circuit/Serializer.js"

/**
 * @param {!Revision} revision
 */
function initTitleSync(revision) {
    const titleForState = jsonText => {
        //noinspection UnusedCatchParameterJS,EmptyCatchBlockJS
        try {
            let circuitDef = Serializer.fromJson(CircuitDefinition, JSON.parse(jsonText));
            if (!circuitDef.isEmpty()) {
                return `Quirk: ${circuitDef.readableHash()}`;
            }
        } catch (_) {
        }
        return 'Quirk: Toy Quantum Circuit Simulator';
    };

    revision.latestActiveCommit().subscribe(jsonText => {
        // Add a slight delay, so that history changes use the old title.
        setTimeout(() => { document.title = titleForState(jsonText); }, 0);
    });
}

export {initTitleSync}
