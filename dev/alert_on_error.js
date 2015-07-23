/**
 *
 * @param {!string} errorMsg
 * @param {!string} url
 * @param {!int} lineNumber
 * @param {undefined|!int} columnNumber
 * @param {undefined|*} errorObj
 */
window.onerror = function myErrorHandler(errorMsg, url, lineNumber, columnNumber, errorObj) {
    if (this.caught === undefined) {
        this.caught = [];
    }
    //noinspection JSUnresolvedVariable
    var location = (errorObj instanceof Object) ? errorObj.stack : undefined;
    if (location === undefined) {
        location = url + ":" + lineNumber + ":" + columnNumber;
    }

    var msg = "Error!\n\n" + errorMsg +
        "\n\nLocation: " + location.replace(/http.+\/(src|libs)\//g, '') +
        "\n\n(From now on this error will be ignored.)";

    if (this.caught.indexOf(msg) !== -1) {
        return false;
    }
    this.caught.push(msg);
    alert(msg);
    return false;
};
