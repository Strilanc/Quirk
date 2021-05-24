/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {getKnownPerfTests} from "./TestPerfUtil.js";

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
        ({pass, info}) => {
            result.success = pass;
            result.log.push(info);
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

    let chain = Promise.resolve();
    for (let test of known) {
        chain = chain.then(() =>
            new Promise(resolver =>
                setTimeout(() =>
                    resolver(promiseRunPerfTest(test)),
                    25)));
    }

    chain.then(() => __karma__.complete());
};
