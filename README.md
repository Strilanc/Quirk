Quantum Circuit Inspector
=========================

A visualization and experimentation tool for small quantum circuits. Includes common single-qubit gates, but not many multi-qubit gates (e.g. swap and fourier transform). Supports controlled and time-varying operations. Not much support for customization yet.

For example, here is a screenshot of a quantum teleportation circuit. The qubit in A1, which is entangled with B2, is teleported to B1:

![The Inspector](http://i.imgur.com/t1aIye1.png)

The bottom left thing is a representation of the highlighted operation as a matrix. Next to it is a representation of the state after the highlighted operation (each cell is one of the classical states, and the contents represent the amplitude). The bottom right thing is a representation of the final state. Within the circuit, the gates showing percentages are "peek" gates. They are showing the probability of the wire being on (*if* it was measured at that point), both given that the controls are satisfied and in-addition-to the controls being satisfied.

JSFiddle Instance
=================

(Up to date as of Dec 6. Basically just all of the javascript concatenated together.)

http://jsfiddle.net/c4f5z73v/1/

