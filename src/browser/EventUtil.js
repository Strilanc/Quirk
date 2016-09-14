import { Observable } from "src/base/Obs.js"

/**
 * @param {!HTMLInputElement} textBox
 * @returns {!Observable.<!String>}
 */
function textEditObservable(textBox) {
    return Observable.of(
        Observable.elementEvent(textBox, 'change'),
        Observable.elementEvent(textBox, 'keyup'),
        Observable.elementEvent(textBox, 'click'),
        Observable.elementEvent(textBox, 'paste'),
        Observable.elementEvent(textBox, 'input')
    ).flatten().map(e => textBox.value).whenDifferent();
}

export { textEditObservable };
