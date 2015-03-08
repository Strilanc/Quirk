import { Suite } from "test/TestUtil.js";

__karma__.start = () => {
    let total = 0;
    for (let suite of Suite.suites) {
        total += suite.tests.length;
    }
    __karma__.info({ total: total });

    for (let suite of Suite.suites) {
        let suitePassed = true;
        for (let [name, method] of suite.tests) {
            //noinspection JSUnusedAssignment
            let result = {
                description: name,
                suite: [suite.name],
                success: false,
                log: [],
                time: undefined
            };
            let status = { warn_only: false };

            let t0 = performance.now();
            try {
                //noinspection JSUnusedAssignment
                method(status);
                result.success = true;
                if (status.warn_only) {
                    //noinspection JSUnusedAssignment
                    console.warn(`${suite.name}.${name} passed, but is set to warn_only: ${status.warn_only}`);
                }
            } catch (ex) {
                if (status.warn_only) {
                    //noinspection JSUnusedAssignment
                    console.warn(`${suite.name}.${name} failed, but is set to warn_only: ${status.warn_only}`);
                    console.warn(`${ex}\n\n${ex.stack}`);
                    result.success = true;
                } else {
                    suitePassed = false;
                    //noinspection JSUnusedAssignment
                    result.log.push(`${suite.name}.${name} failed!\n\n${ex}\n\n${ex.stack}\n`);
                }
            }
            result.time = performance.now() - t0;

            __karma__.result(result);
        }

        if (!suitePassed) {
            console.warn(`${suite.name} suite failed`)
        }
    }

    __karma__.complete();
};
