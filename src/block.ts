import { INoteSequence, NoteSequence, MusicVAE, MusicRNN } from '@magenta/music/es6';
import * as Constants from './constants';
import DrumKit from './drumkit';

class Block {
  private _id: number;

  get id() {
    return this._id;
  }

  private _noteSequence: INoteSequence;

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
    this._currentStep = currentStep;
  }

  private _muted: boolean;

  constructor(id: number, noteSequence?: INoteSequence) {
    this._id = id;
    const noteSeq = noteSequence || Block.defaultNoteSequence();
    this._noteSequence = noteSeq;
    console.log(this._noteSequence);
  }

  static defaultNoteSequence(): INoteSequence {
    return new NoteSequence({
      quantizationInfo: {
        stepsPerQuarter: Constants.STEPS_PER_QUARTER
      },
      totalQuantizedSteps: Constants.TOTAL_STEPS
    });
  }

  initGrid() {
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
        rowElement.appendChild(cellElement);
      }
    }
    this.updateGrid();
  }

  updateGrid() {
    // reset class names
    this._element.querySelectorAll('.cell').forEach((cell) => {
      cell.className = 'cell';
    });

    const gridElement = this._element.querySelector('.grid');
    for (const note of this._noteSequence.notes) {
      for (let step = note.quantizedStartStep; step < note.quantizedEndStep; step += 1) {
        const rowIndex = Block.pitchToRowIndex(note.pitch);
        gridElement.children[rowIndex].children[step].classList.add('active');
      }
    }

    if (this._muted) {
      return;
    }
    if (this.currentStep === undefined) {
      return;
    }
    for (let row = 0; row < Constants.DRUM_PITCHES.length; row += 1) {
      // console.log(`row ${row}, step ${step}`);
      (
        gridElement.querySelectorAll('.row')[row].querySelectorAll('.cell')[
          this.currentStep
        ] as HTMLElement
      ).classList.add('current');
    }
  }

  playStep(step: number, time: number) {
    if (this._muted) {
      return;
    }
    const drumkit = DrumKit.getInstance();

    for (const note of this._noteSequence.notes.filter((n) => n.quantizedStartStep === step)) {
      const velocity = Object.prototype.hasOwnProperty.call(note, 'velocity')
        ? note.velocity / Constants.MAX_MIDI_VELOCITY
        : undefined;
      drumkit.playNote(note.pitch, time, velocity);
    }
  }

  toggleNote(cellElement: HTMLElement) {
    const pitch = Block.rowIndexToPitch(parseInt(cellElement.getAttribute('row'), 10));
    const step = parseInt(cellElement.getAttribute('col'), 10);

    if (cellElement.classList.contains('active')) {
      this.removeNote(pitch, step);
    } else {
      this.addNote(pitch, step);
    }
    this.updateGrid();
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

  doMagic(drumsVae: MusicVAE, drumsRnn: MusicRNN) {
    // if notes are empty, create a new block
    if (this._noteSequence.notes.length === 0) {
      drumsVae
        .sample(Constants.NUMBER_OF_BLOCKS_AT_START, Constants.TEMPERATURE)
        .then((samples) => {
          [this._noteSequence] = samples;
          this.updateGrid();
        });
      return;
    }
    // otherwise: continue current
    drumsRnn
      .continueSequence(this._noteSequence, Constants.RNN_STEPS, Constants.TEMPERATURE)
      .then((continuedSequence) => {
        this._noteSequence = continuedSequence;
        this.updateGrid();
      });
  }
}

export default Block;
