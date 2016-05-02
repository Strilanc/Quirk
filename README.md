# <a href="http://algorithmicassertions.com/quirk">Quirk <img src="res/favicon.ico" alt="Icon" title="Icon" /></a>

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

# Screenshots and Example Circuits

Quantum teleportation circuit, with Bloch-sphere state displays inserted:

![Quantum teleportation](/README_TeleportationLoop.gif)

Quantum pigeonhole circuit, showing the toolbox and default after-circuit state displays:

![The Inspector](/README_Pigeonhole.png)

Reacting and animating smoothly while working with ten qubits:

![Ten qubits animation](/README_TenQubitsLoop.gif)

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

5. Build the output files.

    `npm run build`

6. Confirm the output works by opening `out/index.html` with a web browser.

    `firefox out/index.html`

7. Copy `out/index.html`, `out/src.min.js`, and `out/favicon.ico` to wherever you want.
