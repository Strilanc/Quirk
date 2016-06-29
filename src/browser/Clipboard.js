/**
 * @param {!HTMLElement} element
 * @throws
 */
function selectAndCopyToClipboard(element) {
    if (document.selection) {
        //noinspection XHTMLIncompatabilitiesJS
        let range = document.body.createTextRange();
        range.moveToElementText(element);
        range.select();
    } else if (window.getSelection) {
        let range = document.createRange();
        range.selectNodeContents(element);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
    }

    if (!document.execCommand('copy')) {
        throw new Error("execCommand failed");
    }
}

export { selectAndCopyToClipboard }
