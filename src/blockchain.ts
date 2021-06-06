import Block from './block';
import IBlockObject from './iblockobject';
import * as Constants from './constants';

class BlockChain implements IBlockObject {
  private _blocks: Block[];

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
    for (let i = 0; i < this._blocks.length; i += 1) {
      const block = this._blocks[i];
      block.currentStep =
        i === Math.floor(this._currentStep / Constants.TOTAL_STEPS)
          ? this.currentStep % Constants.TOTAL_STEPS
          : null;
    }
  }

  constructor(startingBlock: Block, element: HTMLElement) {
    this._blocks = [startingBlock];
    this._element = element;
  }

  init() {
    const blocksElement = this.element.querySelector('.blocks');
    this._blocks.forEach((b) => blocksElement.appendChild(b.element));
  }

  render() {
    this._blocks.forEach((b) => b.render());
  }

  getPitchesToPlay(): number[] {
    if (this._muted) {
      return [];
    }
    const playingBlock = Math.floor(this._currentStep / Constants.TOTAL_STEPS);
    return this._blocks[playingBlock].getPitchesToPlay();
  }

  addBlock(block: Block) {
    this.blocks.push(block);
    const blocksElement = this.element.querySelector('.blocks');
    blocksElement.appendChild(block.element);
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
  }

  removeBlock(block: Block) {
    this._blocks = this.blocks.filter((b) => b !== block);
    const blocksElement = this.element.querySelector('.blocks');
    blocksElement.removeChild(block.element);
    this.adjustZIndex();
  }

  toggleMute() {
    this._muted = !this.muted;
    for (const block of this._blocks) {
      block.muted = !block.muted;
      block.element.querySelector('.grid').classList.toggle('muted');
    }
  }

  adjustZIndex() {
    for (let i = 0; i < this.length; i += 1) {
      this._blocks[i].element.style.zIndex = `${this.length - i}`;
    }
  }
}

export default BlockChain;
