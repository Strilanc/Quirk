import {ObservableValue} from "src/base/Obs.js"

const menuIsVisible = new ObservableValue(true);
const obsMenuIsShowing = menuIsVisible.observable().whenDifferent();
let closeMenu = () => menuIsVisible.set(false);

const groverLink = {
    "cols":[
        ["X","X","X","X","X"],
        ["H","H","H","H","H"],
        ["Chance5"],
        ["~vn6c"],
        ["⊖","⊖","⊖","⊖","X"],
        ["Chance5"],
        ["~vn6c"],
        ["⊖","⊖","⊖","⊖","X"],
        ["Chance5"],
        ["~vn6c"],
        ["⊖","⊖","⊖","⊖","X"],
        ["Chance5"],
        ["~vn6c"],
        ["⊖","⊖","⊖","⊖","X"],
        ["Chance5"]
    ],
    "gates":[{"id":"~vn6c","name":"Oracle","circuit":{"cols":[["Z","•","◦","•","•"]]}}]
};
const teleportLink = {"cols":[
    [1,"H"],
    [1,"•",1,1,"X"],
    ["…","…",1,1,"…"],
    ["…","…",1,1,"…"],
    ["e^-iYt"],
    ["X^t"],
    ["Bloch"],
    ["•","X"],
    ["H"],
    ["Measure","Measure"],
    [1,"•",1,1,"X"],
    ["•",1,1,1,"Z"],
    [1,1,1,1,"Bloch"]]
};
const erasureLink = {"cols":[
    [1,"H"],
    [1,"•",1,1,"X"],
    [1,1,"QFT7"],
    [1,1,"Measure","Measure","Measure","Measure","Measure","Measure","Measure"],
    ["…","…","Chance7"],
    ["…","…"],
    ["…","…"],
    ["…","…"],
    ["H"],
    ["Measure"],
    ["•","X^½"],
    [1,"Measure"],
    ["◦","◦","Chance7"],
    ["◦","•","Chance7"],
    ["•","◦","Chance7"],
    ["•","•","Chance7"]
]};

/**
 * @param {!Revision} revision
 * @param {!Observable.<!boolean>} obsIsAnyOverlayShowing
 */
function initMenu(revision, obsIsAnyOverlayShowing) {
    // Show/hide menu overlay.
    (() => {
        const menuButton = /** @type {!HTMLButtonElement} */ document.getElementById('menu-button');
        const closeMenuButton = /** @type {!HTMLButtonElement} */ document.getElementById('close-menu-button');
        const menuOverlay = /** @type {!HTMLDivElement} */ document.getElementById('menu-overlay');
        const menutDiv = /** @type {HTMLDivElement} */ document.getElementById('menu-div');
        menuButton.addEventListener('click', () => menuIsVisible.set(true));
        obsIsAnyOverlayShowing.subscribe(e => { menuButton.disabled = e; });
        menuOverlay.addEventListener('click', () => menuIsVisible.set(false));
        closeMenuButton.addEventListener('click', () => menuIsVisible.set(false));
        document.addEventListener('keydown', e => {
            const ESC_KEY = 27;
            if (e.keyCode === ESC_KEY) {
                menuIsVisible.set(false)
            }
        });
        obsMenuIsShowing.subscribe(showing => {
            menutDiv.style.display = showing ? 'block' : 'none';
            if (showing) {
                document.getElementById('export-link-copy-button').focus();
            }
        });
    })();

    const groverAnchor = /** @type {!HTMLAnchorElement} */ document.getElementById('example-anchor-grover');
    const teleportAnchor = /** @type {!HTMLAnchorElement} */ document.getElementById('example-anchor-teleport');
    const erasureAnchor = /** @type {!HTMLAnchorElement} */ document.getElementById('example-anchor-delayed-erasure');

    for (let [a, t] of [[groverAnchor, groverLink],
                        [teleportAnchor, teleportLink],
                        [erasureAnchor, erasureLink]]) {
        let text = JSON.stringify(t);
        a.href = "#circuit=" + text;
        a.onclick = ev => {
            // Urgh, this is terrible but it will have to do.
            if (ev.shiftKey || ev.ctrlKey || ev.altKey || ev.which !== 1) {
                return undefined;
            }

            revision.commit(text);
            menuIsVisible.set(false);
            return false;
        };
    }
}

export {initMenu, obsMenuIsShowing, closeMenu}
