# Quirk

A drag-and-drop quantum circuit simulator.
A toy for exploring and understanding small quantum circuits.

| master | dev | demo |
|--------|-----|------|
| [![Build Status](https://travis-ci.org/Strilanc/Quirk.svg?branch=master)](https://travis-ci.org/Strilanc/Quirk)      | [![Build Status](https://travis-ci.org/Strilanc/Quirk.svg?branch=dev)](https://travis-ci.org/Strilanc/Quirk) | [algorithmicassertions.com/quirk](http://algorithmicassertions.com/quirk) |

Defining features:

- Runs in web browsers.
- Drag-and-drop circuit editing.
- Reacts, simulates, and animates in real time.
- Inline displays for conditional and marginal states.
- Bookmarkable circuits.
- Up to 16 qubits.

Notable limitations (a.k.a. future features):

- User-defined custom gates.
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

    `git clone https://github.com/Strilanc/Quirk.git`

3. Install the dev dependencies.

    `cd Quirk`
    
    `npm install`

4. (*Optional*) Run the tests.

    `npm run test-firefox`

5. Build the output files.

    `npm run build`

6. Confirm the output works by opening `out/index.html` with a web browser.

    `firefox out/index.html`

7. Copy `out/index.html`, `out/src.min.js`, and `out/favicon.ico` to wherever you want.
