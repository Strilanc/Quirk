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

import {describe} from "./base/Describe.js"

/**
 * @type {!Array.<{regex: !Pattern, handler: !function()}>}
 */
let knownIssueRegexes = [];

let isHooked = false;
function hookErrorHandler() {
    isHooked = true;
    window.onerror = onErrorHandler;
}

function checkForKnownIssueHandler(subject, isKnownIssueUrl) {
    if (isKnownIssueUrl !== undefined) {
        return undefined;
    }
    for (let {regex, handler} of knownIssueRegexes) {
        //noinspection JSUnusedAssignment
        if (regex.test(subject)) {
            //noinspection JSUnusedAssignment
            return handler;
        }
    }
    return undefined;
}

let showErrorDiv_forced = (callout, subject, body, isKnownIssueUrl) => {
    // Set shown error details.
    document.getElementById('error-happened-div').innerText = callout;
    document.getElementById('error-message-div').innerText = subject;
    document.getElementById('error-description-div').innerText = body;
    document.getElementById('error-mailto-anchor').innerText = 'Email the issue to craig.gidney@gmail.com';
    document.getElementById('error-mailto-anchor').href = [
        'mailto:craig.gidney@gmail.com?subject=',
        encodeURIComponent('Quirk had an error: ' + subject),
        '&body=',
        encodeURIComponent('\n\n\n' + body)
    ].join('');
    document.getElementById('error-github-anchor').href = [
        'https://github.com/Strilanc/Quirk/issues/new?title=',
        encodeURIComponent('Encountered error: ' + subject),
        '&body=',
        encodeURIComponent('\n\n\n' + body)
    ].join('');
    document.getElementById('error-image-pre').src = takeScreenshotOfCanvas();
    setTimeout(() => {
        document.getElementById('error-image-post').src = takeScreenshotOfCanvas();
    }, 0);
    if (isKnownIssueUrl === undefined) {
        document.getElementById('error-report-div').style.display = 'block';
        document.getElementById('error-known-div').style.display = 'none';
    } else {
        document.getElementById('error-report-div').style.display = 'none';
        document.getElementById('error-known-div').style.display = 'block';
        document.getElementById('error-known-issue-anchor').href = isKnownIssueUrl;
    }
};

let _alreadySeenBodies = [];
let _alreadySeenIdentifiers = [];
/**
 * @param {!string} callout Scary 'there was an error' title show to user.
 * @param {!string} subject Subject used for github issue / mailto link.
 * @param {!string} body Body used for github issue / mailto link.
 * @param {!string} identifier A minimal description of the error that shouldn't vary as the circuit is edited, so
 * @param {undefined|!string} isKnownIssueUrl
 * errors covering other errors also get reported.
 */
let showErrorDiv = (callout, subject, body, identifier, isKnownIssueUrl=undefined) => {
    let errDivStyle = document.getElementById('error-div').style;
    if (errDivStyle.opacity < 0.7) {
        // Partially faded away as user interacted with circuit.
        // Enough time to justify updating the message despite the risk of clearing the user's selection.
        _alreadySeenBodies = [];
        _alreadySeenIdentifiers = [];
    }

    // Error just happened, so this should be showing and highlighted.
    errDivStyle.backgroundColor = '#FFA';
    errDivStyle.opacity = 1.0;
    errDivStyle.display = 'block';

    if (_alreadySeenBodies.indexOf(body) !== -1) {
        return;
    }
    _alreadySeenBodies.push(body);

    if (_alreadySeenIdentifiers.length > 0) {
        body += "\n\nCOVERED\n" + _alreadySeenIdentifiers.join("\n-------------\n");
    }
    if (_alreadySeenIdentifiers.indexOf(identifier) === -1) {
        _alreadySeenIdentifiers.push(identifier);
    }

    let handler = checkForKnownIssueHandler(subject, isKnownIssueUrl);
    if (handler !== undefined) {
        handler();
        return;
    }

    showErrorDiv_forced(callout, subject, body, isKnownIssueUrl);
};

