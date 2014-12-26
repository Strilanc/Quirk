window.onerror = function myErrorHandler(errorMsg, url, lineNumber) {
    alert("Error!\n\n" + errorMsg + "\n\nURL: " + url + "\nLine: " + lineNumber);
    return false;
};
