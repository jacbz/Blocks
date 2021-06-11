import { INoteSequence } from '@magenta/music/es6/protobuf';
import * as Tone from 'tone';
import interact from 'interactjs';
import Block from './block';
import Blockchain from './blockchain';
import IBlockObject from './iblockobject';
import * as Constants from './constants';
import { PlayerDrumKit, SynthDrumKit, IDrumKit } from './drumkit';

class BlockManager {
  private _synthDrumKit = new SynthDrumKit();

  private _playerDrumKit = new PlayerDrumKit();

  private _drumkit: IDrumKit = this._synthDrumKit;

  get drumkit() {
    return this._drumkit;
  }

  private _isPlaying = false;

  get isPlaying() {
    return this._isPlaying;
  }

  set isPlaying(isPlaying: boolean) {
    this._isPlaying = isPlaying;
  }

  private _currentStep: number;

  private _containerElement: HTMLDivElement;

  private _blockObjects: IBlockObject[] = [];

  private _presetBlocks: Block[] = [];

  private _hoveredCellElement: HTMLElement;

  private _highestZIndex = 0;

  // after toggle note, wait for an interval before playing another preview sound
  // this is the timer for the setInterval function
  private _toggleNotePreviewSoundTimerId: number;

  constructor(containerElement: HTMLDivElement) {
    this._containerElement = containerElement;
    this._blockObjects = [];

    this.initInteractEvents();
  }

  play() {
    const smallestDivision = `${Constants.STEPS_PER_QUARTER * 4}n`; // default: 16th note

    this._currentStep = 0;
    Tone.Transport.scheduleRepeat((time: number) => {
      const pitchToCountMap = new Map<number, number>();
      this._blockObjects.forEach((b) => {
        b.currentStep = this._currentStep;
        b.getPitchesToPlay().forEach((p) => {
          pitchToCountMap.set(p, pitchToCountMap.get(p) ? pitchToCountMap.get(p) + 1 : 1);
        });
        b.render();
      });

      for (const [pitch, count] of pitchToCountMap) {
        this.drumkit.playNote(pitch, time, count);
      }

      this._currentStep += 1;
    }, smallestDivision);

    Tone.Transport.start();
  }

  stop() {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    this._currentStep = undefined;
    this._blockObjects.forEach((b) => {
      b.currentStep = undefined;
      b.render();
    });
  }

  toggleDrumkit() {
    if (this._drumkit === this._synthDrumKit) {
      this._drumkit = this._playerDrumKit;
    } else {
      this._drumkit = this._synthDrumKit;
    }
  }

  getAllBlocks(): Block[] {
    return this._blockObjects.reduce(
      (arr, blockObject) => {
        if (blockObject instanceof Block) {
          return [...arr, blockObject];
        }
        if (blockObject instanceof Blockchain) {
          return blockObject.interpolatedBlock
            ? [...arr, ...blockObject.blocks, blockObject.interpolatedBlock]
            : [...arr, ...blockObject.blocks];
        }
        return arr;
      },
      [...this._presetBlocks]
    );
  }

  getBlockById(id: number): Block {
    return this.getAllBlocks().find((b) => b.id === id);
  }

  // return null if block is not in any blockchain
  getBlockchainOfBlock(block: Block): Blockchain {
    for (const blockChain of this._blockObjects.filter((b) => b instanceof Blockchain)) {
      const bc = blockChain as Blockchain;
      if (bc.interpolatedBlock === block || bc.blocks.find((b) => b === block)) {
        return bc;
      }
    }
    return null;
  }

  nextId() {
    const blocks = this.getAllBlocks();
    return blocks.length > 0 ? Math.max(...blocks.map((b) => b.id)) + 1 : 0;
  }

  initPresets() {
    // presets
    const presetContainer = document.getElementById('presets');

    for (const preset of Constants.PRESETS) {
      const block = new Block(this.nextId(), this);
      block.noteSequence = Block.defaultNoteSequence();
      block.noteSequence.notes = preset.notes;
      block.name = preset.name;
      this._presetBlocks.push(block);

      presetContainer.appendChild(block.element);
      block.init();
    }
  }

