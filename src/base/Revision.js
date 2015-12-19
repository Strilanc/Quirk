/**
 * A simple linear revision history tracker, for supporting undo and redo functionality.
 */
export default class Revision {
    constructor(state) {
        this.history = [state];
        this.index = 0;
        this.isWorkingOnCommit = false;
    }

    startedWorkingOnCommit() {
        this.isWorkingOnCommit = true;
    }

    cancelCommitBeingWorkedOn() {
        this.isWorkingOnCommit = false;
        return this.history[this.index];
    }

    commit(newCheckpoint) {
        this.isWorkingOnCommit = false;
        if (newCheckpoint === this.history[this.index]) {
            return;
        }
        this.index += 1;
        this.history.splice(this.index, this.history.length - this.index);
        this.history.push(newCheckpoint);
    }

    undo() {
        if (this.index > 0 && !this.isWorkingOnCommit) {
            this.index -= 1;
        }
        this.isWorkingOnCommit = false;
        return this.history[this.index];
    }

    redo() {
        if (this.index + 1 < this.history.length) {
            this.index += 1;
        }
        this.isWorkingOnCommit = false;
        return this.history[this.index];
    }
}
