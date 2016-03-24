/**
 * Draws a user-visible error box when problems occur.
 */
window.onerror = (errorMsg, url, lineNumber, columnNumber, errorObj) => {
    let canvas = document.getElementById("drawCanvas");
    if (canvas === undefined) {
        return false;
    }

    let location = ((errorObj instanceof Object) ? errorObj.stack : undefined) ||
        (url + ":" + lineNumber + ":" + columnNumber);
    let msg = "Uh oh, something's acting wonky!\n\n" +
        "=== Advanced Recovery Strategies ===\n" +
        "- hit Ctrl+Z (undo)\n" +
        "- flail the mouse around\n" +
        "- cry\n\n" +
        "=== Advanced Details ===\n" +
        `Message: ${errorMsg}` +
        `\nLocation: ${location.replace(/http.+\/(src|libs)\//g, '')}`;

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

    return false;
};