  createBlockDom(block: Block, findFreeSpace = false) {
    // position
    const blockTemplate = document.getElementById('block-template') as HTMLTemplateElement;
    const blockElement = (blockTemplate.content.cloneNode(true) as HTMLElement).querySelector(
      '.block'
    ) as HTMLDivElement;

    if (findFreeSpace) {
      const coords = this.findFreeSpaceInContainer();
      blockElement.style.left = `${coords[0]}px`;
      blockElement.style.top = `${coords[1]}px`;
    }

    const grid = blockElement.querySelector('.grid');
    grid.addEventListener(
      'mouseover',
      (event: Event) => {
        this._hoveredCellElement = event.target as HTMLElement;
      },
      false
    );

    const muteButton = blockElement.querySelector('#mute-button');
    muteButton.addEventListener('click', () => {
      block.muted = !block.muted;
    });

    const magicButton = blockElement.querySelector('#magic-button');
    magicButton.addEventListener('click', () => {
      block.doMagic();
    });

    const continueButton = blockElement.querySelector('#continue-button');
    continueButton.addEventListener('click', () => {
      block.continue();
    });

    const deleteButton = blockElement.querySelector('#delete-button');
    deleteButton.addEventListener('click', () => {
      this._blockObjects.splice(this._blockObjects.indexOf(block), 1);
      block.element.remove();
    });
    return blockElement;
  }

  createBlock(noteSequence?: INoteSequence) {
    const block = new Block(this.nextId(), this, true);
    block.noteSequence = noteSequence || Block.defaultNoteSequence();
    this._blockObjects.push(block);

    this._containerElement.appendChild(block.element);
    block.init();
  }

  initBlockchainDom(block: Block): Blockchain {
    const blockChainTemplate = document.getElementById(
      'blockchain-template'
    ) as HTMLTemplateElement;
    const blockChainElement = (
      blockChainTemplate.content.cloneNode(true) as HTMLElement
    ).querySelector('.blockchain') as HTMLElement;
    blockChainElement.style.left = `${parseFloat(block.element.style.left) - 10}px`;
    blockChainElement.style.top = `${parseFloat(block.element.style.top) - 10}px`;
    block.element.style.left = null;
    block.element.style.top = null;
    this._containerElement.appendChild(blockChainElement);
    this._containerElement.removeChild(block.element);

    const blockchain = new Blockchain(blockChainElement);
    blockchain.addBlock(block);
    const index = this._blockObjects.indexOf(block);
    this._blockObjects[index] = blockchain;

    const muteButton = blockChainElement.querySelector('#bc-mute-button');
    muteButton.addEventListener('click', () => {
      blockchain.muted = !blockchain.muted;
    });

    const deleteButton = blockChainElement.querySelector('#bc-delete-button');
    deleteButton.addEventListener('click', () => {
      this._blockObjects.splice(this._blockObjects.indexOf(blockchain), 1);
      blockChainElement.remove();
    });

    const interpolateButton = blockChainElement.querySelector('#bc-interpolate-button');
    interpolateButton.addEventListener('click', () => {
      blockchain.startInterpolation(this);
    });

    const slider = blockChainElement.querySelector('#interpolate-slider') as HTMLInputElement;
    slider.setAttribute('max', `${Constants.INTERPOLATION_LENGTH - 1}`);
    slider.addEventListener('input', () => {
      if (blockchain.interpolatedBlock) {
        blockchain.interpolatedBlock.noteSequence =
          blockchain.interpolatedSamples[slider.valueAsNumber];
        blockchain.interpolatedBlock.render();
      }
    });
    slider.valueAsNumber = Math.floor(Constants.INTERPOLATION_LENGTH / 2);
    return blockchain;
  }

  chainBlock(block1: Block, block2: Block) {
    if (block1 === block2) return;

    if (this._presetBlocks.indexOf(block2) !== -1) {
      block2 = this.convertPresetBlock(block2, false);
    }

    const blockChain1 = this.getBlockchainOfBlock(block1);
    const blockChain2 = this.getBlockchainOfBlock(block2);
    if (blockChain1) {
      blockChain1.addBlockAfter(block1, block2);
    } else {
      const blockchain = this.initBlockchainDom(block1);
      blockchain.addBlock(block2);
    }

    if (blockChain2 && blockChain1 !== blockChain2) {
      blockChain2.removeBlock(block2);
      if (blockChain2.length < 2) {
        this.releaseBlock(blockChain2.first);
      }
    } else {
      this._blockObjects = this._blockObjects.filter((b) => b !== block2);
    }
  }

