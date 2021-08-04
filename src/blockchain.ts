import { INoteSequence } from '@magenta/music/es6/protobuf';
import Block from './block';
import IBlockObject from './iblockobject';
import * as Constants from './constants';
import AppWorker from './worker';
import BlockManager from './blockmanager';

class Blockchain implements IBlockObject {
  private _blocks: Block[] = [];

  get blocks() {
    return this._blocks;
  }

  get length() {
    return this._blocks.length;
  }

  get first() {
    return this._blocks[0];
  }

  get last() {
    return this._blocks[this._blocks.length - 1];
  }

  private _element: HTMLElement;

  get element() {
    return this._element;
  }

  private _currentStep: number;

  get currentStep() {
    return this._currentStep;
  }

  private _muted: boolean = false;

  get muted() {
    return this._muted;
  }

  set muted(muted: boolean) {
    this._muted = muted;
    this.element.querySelector('#bc-mute-button').classList.toggle('muted', muted);
    this._blocks.forEach((b) => {
      b.muted = muted;
    });
    if (this.interpolatedBlock) {
      this.interpolatedBlock.muted = muted;
    }
  }

  private _switchToNextBlock = false;

  private _currentPlayingBlock: number = 0;

  set currentStep(currentStep: number) {
    this._blocks.forEach((b) => {
      b.currentStep = undefined;
    });
    if (this.interpolatedBlock) {
      this.interpolatedBlock.currentStep = undefined;
    }
    if (currentStep === undefined) {
      this._currentStep = undefined;
      this._currentPlayingBlock = 0;
      this._switchToNextBlock = false;
      return;
    }

    this._currentStep = currentStep % Constants.TOTAL_STEPS;
    if (this._currentPlayingBlock >= this._blocks.length) {
      this._switchToNextBlock = false;
      this._currentPlayingBlock = 0;
    } else if (this._switchToNextBlock) {
      this._switchToNextBlock = false;
      this._currentPlayingBlock = (this._currentPlayingBlock + 1) % this._blocks.length;
    } else if (this._currentStep === Constants.TOTAL_STEPS - 1) {
      this._switchToNextBlock = true;
    }

    if (this.interpolatedBlock) {
      this.interpolatedBlock.currentStep = this._currentStep;
    } else {
      this._blocks[this._currentPlayingBlock].currentStep = this._currentStep;
    }
  }

  private _interpolatedSamples: INoteSequence[];

  get interpolatedSamples() {
    return this._interpolatedSamples;
  }

  private _interpolatedBlock: Block;

  get interpolatedBlock() {
    return this._interpolatedBlock;
  }

  // after toggle note, wait for an interval before interpolating again;
  // this is the timer for the setInterval function
  private _toggleNoteInterpolationTimerId: number;

  constructor(element: HTMLElement) {
    this._element = element;
  }

  render() {
    if (this.interpolatedBlock) {
      this.interpolatedBlock.render();
    }
    this._blocks.forEach((b) => b.render());
  }

  getPitchesToPlay(): number[] {
    if (this._muted) {
      return [];
    }
    if (this._interpolatedBlock) {
      return this._interpolatedBlock.getPitchesToPlay();
    }
    return this._blocks[this._currentPlayingBlock].getPitchesToPlay();
  }

  addBlock(block: Block) {
    block.enlarged = false;
    this.blocks.push(block);
    this.muted = block.muted;
    const blocksElement = this.element.querySelector('.blocks');
    blocksElement.insertBefore(block.element, blocksElement.querySelector('#interpolate'));
    this.render();
    this.adjustZIndex();
  }

  addBlockAfter(block: Block, newBlock: Block) {
    this._blocks = this.blocks.filter((b) => b !== newBlock);

    // insert after
    this._blocks.splice(this.blocks.indexOf(block) + 1, 0, newBlock);

    const blocksElement = this.element.querySelector('.blocks');
    blocksElement.insertBefore(newBlock.element, block.element.nextSibling);
    this.render();
    this.adjustZIndex();

    if (this._interpolatedBlock === newBlock || this._blocks.length !== 2) {
      this.stopInterpolation();
    }
  }

  removeBlock(block: Block) {
    if (this._interpolatedBlock === block) {
      this.stopInterpolation();
    } else {
      this._blocks = this.blocks.filter((b) => b !== block);
      const blocksElement = this.element.querySelector('.blocks');
      if (block.element.parentElement === blocksElement) {
        blocksElement.removeChild(block.element);
      }
      this.adjustZIndex();
    }
  }

  adjustZIndex() {
    this._blocks.forEach((block, i) => {
      this._blocks[i].element.style.zIndex = `${this.length - i}`;
    });
  }

  startInterpolation(blockmanager: BlockManager) {
    if (this._interpolatedBlock) {
      this.stopInterpolation();
      return;
    }

    const interpolateElement = this.element.querySelector('#interpolate');
    interpolateElement.classList.add('open');
    const slider = this._element.querySelector('#interpolate-slider') as HTMLInputElement;
    const block = new Block(blockmanager.nextId(), blockmanager);
    block.init();
    interpolateElement.querySelector('.panel').insertBefore(block.element, slider);

    this.interpolate(block);
  }

  interpolate(block: Block) {
    block.isWorking = true;
    const slider = this._element.querySelector('#interpolate-slider') as HTMLInputElement;
    AppWorker.generateInterpolatedSamples(this.first.noteSequence, this.last.noteSequence).then(
      (interpolatedSamples) => {
        this._interpolatedBlock = block;
        this._interpolatedSamples = interpolatedSamples;
        block.noteSequence = interpolatedSamples[slider.valueAsNumber];
        block.render();
      }
    );
  }

  stopInterpolation() {
    this._interpolatedBlock = undefined;
    this._interpolatedSamples = undefined;
    const interpolateElement = this.element.querySelector('#interpolate');
    interpolateElement.classList.remove('open');
    interpolateElement.querySelectorAll('.block').forEach((block) => block.remove());
  }

  setToggleNoteInterpolationTimer() {
    if (!this._interpolatedBlock) {
      window.clearTimeout(this._toggleNoteInterpolationTimerId);
      return;
    }
    if (this._toggleNoteInterpolationTimerId) {
      window.clearTimeout(this._toggleNoteInterpolationTimerId);
    }
    this._toggleNoteInterpolationTimerId = window.setTimeout(() => {
      this.interpolate(this.interpolatedBlock);
    }, 400);
  }

  getNoteSequence() {
    const noteSequenceConcatenated = Block.defaultNoteSequence();
    this._blocks.forEach((b, i) => {
      b.noteSequence.notes.forEach((n) => {
        const note = { ...n };
        note.quantizedStartStep += i * Constants.TOTAL_STEPS;
        note.quantizedEndStep += i * Constants.TOTAL_STEPS;
        noteSequenceConcatenated.notes.push(note);
      });
    });
    noteSequenceConcatenated.totalQuantizedSteps = this._blocks.length * Constants.TOTAL_STEPS;

    return noteSequenceConcatenated;
  }

  continue(blockmanager: BlockManager) {
    // add a working empty block
    const block = new Block(blockmanager.nextId(), blockmanager);
    block.noteSequence = Block.defaultNoteSequence();
    block.init();
    block.isWorking = true;

    const noteSequenceConcatenated = this.getNoteSequence();

    this.addBlock(block);
    AppWorker.continueSequence(noteSequenceConcatenated).then((noteSequence) => {
      block.noteSequence = noteSequence;
      this.render();
    });

    if (this._interpolatedBlock) {
      this.stopInterpolation();
    }
  }
}

export default Blockchain;
