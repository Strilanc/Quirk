Quantum Circuit Inspector
=========================

A toy for exploring the behavior of small quantum circuits.

Features:

- Drag-and-drop gates and state displays into and out of the circuit.
- Updates and responds to changes in real time (no "compute now" button).
- Bookmarkable circuits.
- Time-dependent gates.
- Scales to 12 qubits by performing computation on the GPU.
- Gate tooltips showing effects as both a matrix and a rotation.
- Measurement.
- Postselection.
- The circuits look decent.

Notable missing features:

- Re-cohering a measured qubit. (That would require the simulation to use density matrices, squaring the cost.)
- Eigendecomposition of mixed states. (Too expensive.)
- Showing numbers instead of diagrams. (It's a toy.)

Screenshot of the inspector showing a quantum teleportation circuit:

![The Inspector](/README_TeleportationLoop.gif)

Snapshots usable on JSFiddle
============================

Dec 6, 2014: http://jsfiddle.net/c4f5z73v/2/

Building and Running
====================

This is unnecessarily complicated because the nodejs dependency ecosystem is such a mess.
Create an issue on the repo if the instructions don't work for you.
The example terminal commands should work on a fresh Ubuntu install.

0. [Have Node.js installed](https://nodejs.org/en/download/).

    `sudo apt-get install npm nodejs nodejs-legacy`

0. Have [grunt.js's command line interface](http://gruntjs.com/getting-started) installed globally.

    `sudo npm install -g grunt-cli`

0. Clone the quantum circuit inspector repository's contents.

    `git clone git@github.com:Strilanc/Quantum-Circuit-Inspector.git`

0. Install the node dev dependencies.

    `cd Quantum-Circuit-Inspector`

    `npm install`

    *(If you're on windows, you'll need to work around
      [this bug in grunt-traceur](https://github.com/aaronfrost/grunt-traceur/issues/66) by going to line 49 of
      `node_modules/grunt-traceur/tasks/traceur.js` and replacing the 'path.sep' with '"/"'. Seriously.)

0. Build the output files.

    `grunt build_src`

0. Confirm the output works by opening `out/index.html` with a web browser.

    `firefox out/index.html`

0. Copy `out/index.html` and `out/all_src.js` to wherever you want.

You can also try to run the tests via `grunt test`, but you'll need both firefox and chrome installed.
Even then, it might not work.
[Karma](https://karma-runner.github.io/0.13/index.html) is stupidly finicky.
