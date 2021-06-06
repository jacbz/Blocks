import { INoteSequence, NoteSequence } from '@magenta/music/es6/protobuf';
import * as Constants from './constants';
import IBlockObject from './iblockobject';
import WorkerData from './worker';

class Block implements IBlockObject {
  private _id: number;

  get id() {
    return this._id;
  }

  _noteSequence: INoteSequence;

  private _element: HTMLElement;

  get element() {
    return this._element;
  }

  set element(element: HTMLElement) {
    this._element = element;
  }

  private _currentStep: number;

  get currentStep() {
    return this._currentStep;
  }

  set currentStep(currentStep: number) {
    this._currentStep = currentStep ? currentStep % Constants.TOTAL_STEPS : currentStep;
  }

  private _muted: boolean;

  get muted() {
    return this._muted;
  }

  set muted(muted: boolean) {
    this._muted = muted;
  }

  private _isWorking: boolean;

  constructor(id: number, noteSequence?: INoteSequence) {
    this._id = id;
    const noteSeq = noteSequence || Block.defaultNoteSequence();
    this._noteSequence = noteSeq;
  }

  init() {
    this._element.setAttribute('id', this._id.toString());

    const gridElement = this._element.querySelector('.grid');
    for (let row = 0; row < Constants.DRUM_PITCHES.length; row += 1) {
      const rowElement = document.createElement('div');
      rowElement.classList.add('row');
      rowElement.setAttribute('block', this._id.toString());
      rowElement.setAttribute('row', row.toString());
      gridElement.appendChild(rowElement);

      for (let col = 0; col < Constants.TOTAL_STEPS; col += 1) {
        const cellElement = document.createElement('div');
        cellElement.classList.add('cell');

        cellElement.setAttribute('block', this._id.toString());
        cellElement.setAttribute('row', row.toString());
        cellElement.setAttribute('col', col.toString());

        if (col % 16 < 8) {
          cellElement.setAttribute('zebra', '');
        }
        rowElement.appendChild(cellElement);
      }
    }
    this.render();
  }

  render() {
    const gridElement = this._element.querySelector('.grid');

    // reset class names
    gridElement.querySelectorAll('.cell').forEach((cell) => {
      cell.className = 'cell';
    });

    // set working
    if (this._isWorking) {
      gridElement.classList.add('working');
    } else {
      gridElement.classList.remove('working');
    }

    // highlight active notes
    for (const note of this._noteSequence.notes) {
      for (let step = note.quantizedStartStep; step < note.quantizedEndStep; step += 1) {
        const rowIndex = Block.pitchToRowIndex(note.pitch);
        gridElement.querySelector(`div[row="${rowIndex}"][col="${step}"]`).classList.add('active');
      }
    }

    if (this._muted || this.currentStep === undefined) {
      return;
    }
    // highlight entire column of the current step
    for (const cell of gridElement.querySelectorAll(`div[col="${this.currentStep}"]`)) {
      cell.classList.add('current');
    }
  }

  getPitchesToPlay(): number[] {
    if (this._muted) {
      return [];
    }

    return Array.from(
      this._noteSequence.notes.filter((n) => n.quantizedStartStep === this._currentStep),
      (n) => n.pitch
    );
  }

  static defaultNoteSequence(): INoteSequence {
    return new NoteSequence({
      quantizationInfo: {
        stepsPerQuarter: Constants.STEPS_PER_QUARTER
      },
      totalQuantizedSteps: Constants.TOTAL_STEPS
    });
  }

  toggleNote(cellElement: HTMLElement) {
    const pitch = Block.rowIndexToPitch(parseInt(cellElement.getAttribute('row'), 10));
    const step = parseInt(cellElement.getAttribute('col'), 10);

    if (cellElement.classList.contains('active')) {
      this.removeNote(pitch, step);
    } else {
      this.addNote(pitch, step);
    }
    this.render();
  }

  addNote(pitch: number, step: number) {
    if (
      !this._noteSequence.notes.find(
        (n) => n.pitch === pitch && n.quantizedStartStep === step && n.quantizedEndStep === step + 1
      )
    ) {
      this._noteSequence.notes.push({
        pitch,
        quantizedStartStep: step,
        quantizedEndStep: step + 1,
        isDrum: true
      });
    }
  }

  removeNote(pitch: number, step: number) {
    this._noteSequence.notes = this._noteSequence.notes.filter(
      (n) => n.pitch !== pitch || n.quantizedStartStep !== step || n.quantizedEndStep !== step + 1
    );
  }

  // e.g. 0 -> 51
  static rowIndexToPitch(row: number) {
    return Constants.DRUM_PITCHES[Constants.DRUM_PITCHES.length - row - 1];
  }

  // invert, since lower pitch means higher index, e.g. 36 -> 6
  static pitchToRowIndex(pitch: number) {
    return Constants.DRUM_PITCHES.length - Constants.DRUM_PITCHES.indexOf(pitch) - 1;
  }

  toggleMute() {
    this._muted = !this._muted;
    this.element.querySelector('.grid').classList.toggle('muted');
  }

  doMagic(worker: Worker) {
    this._isWorking = true;
    this.render();

    worker.postMessage(
      new WorkerData({
        numberOfSamples: Constants.NUMBER_OF_BLOCKS_AT_START
      })
    );

    worker.onmessage = ({ data }: { data: WorkerData }) => {
      [this._noteSequence] = data.samples;
      this._isWorking = false;
      this.render();
    };
  }

  continue(worker: Worker) {
    this._isWorking = true;
    this.render();

    worker.postMessage(
      new WorkerData({
        sequenceToContinue: this._noteSequence
      })
    );

    worker.onmessage = ({ data }: { data: WorkerData }) => {
      this._noteSequence = data.continuedSequence;
      this._isWorking = false;
      this.render();
    };
  }
}

export default Block;