  // makes a preset block into an actual block, without destroying it
  convertPresetBlock(presetBlock: Block, reposition = true) {
    const clone = presetBlock.clone(this);
    this._blockObjects.push(clone);
    if (reposition) {
      const containerRect = this._containerElement.getBoundingClientRect();
      const blockRect = presetBlock.element.getBoundingClientRect();
      clone.element.style.left = `${blockRect.x - containerRect.x}px`;
      clone.element.style.top = `${blockRect.y - containerRect.y}px`;
    }
    this._containerElement.appendChild(clone.element);
    return clone;
  }

  // removes a block from a blockchain
  releaseBlock(blockToRelease: Block) {
    const blockchain = this.getBlockchainOfBlock(blockToRelease);

    // if there are only two blocks left, release both (but last one first to preserve pos)
    const blocksToRelease =
      blockchain.length === 2 && blockToRelease !== blockchain.interpolatedBlock
        ? [blockchain.last, blockchain.first]
        : [blockToRelease];
    for (const block of blocksToRelease) {
      const containerRect = this._containerElement.getBoundingClientRect();
      const blockRect = block.element.getBoundingClientRect();

      blockchain.removeBlock(block);
      this._blockObjects.push(block);

      // recalculate position
      block.element.style.left = `${blockRect.x - containerRect.x}px`;
      block.element.style.top = `${blockRect.y - containerRect.y}px`;

      this._containerElement.appendChild(block.element);
    }

    if (blockchain.length === 0) this.destroyBlockchain(blockchain);
  }

  // remove empty blockchain
  destroyBlockchain(blockchain: Blockchain) {
    this._blockObjects = this._blockObjects.filter((b) => b !== blockchain);
    blockchain.element.remove();
  }

  setToggleNotePreviewSoundTimer() {
    if (this._toggleNotePreviewSoundTimerId) {
      window.clearTimeout(this._toggleNotePreviewSoundTimerId);
    }
    this._toggleNotePreviewSoundTimerId = window.setTimeout(() => {
      this._toggleNotePreviewSoundTimerId = null;
    }, 200);
  }

