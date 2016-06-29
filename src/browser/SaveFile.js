/**
 * @param {!string} name
 * @param {!string} content
 */
function saveFile(name, content) {
    //noinspection JSUnresolvedVariable
    if (navigator.msSaveBlob) {
        //noinspection JSUnresolvedFunction
        navigator.msSaveBlob(new Blob([content], {type: 'text/html;charset=UTF-8'}), name);
        return;
    }

    let anchor = document.createElement("a");
    //noinspection JSUnresolvedVariable,JSUnresolvedFunction
    anchor.href = window.URL !== undefined ?
        window.URL.createObjectURL(new Blob([content], {type: 'text/html;charset=UTF-8'})) :
        'data:application/octet-stream,' + encodeURI(moddedHtml);
    anchor.download = name;
    try {
        //noinspection XHTMLIncompatabilitiesJS
        document.body.appendChild(anchor);
        anchor.click();
    } finally {
        //noinspection XHTMLIncompatabilitiesJS
        document.body.removeChild(anchor);
    }
}

export { saveFile };
