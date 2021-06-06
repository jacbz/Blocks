import { INoteSequence } from '@magenta/music/es6/protobuf';
import Block from './block';
import IBlockObject from './iblockobject';
import * as Constants from './constants';
import AppWorker from './worker';
import BlockManager from './blockmanager';

class BlockChain implements IBlockObject {
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

  private _muted: boolean;

  get muted() {
    return this._muted;
  }

  set muted(muted: boolean) {
    this._muted = muted;
  }

  set currentStep(currentStep: number) {
    this._currentStep = currentStep
      ? currentStep % (this.blocks.length * Constants.TOTAL_STEPS)
      : currentStep;
    if (this._interpolatedBlock) {
      this._interpolatedBlock.currentStep = this.currentStep % Constants.TOTAL_STEPS;
      this.blocks.forEach((b) => {
        b.currentStep = null;
      });
    } else {
      for (let i = 0; i < this._blocks.length; i += 1) {
        const block = this._blocks[i];
        block.currentStep =
          i === Math.floor(this._currentStep / Constants.TOTAL_STEPS)
            ? this.currentStep % Constants.TOTAL_STEPS
            : null;
      }
    }
  }

  private _interpolatedSamples: INoteSequence[];

  private _interpolatedBlock: Block;

  get interpolatedBlock() {
    return this._interpolatedBlock;
  }

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
    if (this._interpolatedBlock) {
      return this._interpolatedBlock.getPitchesToPlay();
    }
    if (this._muted) {
      return [];
    }
    const playingBlock = Math.floor(this._currentStep / Constants.TOTAL_STEPS);
    return this._blocks[playingBlock].getPitchesToPlay();
  }

  addBlock(block: Block) {
    this.blocks.push(block);
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

    if (this._interpolatedBlock === newBlock) {
      this.stopInterpolate();
    }
  }

  removeBlock(block: Block) {
    if (this._interpolatedBlock === block) {
      this.stopInterpolate();
    } else {
      this._blocks = this.blocks.filter((b) => b !== block);
      const blocksElement = this.element.querySelector('.blocks');
      blocksElement.removeChild(block.element);
      this.adjustZIndex();
    }
  }

  toggleMute() {
    this.element.querySelector('#bc-mute-button').classList.toggle('muted');
    this._muted = !this.muted;
    for (const block of this._blocks) {
      block.muted = this._muted;
      block.element.querySelector('.grid').classList.toggle('muted', this._muted);
    }
  }

  adjustZIndex() {
    for (let i = 0; i < this.length; i += 1) {
      this._blocks[i].element.style.zIndex = `${this.length - i}`;
    }
  }

  interpolate(blockmanager: BlockManager) {
    if (this._interpolatedBlock) {
      this.stopInterpolate();
      return;
    }

    const interpolateElement = this.element.querySelector('#interpolate');
    interpolateElement.classList.add('open');
    if (!this.muted) {
      this.toggleMute();
    }
    const slider = this._element.querySelector('#interpolate-slider') as HTMLInputElement;
    slider.setAttribute('max', `${Constants.INTERPOLATION_LENGTH - 1}`);
    slider.addEventListener('input', () => {
      block.noteSequence = this._interpolatedSamples[slider.valueAsNumber];
      block.render();
    });
    slider.valueAsNumber = Math.floor(Constants.INTERPOLATION_LENGTH / 2);

    const block = new Block(blockmanager.nextId(), blockmanager);
    block.init();
    interpolateElement.querySelector('.panel').insertBefore(block.element, slider);
    this._interpolatedBlock = block;

    AppWorker.generateInterpolatedSamples(this.first.noteSequence, this.last.noteSequence).then(
      (interpolatedSamples) => {
        this._interpolatedSamples = interpolatedSamples;
        block.noteSequence = interpolatedSamples[Math.floor(interpolatedSamples.length / 2)];
        block.render();
      }
    );
  }

  stopInterpolate() {
    this._interpolatedBlock = undefined;
    this._interpolatedSamples = undefined;
    const interpolateElement = this.element.querySelector('#interpolate');
    interpolateElement.classList.remove('open');
    interpolateElement.querySelectorAll('.block').forEach((block) => block.remove());
    if (this._muted) {
      this.toggleMute();
    }
  }
}

export default BlockChain;
