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

import {} from "../src/browser/Polyfills.js"

function nanos(nanoseconds) {
    return {
        duration_nanos: nanoseconds,
        description: nanoseconds + " ns"
    };
}

function micros(microseconds) {
    return {
        duration_nanos: microseconds * 1.0e3,
        description: microseconds + " us"
    };
}

function millis(milliseconds) {
    return {
        duration_nanos: milliseconds * 1.0e6,
        description: milliseconds + " ms"
    };
}

let _knownPerfTests = [];
function getKnownPerfTests() {
    return _knownPerfTests;
}

/**
 * @param {!string} name
 * @param {!{duration_nanos: !int, description: !string}} targetDuration
 * @param {!function(*):*} method
 * @param {undefined|*=undefined} arg
 * @param {!function(*):void} cleanup
 */
function perfGoal(name, targetDuration, method, arg=undefined, cleanup=undefined) {
    //noinspection JSUnusedGlobalSymbols
    _knownPerfTests.push({name, method: () => {
        let dt = _measureDuration(method, arg, targetDuration.duration_nanos);
        if (cleanup !== undefined) {
            cleanup(arg);
        }
        let p = dt.duration_nanos / targetDuration.duration_nanos;
        let pass = dt.duration_nanos <= targetDuration.duration_nanos;
        let info = `${_proportionDesc(p)} of goal [${_pad(targetDuration.description, 6)}] for ${name}`;
        if (pass) {
            console.log(info);
        } else {
            console.warn(info);
        }
        return {pass, info}
    }});
}

function _pad(obj, length) {
    let v = `${obj}`;
    return ' '.repeat(Math.max(0, length - v.length)) + v;
}

function _proportionDesc(proportion) {
    return `[${_proportionBar(proportion)}] finished in ${_pad(Math.round(proportion*100), 2)}%`;
}

function _proportionBar(proportion, length=20) {
    if (proportion > 1) {
        return '!'.repeat(length);
    }
    let n = Math.round(proportion * length);
    return '#'.repeat(n) + ' '.repeat(length - n);
}

function _measureDuration(method, arg, expected_nanos_hint) {
    let ms = 1.0e6;
    let repeats = expected_nanos_hint < 5 * ms ? 100 :
        expected_nanos_hint < 30 * ms ? 50 :
        10;
    // Dry run to get any one-time initialization done.
    method(arg);

    let t0 = window.performance.now();
    for (let i = 0; i < repeats; i++) {
        method(arg);
    }
    let t1 = window.performance.now();
    return {duration_nanos: (t1 - t0) / repeats * ms};
}

export {getKnownPerfTests, perfGoal, nanos, micros, millis}
