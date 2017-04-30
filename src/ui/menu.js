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
const teleportLink = {
    "cols":[
        [1,"H"],
        [1,"•",1,1,"X"],
        ["…","…",1,1,"…"],
        ["…","…",1,1,"…"],
        ["~87lj"],
        ["Bloch"],
        ["•","X"],
        ["H"],
        ["Measure","Measure"],
        [1,"•",1,1,"X"],
        ["•",1,1,1,"Z"],
        [1,1,1,1,"Bloch"],
        [1,1,1,1,"~f7c0"]
    ],
    "gates":[
        {"id":"~87lj","name":"message","circuit":{"cols":[["e^-iYt"],["X^t"]]}},
        {"id":"~f7c0","name":"received","matrix":"{{1,0},{0,1}}"}
    ]
};
const eraserLink = {"cols":[
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
const chshTestLink = {
    "cols": [
        ["H"],
        ["◦",1,1,1,"X"],
        ["X^-¼"],
        ["…","…","…","…","…"],
        ["~da85","~5s2n",1,"~5s2n","~ahov"],
        [1,"H",1,"H"],
        [1,"Measure",1,"Measure"],
        ["X^½","•"],
        [1,1,1,"•","X^½"],
        ["Measure",1,1,1,"Measure"],
        ["…","…","…","…","…"],
        [1,"•","X","•"],
        ["•",1,"X"],
        [1,1,"X",1,"•"],
        [1,1,"Chance"],
        [1,1,"~q6e"]
    ],
    "gates": [
        {"id":"~da85","name":"Alice","matrix":"{{1,0},{0,1}}"},
        {"id":"~ahov","name":"Bob","matrix":"{{1,0},{0,1}}"},
        {"id":"~5s2n","name":"Referee","matrix":"{{1,0},{0,1}}"},
        {"id":"~q6e","name":"Win?","matrix":"{{1,0},{0,1}}"}
    ]
};
const additionLink = {"cols":[
    ["Counting5",1,1,1,1,1,1,1,1,"X"],
    ["Chance5",1,1,1,1,"Measure","Chance5"],
    ["…","…","…","…","…","…","…","…","…","…","…"],
    ["X","X","X","X","•",1,1,"X","X","X"],
    ["Swap",1,1,1,"Swap",1,"•"],
    [1,1,1,1,"•",1,1,"X"],
    [1,"Swap",1,1,"Swap",1,1,"•"],
    [1,1,1,1,"•",1,1,1,"X"],
    [1,1,"Swap",1,"Swap",1,1,1,"•"],
    [1,1,1,1,"•",1,1,1,1,"X"],
    [1,1,1,"Swap","Swap",1,1,1,1,"•"],
    [1,1,1,1,"•",1,1,1,1,1,"X"],
    [1,1,1,"Swap","Swap",1,1,1,1,"•"],
    [1,1,"Swap",1,"Swap",1,1,1,"•"],
    [1,"Swap",1,1,"Swap",1,1,"•"],
    ["Swap",1,1,1,"Swap",1,"•"],
    ["X","X","X","X","•"],
    [1,1,1,"•",1,1,1,1,1,"X"],
    [1,1,"•",1,1,1,1,1,"X"],
    [1,"•",1,1,1,1,1,"X"],
    ["•",1,1,1,1,1,"X"],
    ["…","…","…","…","…","…","…","…","…","…","…"],
    ["Chance5",1,1,1,1,1,"Chance5"]
]};
const qftLink = {"cols":[
    ["Counting8"],
    ["Chance8"],
    ["…","…","…","…","…","…","…","…"],
    ["Swap",1,1,1,1,1,1,"Swap"],
    [1,"Swap",1,1,1,1,"Swap"],
    [1,1,"Swap",1,1,"Swap"],
    [1,1,1,"Swap","Swap"],
    ["H"],
    ["Z^½","•"],
    [1,"H"],
    ["Z^¼","Z^½","•"],
    [1,1,"H"],
    ["Z^⅛","Z^¼","Z^½","•"],
    [1,1,1,"H"],
    ["Z^⅟₁₆","Z^⅛","Z^¼","Z^½","•"],
    [1,1,1,1,"H"],
    ["Z^⅟₃₂","Z^⅟₁₆","Z^⅛","Z^¼","Z^½","•"],
    [1,1,1,1,1,"H"],
    ["Z^⅟₆₄","Z^⅟₃₂","Z^⅟₁₆","Z^⅛","Z^¼","Z^½","•"],
    [1,1,1,1,1,1,"H"],
    ["Z^⅟₁₂₈","Z^⅟₆₄","Z^⅟₃₂","Z^⅟₁₆","Z^⅛","Z^¼","Z^½","•"],
    [1,1,1,1,1,1,1,"H"]
]};
const superdenseCodingLink = {"cols":[
    [1,1,"H"],
    [1,1,"•",1,1,1,"X"],
    ["…","…","…","…","…","…","…"],
    ["Counting2"],
    ["Measure","Measure"],
    ["Chance","Chance"],
    [1,"•","X"],
    ["•",1,"Z"],
    [1,1,"Swap",1,1,"Swap"],
    [1,1,1,1,1,"•","X"],
    [1,1,1,1,1,"H"],
    [1,1,1,1,1,"Measure","Measure"],
    [1,1,1,1,1,"Chance","Chance"]
]};
const symmetryBreakingLink = {
    "cols":[
        ["~tpqg",1,"~r2ku"],
        ["…","…","…","…"],
        ["H"],
        [1,1,"H"],
        ["•","X"],
        [1,1,"•","X"],
        [1,"Swap",1,"Swap"],
        ["•","X"],
        [1,1,"•","X"],
        ["X^½","◦"],
        [1,1,"X^½","◦"],
        [1,"X^½"],
        [1,1,1,"X^½"],
        ["Measure","Measure","Measure","Measure"],
        [1,"~57au"],
        ["•",1,"Chance"],
        [1,"•",1,"Chance"],
        ["◦",1,"Chance"],
        [1,"◦",1,"Chance"]
    ],
    "gates": [
        {"id":"~tpqg","name":"Alice^1","matrix":"{{1,0,0,0},{0,1,0,0},{0,0,1,0},{0,0,0,1}}"},
        {"id":"~r2ku","name":"Alice^2","matrix":"{{1,0,0,0},{0,1,0,0},{0,0,1,0},{0,0,0,1}}"},
        {"id":"~57au","name":"disagree","matrix":"{{1,0,0,0},{0,1,0,0},{0,0,1,0},{0,0,0,1}}"}
    ]
};
const shorLink = {
    "cols":[
        [1,1,1,1,1,1,1,1,1,1,"~mdaf",1,1,1,"~h1nm"],
        [1,1,1,1,1,1,1,1,1,1,{"id":"setR","arg":55},1,1,1,{"id":"setB","arg":26}],
        [],
        ["H","H","H","H","H","H","H","H","H","H","X"],
        ["inputA10",1,1,1,1,1,1,1,1,1,"*BToAmodR6"],
        ["QFT†10"],
        [1,1,1,1,"~mjoi",1,1,1,1,1,1,1,"~mjoi"],
        ["Chance10",1,1,1,1,1,1,1,1,1,"Chance6"],
        [1,1,1,1,"~a6uq"],
        ["Sample10"]
    ],
    "gates":[
        {"id":"~h1nm","name":"guess:","matrix":"{{1,0,0,0},{0,1,0,0},{0,0,1,0},{0,0,0,1}}"},
        {"id":"~mdaf","name":"input:","matrix":"{{1,0,0,0},{0,1,0,0},{0,0,1,0},{0,0,0,1}}"},
        {"id":"~a6uq","name":"samples:","matrix":"{{1,0,0,0},{0,1,0,0},{0,0,1,0},{0,0,0,1}}"},
        {"id":"~mjoi","name":"state:","matrix":"{{1,0,0,0},{0,1,0,0},{0,0,1,0},{0,0,0,1}}"}
    ]
};

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
    const eraserAnchor = /** @type {!HTMLAnchorElement} */ document.getElementById('example-anchor-delayed-eraser');
    const additionAnchor = /** @type {!HTMLAnchorElement} */ document.getElementById('example-addition');
    const superdenseCodeAnchor = /** @type {!HTMLAnchorElement} */ document.getElementById('example-superdense-coding');
    const symmetryBreakAnchor = /** @type {!HTMLAnchorElement} */ document.getElementById('example-symmetry-break');
    const chshTestAnchor = /** @type {!HTMLAnchorElement} */ document.getElementById('example-chsh-test');
    const qftAnchor = /** @type {!HTMLAnchorElement} */ document.getElementById('example-qft');
    const shorAnchor = /** @type {!HTMLAnchorElement} */ document.getElementById('example-anchor-shor');

    for (let [a, t] of [[groverAnchor, groverLink],
                        [shorAnchor, shorLink],
                        [teleportAnchor, teleportLink],
                        [eraserAnchor, eraserLink],
                        [additionAnchor, additionLink],
                        [superdenseCodeAnchor, superdenseCodingLink],
                        [symmetryBreakAnchor, symmetryBreakingLink],
                        [chshTestAnchor, chshTestLink],
                        [qftAnchor, qftLink]]) {
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
