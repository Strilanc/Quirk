import {getKnownPerfTests} from "test_perf/TestPerfUtil.js";

let execIntoPromise = method => {
    try {
        return Promise.resolve(method());
    } catch (ex) {
        return Promise.reject(ex);
    }
};

let promiseRunPerfTest = ({name, method}) => {
    let result = {
        description: name,
        suite: ['(Perf Tests)'],
        success: false,
        log: [],
        time: undefined
    };

    let t0 = performance.now();
    return execIntoPromise(method).then(
        passed => {
            result.success = passed;
        },
        ex => {
            result.log.push(String(ex));
            if (ex.details !== undefined) {
                result.log.push(ex.details);
            }
            if (ex.stack !== undefined) {
                result.log.push(ex.stack);
            }
        }).then(() => {
            result.time = performance.now() - t0;
            __karma__.result(result);
        });
};

__karma__.start = () => {
    let known = getKnownPerfTests();
    __karma__.info({ total: known.length });
    Promise.all(known.map(promiseRunPerfTest)).then(() => __karma__.complete());
};
