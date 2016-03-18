Quantum Circuit Inspector
=========================

A toy for exploring the behavior of small quantum circuits.

Features:

- Drag-and-drop to place gates.
- Simulates and animates in real time.
- Up to 12 qubits.
- Bookmarkable circuits.
- Measurement, controls, and postselection.
- Conditional state displays.

Notable missing features:

- Re-cohering a measured qubit. (That would require the simulation to use density matrices, squaring the cost.)
- Eigendecomposition of mixed states. (Too expensive.)
- Showing numbers instead of figures. (It's a toy.)

Recording of the inspector simulating quantum teleportation:

![The Inspector](/README_TeleportationLoop.gif)

Building and Running
====================

This is unnecessarily complicated because the nodejs dependency ecosystem is a bit of a mess.
Create an issue on the repo if the instructions don't work for you.

The example terminal commands have been tested on a fresh Ubuntu install.

0. **[Have git and Node.js installed](https://nodejs.org/en/download/)**.

    ```sudo add-apt-repository universe
    sudo apt-get update
    sudo apt-get install --yes git npm nodejs-legacy```

    *(The first two commands are only needed for REALLY fresh installs. Still-a-Live-CD fresh. nodejs-legacy is needed
    to workaround [an issue in grunt.js](https://github.com/nodejs/node-v0.x-archive/issues/3911).)*

0. **Clone the quantum circuit inspector repository's contents**.

    `git clone https://github.com/Strilanc/Quantum-Circuit-Inspector.git`

0. **Install the project's dev dependencies**.

    ```cd Quantum-Circuit-Inspector
    npm install```

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

Older version snapshots, usable on JSFiddle
===========================================

Dec 6, 2014: http://jsfiddle.net/c4f5z73v/2/
