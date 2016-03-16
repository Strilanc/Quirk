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
