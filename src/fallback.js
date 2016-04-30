import describe from "src/base/Describe.js"

let _alreadySeen = [];
let showErrorDiv = (subject, body) => {
    let errDivStyle = document.getElementById('errorDiv').style;
    if (errDivStyle.opacity < 0.7) {
        // Partially faded away as user interacted with circuit.
        // Enough time to justify updating the message despite the risk of clearing the user's selection.
        _alreadySeen = [];
    }

    // Error just happened, so this should be showing and highlighted.
    errDivStyle.backgroundColor = '#FFA';
    errDivStyle.opacity = 1.0;
    errDivStyle.display = 'block';

    if (_alreadySeen.indexOf(body) !== -1) {
        return;
    }
    _alreadySeen.push(body);

    // Set shown error details.
    document.getElementById('errorMessageDiv').innerText = subject;
    document.getElementById('errorDescDiv').innerText = body;
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
};

/**
 * @param {!string} recovery A short description of what happened and how it was recovered from.
 * @param {*} context Details about what caused the error and how we recovered.
 * @param {*} error The exception object.
 */
let notifyAboutRecoveryFromUnexpectedError = (recovery, context, error) => {
    console.warn('Recovered from unexpected error', {recovery, context, error});

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

    showErrorDiv(recovery + ' (' + (error.message || '') + ')', msg);
};

let simplifySrcUrls = textContainingUrls => textContainingUrls.replace(/http.+?\/src\.min\.js/g, 'src.min.js');

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
window.onerror = (errorMsg, url, lineNumber, columnNumber, errorObj) => {
    try {
        let location = simplifySrcUrls(
            ((errorObj instanceof Object)? errorObj.stack : undefined) ||
                (url + ":" + lineNumber + ":" + columnNumber));
        let details = errorObj !== undefined ? errorObj.details : undefined;

        showErrorDiv(errorMsg, [
            'URL',
            document.location,
            '',
            'BROWSER USER AGENT',
            window.navigator.userAgent,
            '',
            'ERROR OBJECT',
            errorObj instanceof Object && errorObj.toString !== undefined ? errorObj.toString() : String(errorObj),
            '',
            'ERROR LOCATION',
            simplifySrcUrls(location)
        ].join('\n'));

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
};

export { notifyAboutRecoveryFromUnexpectedError }