let takeScreenshotOfCanvas = () => {
    let canvas = document.getElementById("drawCanvas");
    if (canvas === undefined) {
        return '#';
    }
    return canvas.toDataURL("image/png");
};

/**
 * @param {!string} recovery A short description of what happened and how it was recovered from.
 * @param {*} context Details about what caused the error and how we recovered.
 * @param {*} error The exception object.
 */
let notifyAboutRecoveryFromUnexpectedError = (recovery, context, error) => {
    if (!isHooked) {
        throw error;
    }
    console.error('Recovered from unexpected error', {recovery, context, error});

    let location = error.stack || "unknown";
    let msg = [
        recovery,
        '',
        'URL',
        document.location,
        '',
        'BROWSER',
        window.navigator.userAgent,
        window.navigator.appName,
        window.navigator.appVersion,
        '',
        'RECOVERY DETAILS',
        describe(context),
        '',
        'ERROR OBJECT',
        describe(error),
        '',
        'ERROR LOCATION',
         simplifySrcUrls(location)
    ].join('\n');

    showErrorDiv(
        'Recovered from an error. :(',
        recovery + ' (' + (error.message || '') + ')',
        msg,
        "(Recovered) " + recovery + " @ " + location.substr(0, 200) + "[...]");
};
let simplifySrcUrls = textContainingUrls => textContainingUrls.replace(/http.+?\/src\.min\.js/g, 'src.min.js');

let notifyAboutKnownIssue = (summary, url, regexes) => {
    let handler = () => showErrorDiv(
        'A known problem is happening. :(',
        summary,
        '',
        summary,
        url);

    for (let regex of regexes) {
        knownIssueRegexes.push({regex, handler});
    }
    handler();
};

let drawErrorBox = msg => {
    let canvas = document.getElementById("drawCanvas");
    if (canvas === undefined) {
        return;
    }
    let ctx = canvas.getContext("2d");
    ctx.font = '12px monospace';
    let lines = msg.split("\n");
    let w = 0;
    for (let line of lines) {
        w = Math.max(w, ctx.measureText(line).width);
    }
    let h = 12*lines.length;
    let x = (canvas.clientWidth - w) / 2;
    let y = (canvas.clientHeight - h) / 2;
    ctx.fillStyle = 'white';
    ctx.globalAlpha = 0.9;
    ctx.fillRect(x-10, y-10, w+20, h+20);
    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = 'red';
    ctx.strokeRect(x-10, y-10, w+20, h+20);
    ctx.fillStyle = 'red';
    let dy = 0;
    for (let i = 0; i < lines.length; i++) {
        dy += 3;
        ctx.fillText(lines[i], x, y + dy);
        dy += 9;
    }
};

/**
 * Draws a user-visible error box when problems occur.
 */
function onErrorHandler(errorMsg, url, lineNumber, columnNumber, errorObj) {
    try {
        let location = simplifySrcUrls(
            ((errorObj instanceof Object)? errorObj.stack : undefined) ||
                (url + ":" + lineNumber + ":" + columnNumber));

        let body = [
            'URL',
            document.location,
            '',
            'BROWSER',
            window.navigator.userAgent,
            window.navigator.appName,
            window.navigator.appVersion,
            '',
            'ERROR OBJECT',
            errorObj instanceof Object && errorObj.toString !== undefined ? errorObj.toString() : String(errorObj),
            '',
            'ERROR LOCATION',
            simplifySrcUrls(location)
        ].join('\n');

        showErrorDiv(
            'An error happened. :(',
            errorMsg,
            body,
            "(Unexpected) " + errorMsg + " @ " + location.substr(0, 200) + "[...]");

        drawErrorBox([
            'An error is happening. :(',
            '',
            errorMsg,
            '',
            'Scroll down for more information'
        ].join('\n'));

    } catch (ex) {
        console.error("Caused an exception when handling unexpected error.", ex);
    }
    return false;
}

export {hookErrorHandler, notifyAboutRecoveryFromUnexpectedError, onErrorHandler, notifyAboutKnownIssue}
