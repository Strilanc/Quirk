import {notifyAboutRecoveryFromUnexpectedError} from "src/fallback.js"
import CircuitDefinition from "src/circuit/CircuitDefinition.js"
import Config from "src/Config.js"
import HistoryPusher from "src/browser/HistoryPusher.js"
import Serializer from "src/circuit/Serializer.js"

/**
 * @param {!Revision} revision
 */
function initUrlCircuitSync(revision) {
    // Pull initial circuit out of URL '#x=y' arguments.
    const getHashParameters = () => {
        let hashText = document.location.hash.substr(1);
        let paramsMap = new Map();
        if (hashText !== "") {
            for (let keyVal of hashText.split("&")) {
                let eq = keyVal.indexOf("=");
                if (eq === -1) {
                    continue;
                }
                let key = keyVal.substring(0, eq);
                let val = decodeURIComponent(keyVal.substring(eq + 1));
                paramsMap.set(key, val);
            }
        }
        return paramsMap;
    };

    const historyPusher = new HistoryPusher();
    const loadCircuitFromUrl = () => {
        try {
            historyPusher.currentStateIsMemorableButUnknown();
            let params = getHashParameters();
            if (!params.has(Config.URL_CIRCUIT_PARAM_KEY)) {
                let def = document.DEFAULT_CIRCUIT || JSON.stringify(Serializer.toJson(CircuitDefinition.EMPTY));
                params.set(Config.URL_CIRCUIT_PARAM_KEY, def);
            }

            let jsonText = params.get(Config.URL_CIRCUIT_PARAM_KEY);
            historyPusher.currentStateIsMemorableAndEqualTo(jsonText);
            let json = JSON.parse(jsonText);
            let circuitDef = Serializer.fromJson(CircuitDefinition, json);
            let cleanedJson = JSON.stringify(Serializer.toJson(circuitDef));
            revision.clear(cleanedJson);
            if (circuitDef.isEmpty() && params.size === 1) {
                historyPusher.currentStateIsNotMemorable();
            } else {
                let urlHash = "#" + Config.URL_CIRCUIT_PARAM_KEY + "=" + jsonText;
                historyPusher.stateChange(jsonText, urlHash);
            }
        } catch (ex) {
            notifyAboutRecoveryFromUnexpectedError(
                "Defaulted to an empty circuit. Failed to understand circuit from URL.",
                {document_location_hash: document.location.hash},
                ex);
        }
    };

    window.addEventListener('popstate', loadCircuitFromUrl);
    loadCircuitFromUrl();

    revision.latestActiveCommit().whenDifferent().skip(1).subscribe(jsonText => {
        let urlHash = "#" + Config.URL_CIRCUIT_PARAM_KEY + "=" + jsonText;
        historyPusher.stateChange(jsonText, urlHash);
    });
}

export {initUrlCircuitSync}
