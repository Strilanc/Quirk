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
 */
function perfGoal(name, targetDuration, method, arg=undefined) {
    //noinspection JSUnusedGlobalSymbols
    _knownPerfTests.push({name, method: () => {
        let dt = _measureDuration(method, arg, targetDuration.duration_nanos);
        let p = dt.duration_nanos / targetDuration.duration_nanos;
        let logger = (p > 1 ? console.warn : console.log);
        logger(`${_proportionDesc(p)} of goal [${_pad(targetDuration.description, 6)}] for ${name}`);
        return dt.duration_nanos <= targetDuration.duration_nanos
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
    let repeats = expected_nanos_hint < 30 * ms ? 50 : 10;
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
