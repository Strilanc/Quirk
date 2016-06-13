# <a href="http://algorithmicassertions.com/quirk">Quirk <img src="doc/favicon.ico" alt="Icon" title="Icon" /></a>

[![Build Status](https://travis-ci.org/Strilanc/Quirk.svg?branch=master)](https://travis-ci.org/Strilanc/Quirk)
[![Code Climate](https://codeclimate.com/github/Strilanc/Quirk/badges/gpa.svg)](https://codeclimate.com/github/Strilanc/Quirk)

Quirk is a simple quantum circuit simulator, intended to help people learn about quantum computing.

If you want to quickly explore the behavior of a small quantum circuit, Quirk is the tool for you.
There's no installing or configuring or scripting: just go to **[algorithmicassertions.com/quirk](http://algorithmicassertions.com/quirk)**, drag gates onto the circuit, and the output displays will update in real time.

(If you're still trying to understand what a quantum circuit *even is*, then I recommend the video series [Quantum Computing for the Determined](https://www.youtube.com/playlist?list=PL1826E60FD05B44E4).
Quirk assumes you already know background facts like "each wire represents a qubit".)

**Defining features**:

- Runs in web browsers.
- Drag-and-drop circuit editing.
- Reacts, simulates, and animates in real time.
- Inline displays for conditional and marginal states.
- Bookmarkable circuits.
- Up to 16 qubits.

**Notable limitations** (a.k.a. future features):

- No user-defined custom gates.
- No recohering of measured qubits.

**Try it out**:

**[algorithmicassertions.com/quirk](http://algorithmicassertions.com/quirk)**

# Examples

Basic usage demo:

![Demo](/doc/README_Demo.gif)

Grover search circuit with chance and sample displays (showing that the chance of success increases):

![Grover search](/doc/README_Grover.gif)

Quantum teleportation circuit with Bloch sphere displays (showing that the qubit at the top has ended up at the bottom):

![Quantum teleportation](/doc/README_Teleportation.gif)

# Building the Code

If you want to make changes to Quirk's code, this is how you get the code and turn your changes into working html/javascript.

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

5. Build the output.

    `npm run build`

6. Confirm the output works by opening `out/quirk.html` with a web browser.

    `firefox out/quirk.html`

7. Copy `out/quirk.html` to wherever you want.
