# Quirk

A toy for exploring and understanding the behavior of small quantum circuits.

| master | dev |
|--------|-----|
| [![Build Status](https://travis-ci.org/Strilanc/Quantum-Circuit-Inspector.svg?branch=master)](https://travis-ci.org/Strilanc/Quantum-Circuit-Inspector)      | [![Build Status](https://travis-ci.org/Strilanc/Quantum-Circuit-Inspector.svg?branch=dev)](https://travis-ci.org/Strilanc/Quantum-Circuit-Inspector) |

Defining features:

- Runs in web browsers.
- Drag-and-drop circuit editing.
- Simulates and animates the effects of operations on up to 12 qubits in real time.
- Inline displays for conditional and marginal states.
- Bookmarkable circuits.

Recording of the inspector simulating quantum teleportation:

![The Inspector](/README_TeleportationLoop.gif)

Building and Running
====================

Please open an issue if these instructions don't work for you.
The example terminal commands have been tested on a fresh Ubuntu install.

0. **[Have git and Node.js installed](https://nodejs.org/en/download/)**.

    `sudo add-apt-repository universe`
    
    `sudo apt-get update`
    
    `sudo apt-get install --yes git npm nodejs-legacy`

    *(The first two commands are only needed for REALLY fresh installs. Still-a-Live-CD fresh. nodejs-legacy is needed
    to workaround [an issue in grunt.js](https://github.com/nodejs/node-v0.x-archive/issues/3911).)*

0. **Clone the quantum circuit inspector repository's contents**.

    `git clone https://github.com/Strilanc/Quantum-Circuit-Inspector.git`

0. **Install the project's dev dependencies**.

    `cd Quantum-Circuit-Inspector`
    
    `npm install`

    *(If you're on Windows, you'll need to work around
      [this bug in grunt-traceur](https://github.com/aaronfrost/grunt-traceur/issues/66) by going to line 49 of
      `node_modules/grunt-traceur/tasks/traceur.js` and replacing the 'path.sep' with '"/"'. I wish I was joking.)*

0. **(*Optional*) Run the tests**.

    `npm run test-firefox`

0. **Build the output files**.

    `npm run build`

0. **Confirm the output works by opening `out/index.html` with a web browser**.

    `firefox out/index.html`

0. **Copy `out/index.html` and `out/all_src.js` to wherever you want**.
