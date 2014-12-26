/**
 *
 * @param {!string} errorMsg
 * @param {!string} url
 * @param {!int} lineNumber
 * @param {undefined|!int} columnNumber
 * @param {*} errorObj
 */
window.onerror = function myErrorHandler(errorMsg, url, lineNumber, columnNumber) {
    if (this.caught === undefined) {
        this.caught = [];
    }
    var msg = "Error!\n\n" + errorMsg +
        "\n\nURL: " + url +
        "\n\nLine: " + lineNumber +
        "\nColumn: " + columnNumber +
        "\n\n(From now on this error will now be ignored.)";

    if (this.caught.indexOf(msg) !== -1) {
        return false;
    }
    this.caught.push(msg);
    alert(msg);
    return false;
};