  initInteractEvents() {
    const blockManager = this;
    const ignoreFrom = '.grid, button, input';
    // make blocks draggable
    interact('.block').draggable({
      ignoreFrom,
      modifiers: [
        interact.modifiers.restrictRect({
          restriction: blockManager._containerElement,
          endOnly: false
        })
      ],
      listeners: {
        start(event) {
          const { target } = event;
          target.setAttribute('drag', 'active');
          // adjust zIndex if not inside blockchain
          if (!target.matches('.blockchain .block')) {
            blockManager._highestZIndex += 1;
            target.style.zIndex = blockManager._highestZIndex;
          }
        },
        move(event) {
          const { target } = event;
          const x = (parseFloat(target.style.left) || 0) + event.dx;
          const y = (parseFloat(target.style.top) || 0) + event.dy;
          target.style.left = `${x}px`;
          target.style.top = `${y}px`;
        },
        end(event) {
          const { target } = event;
          target.removeAttribute('drag');
          // reset position if element was in blockchain or preset
          if (target.matches('.blockchain .block, #presets .block')) {
            target.style.left = null;
            target.style.top = null;
          }
        }
      }
    });

    interact('.blockchain').draggable({
      ignoreFrom,
      modifiers: [
        interact.modifiers.restrictRect({
          restriction: blockManager._containerElement,
          endOnly: false
        })
      ],
      listeners: {
        start(event) {
          const { target } = event;
          blockManager._highestZIndex += 1;
          target.style.zIndex = blockManager._highestZIndex;
        },
        move(event) {
          const { target } = event;
          const x = (parseFloat(target.style.left) || 0) + event.dx;
          const y = (parseFloat(target.style.top) || 0) + event.dy;
          target.style.left = `${x}px`;
          target.style.top = `${y}px`;
        }
      }
    });

    interact('.dropzone').dropzone({
      accept: '.block',
      overlap: 'pointer',
      ondropactivate() {
        blockManager._containerElement.setAttribute('dropzones', 'visible');
      },
      ondragenter(event) {
        event.target.classList.add('active');
      },
      ondragleave(event) {
        event.target.classList.remove('active');
      },
      ondrop(event) {
        const draggableElement = event.relatedTarget;
        const dropzoneElement = event.target;
        dropzoneElement.classList.remove('active');
        const block1 = blockManager.getBlockById(parseInt(dropzoneElement.parentElement.id, 10));
        const block2 = blockManager.getBlockById(parseInt(draggableElement.id, 10));
        blockManager.chainBlock(block1, block2);
      },
      ondropdeactivate() {
        blockManager._containerElement.removeAttribute('dropzones');
      }
    });

    interact('#container').dropzone({
      accept: '.blockchain .block, #presets .block',
      overlap: 'pointer',
      checker: (
        dragEvent,
        event,
        dropped,
        dropzone,
        dropzoneElement,
        draggable,
        draggableElement
      ) => {
        // don't trigger drop if dropped within blockchain / interpolation / presets panel
        let parent = '.blockchain';
        if (draggableElement.closest('#interpolate')) {
          parent = '#interpolate';
        }
        if (draggableElement.closest('#presets')) {
          parent = '#presets';
        }
        const closestRect = draggableElement.closest(parent).getBoundingClientRect();
        const mouseIsInsideBlockchain =
          event.clientX >= closestRect.left &&
          event.clientX <= closestRect.right &&
          event.clientY >= closestRect.top &&
          event.clientY <= closestRect.bottom;
        return dropped && !mouseIsInsideBlockchain;
      },
      ondropactivate() {
        blockManager._containerElement.classList.add('droppable');
      },
      ondrop(event) {
        const blockElement = event.relatedTarget;
        const block = blockManager.getBlockById(parseInt(blockElement.id, 10));
        if (blockManager._presetBlocks.indexOf(block) !== -1) {
          blockManager.convertPresetBlock(block);
        } else {
          blockManager.releaseBlock(block);
        }
      },
      ondropdeactivate() {
        blockManager._containerElement.classList.remove('droppable');
      }
    });

    const toggleNote = (block: Block) => {
      block.toggleNote(blockManager._hoveredCellElement);

      // preview sound
      if (!blockManager.isPlaying && !blockManager._toggleNotePreviewSoundTimerId) {
        const pitchIndex = Constants.DRUM_PITCHES.length - parseInt(blockManager._hoveredCellElement.getAttribute('row'), 10) - 1;
        blockManager.drumkit.playNote(Constants.DRUM_PITCHES[pitchIndex], '+0', 1);
        blockManager.setToggleNotePreviewSoundTimer();
      }

      const blockchain = blockManager.getBlockchainOfBlock(block);
      if (blockchain) {
        blockchain.setToggleNoteInterpolationTimer();
      }
    };

    // dragging on the grid to toggle cells
    let moved: HTMLElement[] = []; // already toggled in this interaction
    interact('.grid')
      .draggable({
        listeners: {
          start() {
            moved = [];
          },
          move() {
            if (moved.indexOf(blockManager._hoveredCellElement) >= 0) {
              return;
            }
            const blockId = parseInt(blockManager._hoveredCellElement.getAttribute('block'), 10);
            const block = blockManager.getBlockById(blockId);
            if (block) {
              moved.push(blockManager._hoveredCellElement);
              toggleNote(block);
            }
          }
        }
      })
      .styleCursor(false)
      // clear the canvas on doubletap
      .on('click', (event) => {
        const blockId = parseInt(event.target.getAttribute('block'), 10);
        const block = blockManager.getBlockById(blockId);
        if (block) {
          toggleNote(block);
        }
      });
  }

  // eslint-disable-next-line class-methods-use-this
  findFreeSpaceInContainer(): number[] {
    const blocks = this.getAllBlocks();
    if (blocks.every((b) => !b.element)) {
      return [256, 256];
    }
    const containerWidth = this._containerElement.offsetWidth;
    const containerHeight = this._containerElement.offsetHeight;
    const blockWidth = 360;
    const blockHeight = 130;
    const margin = 16;

    const maxPermittedX = containerWidth - blockWidth - margin;
    const maxPermittedY = containerHeight - blockHeight - margin;

    let coords = [0, 0];
    let tries = 0;
    do {
      coords = [Math.random() * maxPermittedX, Math.random() * maxPermittedY];
      tries += 1;
    } while (this.anyBlockOccupying(coords[0], coords[1], blocks) && tries < 100);

    return coords;
  }

  // eslint-disable-next-line class-methods-use-this
  anyBlockOccupying(x: number, y: number, blocks: Block[]): boolean {
    const blockWidth = 360;
    const blockHeight = 130;

    const containerRect = this._containerElement.getBoundingClientRect();
    return blocks.some((b) => {
      const blockRect = b.element.getBoundingClientRect();
      const blockX = blockRect.x - containerRect.x;
      const blockY = blockRect.y - containerRect.y;
      return (
        blockX + blockWidth >= x &&
        blockX <= x + blockWidth &&
        blockY + blockHeight >= y &&
        blockY <= y + blockHeight
      );
    });
  }
}

export default BlockManager;
