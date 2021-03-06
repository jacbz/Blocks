import { INoteSequence, NoteSequence } from '@magenta/music/es6/protobuf';
import BlockManager from './blockmanager';
import * as Constants from './constants';
import IBlockObject from './iblockobject';

class Block implements IBlockObject {
  private _id: number;

  get id() {
    return this._id;
  }

  private _name = '';

  get name() {
    return this._name;
  }

  set name(name: string) {
    this._name = name;
  }

  private _noteSequence: INoteSequence;

  get noteSequence() {
    return this._noteSequence;
  }

  set noteSequence(noteSequence: INoteSequence) {
    this._noteSequence = noteSequence;
    this.isWorking = false;
  }

  private _element: HTMLElement;

  get element() {
    return this._element;
  }

  private _currentStep: number;

  get currentStep() {
    return this._currentStep;
  }

  set currentStep(currentStep: number) {
    this._currentStep = currentStep ? currentStep % Constants.TOTAL_STEPS : currentStep;
  }

  private _enlarged: boolean = false;

  get enlarged() {
    return this._enlarged;
  }

  set enlarged(enlarged: boolean) {
    this._enlarged = enlarged;
    this.element.classList.toggle('enlarged', enlarged);
  }

  private _muted: boolean = false;

  get muted() {
    return this._muted;
  }

  set muted(muted: boolean) {
    this._muted = muted;
    this.element.querySelector('#mute-button').classList.toggle('muted', muted);
    this.element.querySelector('.grid').classList.toggle('muted', muted);
  }

  private _isWorking: boolean = true;

  set isWorking(isWorking: boolean) {
    this._isWorking = isWorking;
    this._element.querySelector('.grid').classList.toggle('working', isWorking);
  }

  constructor(id: number, blockmanager: BlockManager) {
    this._id = id;
    this._element = blockmanager.initBlockDom(this);
  }

  getNoteSequence() {
    return this._noteSequence;
  }

  clone(blockManager: BlockManager) {
    const block = new Block(blockManager.nextId(), blockManager);
    // deep copy
    const noteSequence = { ...this._noteSequence };
    noteSequence.notes = [...this._noteSequence.notes];
    block.noteSequence = noteSequence;
    block.init();
    return block;
  }

  setPosition(x: number, y: number) {
    this._element.style.left = x ? `${x}px` : null;
    this._element.style.top = y ? `${y}px` : null;
  }

  init() {
    this._element.setAttribute('id', this._id.toString());
    this._element.querySelector('.block-name').innerHTML = this._name;

    const gridElement = this._element.querySelector('.grid');
    gridElement.querySelectorAll('.row').forEach((row) => row.remove());

    for (let row = 0; row < Constants.DRUM_PITCHES.length; row += 1) {
      const rowElement = document.createElement('div');
      rowElement.classList.add('row');
      rowElement.setAttribute('block', this._id.toString());
      rowElement.setAttribute('row', row.toString());
      gridElement.appendChild(rowElement);

      for (let col = 0; col < Constants.TOTAL_STEPS; col += 1) {
        const cellElement = document.createElement('div');
        cellElement.classList.add('cell');
        cellElement.title = Constants.DRUM_NAMES[Constants.DRUM_PITCHES.length - row - 1];

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

    // highlight active notes
    if (!this._noteSequence) {
      return;
    }
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
      totalQuantizedSteps: Constants.TOTAL_STEPS,
      notes: []
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
    if (step !== 0 && !step) {
      return;
    }
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
}

export default Block;
