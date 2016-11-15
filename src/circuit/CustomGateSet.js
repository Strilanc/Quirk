import {DetailedError} from "src/base/DetailedError.js"

class CustomGateSet {
    /**
     * @param {!Gate} gates
     */
    constructor(...gates) {
        /** @type {!Array.<!Gate>} */
        this.gates = gates;
    }

    /**
     * @param {!Gate} gate
     * @returns {!CustomGateSet}
     */
    withGate(gate) {
        if (!gate.serializedId.startsWith("~")) {
            throw new DetailedError("Custom gates' serialized id must start with '~'.", {id: gate.serializedId, gate});
        }
        if (this.findGateWithSerializedId(gate.serializedId)) {
            throw new DetailedError("Duplicate serialized id.", {gate});
        }
        return new CustomGateSet(...this.gates, gate);
    }

    /**
     * @param {!String} id
     * @returns {undefined|!Gate}
     */
    findGateWithSerializedId(id) {
        for (let g of this.gates) {
            if (g.serializedId === id) {
                return g;
            }
        }
        return undefined;
    }
}

export {CustomGateSet}
