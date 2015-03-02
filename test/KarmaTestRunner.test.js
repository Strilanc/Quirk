import { Suite } from "test/TestUtil.js";

__karma__.start = () => {
    let total = 0;
    for (let suite of Suite.suites) {
        total += suite.tests.length;
    }
    __karma__.info({ total: total });

    for (let suite of Suite.suites) {
        for (let [name, method] of suite.tests) {
            let result = {
                description: name,
                suite: [suite.name],
                success: false,
                log: [],
                time: undefined
            };

            //noinspection JSUnresolvedVariable
            let t0 = performance.now();
            try {
                method();
                result.success = true;
            } catch (ex) {
                result.log.push("Test failed: " + ex + "\n\n" + ex.stack);
            }
            //noinspection JSUnresolvedVariable
            result.time = performance.now() - t0;

            __karma__.result(result);
        }
    }

    __karma__.complete();
};
