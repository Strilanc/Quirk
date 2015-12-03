/**
 * A simple linear revision history tracker, for supporting undo and redo functionality.
 */
export default class Revision {
    constructor(state) {
        this.history = [state];
        this.index = 0;
        this.isOffHistory = false;
    }

    startingUpdate() {
        this.isOffHistory = true;
    }

    update(newCheckpoint) {
        if (newCheckpoint === this.history[this.index]) {
            return;
        }
        this.index += 1;
        this.history.splice(this.index, this.history.length - this.index);
        this.history.push(newCheckpoint);
        this.isOffHistory = false;
    }

    cancel() {
        this.isOffHistory = false;
        return this.history[this.index];
    }

    undo() {
        if (this.index > 0 && !this.isOffHistory) {
            this.index -= 1;
        }
        this.isOffHistory = false;
        return this.history[this.index];
    }

    redo() {
        if (this.index + 1 < this.history.length) {
            this.index += 1;
        }
        this.isOffHistory = false;
        return this.history[this.index];
    }
}
