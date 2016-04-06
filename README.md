# Quirk

A toy for exploring and understanding the behavior of small quantum circuits.

| master | dev | demo |
|--------|-----|------|
| [![Build Status](https://travis-ci.org/Strilanc/Quantum-Circuit-Inspector.svg?branch=master)](https://travis-ci.org/Strilanc/Quantum-Circuit-Inspector)      | [![Build Status](https://travis-ci.org/Strilanc/Quantum-Circuit-Inspector.svg?branch=dev)](https://travis-ci.org/Strilanc/Quantum-Circuit-Inspector) | [algorithmicassertions.com/quirk](http://algorithmicassertions.com/quirk) |

Defining features:

- Runs in web browsers.
- Drag-and-drop circuit editing.
- Simulates and animates the effects of operations on up to 16 qubits in real time.
- Inline displays for conditional and marginal states.
- Bookmarkable circuits.

Notable limitations (a.k.a. future features):

- User-defined custom gates.
- Multi-wire gates and displays.
- Putting measured wires back into superposition. Controlled measurement.

# Try It Out

**[algorithmicassertions.com/quirk](http://algorithmicassertions.com/quirk)**

# Screenshots

Quantum teleportation circuit, with Bloch-sphere state displays inserted:

![Quantum teleportation](/README_TeleportationLoop.gif)

Quantum pigeonhole circuit, showing the toolbox and default after-circuit state displays:

![The Inspector](/README_Pigeonhole.png)

Reacting and animating smoothly while working with ten qubits:

![Ten qubits animation](/README_TenQubitsLoop.gif)

# Building

Please open an issue if these instructions don't work for you.

The example terminal commands have been tested on a fresh Ubuntu install.

1. Have [git](https://git-scm.com/) and [Node.js](https://nodejs.org/en/download/) installed.

    `sudo add-apt-repository universe`
    
    `sudo apt-get update`
    
    `sudo apt-get install --yes git npm nodejs-legacy`

2. Clone the repository.

    `git clone https://github.com/Strilanc/Quantum-Circuit-Inspector.git`

3. Install the dev dependencies.

    `cd Quantum-Circuit-Inspector`
    
    `npm install`

4. (*Optional*) Run the tests.

    `npm run test-firefox`

5. Build the output files.

    `npm run build`

6. Confirm the output works by opening `out/index.html` with a web browser.

    `firefox out/index.html`

7. Copy `out/index.html`, `out/src.min.js`, and `out/favicon.ico` to wherever you want.
