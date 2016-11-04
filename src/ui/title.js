import {Config} from "src/Config.js"
import {fromJsonText_CircuitDefinition} from "src/circuit/Serializer.js"

/**
 * @param {!Revision} revision
 */
function initTitleSync(revision) {
    const titleForState = jsonText => {
        //noinspection UnusedCatchParameterJS,EmptyCatchBlockJS
        try {
            let circuitDef = fromJsonText_CircuitDefinition(jsonText);
            if (!circuitDef.isEmpty()) {
                return `Quirk: ${circuitDef.readableHash()}`;
            }
        } catch (_) {
        }
        return Config.EMPTY_CIRCUIT_TITLE;
    };

    revision.latestActiveCommit().subscribe(jsonText => {
        // Add a slight delay, so that history changes use the old title.
        setTimeout(() => { document.title = titleForState(jsonText); }, 0);
    });
}

export {initTitleSync}
