import { INoteSequence } from '@magenta/music/es6/protobuf';
import interact from 'interactjs';
import Block from './block';
import BlockChain from './blockchain';
import IBlockObject from './iblockobject';
import WorkerData from './worker';

class BlockManager {
  private _containerElement: HTMLDivElement;

  private _blocks: IBlockObject[];

  private _worker: Worker;

  private _hoveredCellElement: HTMLElement;

  constructor(containerElement: HTMLDivElement, worker: Worker) {
    this._containerElement = containerElement;
    this._blocks = [];
    this._worker = worker;

    this.initInteractEvents();
  }

  // eslint-disable-next-line no-unused-vars
  do(func: (b: IBlockObject) => void) {
    this._blocks.forEach(func);
  }

  getBlockById(id: number): Block {
    for (const blockObject of this._blocks) {
      if (blockObject instanceof Block) {
        if (blockObject.id === id) return blockObject;
      }
      if (blockObject instanceof BlockChain) {
        const find = blockObject.blocks.find((b) => b.id === id);
        if (find) return find;
      }
    }
    return null;
  }

  addBlock() {
    const id =
      this._blocks.reduce((highestId, blockObject) => {
        if (blockObject instanceof Block) {
          return Math.max(highestId, blockObject.id);
        }
        if (blockObject instanceof BlockChain) {
          return Math.max(highestId, ...blockObject.blocks.map((bc) => bc.id));
        }
        return 0;
      }, 0) + 1;

    const block = new Block(id);
    this.initBlock(block);
  }

  initBlock(block: Block) {
    // position
    const coords = this.findFreeSpaceInContainer();

    this._blocks.push(block);
    const blockTemplate = document.getElementById('block-template') as HTMLTemplateElement;
    block.element = (blockTemplate.content.cloneNode(true) as HTMLElement).querySelector('.block');
    block.element.style.left = `${coords[0]}px`;
    block.element.style.top = `${coords[1]}px`;
    this._containerElement.appendChild(block.element);

    const grid = block.element.querySelector('.grid');
    grid.addEventListener(
      'mouseover',
      (event: Event) => {
        this._hoveredCellElement = event.target as HTMLElement;
      },
      false
    );

    const muteButton = block.element.querySelector('#mute-button');
    muteButton.addEventListener('click', () => {
      muteButton.classList.toggle('muted');
      block.toggleMute();
    });

    const magicButton = block.element.querySelector('#magic-button');
    magicButton.addEventListener('click', () => {
      block.doMagic(this._worker);
    });

    const continueButton = block.element.querySelector('#continue-button');
    continueButton.addEventListener('click', () => {
      this.getContinuedSequence(block._noteSequence).then((noteSequence) => {
        const blockchain = this.initBlockChain(block);
        const newBlock = new Block(2, noteSequence);
        this.initBlock(newBlock);
        this._blocks.splice(this._blocks.indexOf(newBlock), 1);
        blockchain.addBlock(newBlock);
      });
    });

    const deleteButton = block.element.querySelector('#delete-button');
    deleteButton.addEventListener('click', () => {
      this._blocks.splice(this._blocks.indexOf(block), 1);
      block.element.parentElement.removeChild(block.element);
    });

    block.init();
  }

  initBlockChain(block: Block): BlockChain {
    const blockChainTemplate = document.getElementById('blockchain-template') as HTMLTemplateElement;
    const blockChainElement = (blockChainTemplate.content.cloneNode(true) as HTMLElement).querySelector('.blockchain') as HTMLElement;
    blockChainElement.style.left = block.element.style.left;
    blockChainElement.style.top = block.element.style.top;
    block.element.style.left = null;
    block.element.style.top = null;
    this._containerElement.appendChild(blockChainElement);
    this._containerElement.removeChild(block.element);

    const blockChain = new BlockChain(block, blockChainElement);
    const index = this._blocks.indexOf(block);
    this._blocks[index] = blockChain;

    blockChain.init();
    return blockChain;
  }

  getContinuedSequence(noteSequence: INoteSequence): Promise<INoteSequence> {
    return new Promise((resolve) => {
      this._worker.postMessage(
        new WorkerData({
          sequenceToContinue: noteSequence
        })
      );

      this._worker.onmessage = ({ data }: { data: WorkerData }) => {
        resolve(data.continuedSequence);
      };
    });
  }

  initInteractEvents() {
    const blockManager = this;
    // make blocks draggable
    interact('.block:not(.blockchain .block)').draggable({
      // inertia: true,
      ignoreFrom: '.grid',
      modifiers: [
        interact.modifiers.restrictRect({
          restriction: 'parent',
          endOnly: false
        })
      ],
      listeners: {
        move(event) {
          const { target } = event;
          const x = (parseFloat(target.style.left) || 0) + event.dx;
          const y = (parseFloat(target.style.top) || 0) + event.dy;
          target.style.left = `${x}px`;
          target.style.top = `${y}px`;
        }
      }
    });
    interact('.blockchain').draggable({
      // inertia: true,
      ignoreFrom: '.grid',
      modifiers: [
        interact.modifiers.restrictRect({
          restriction: 'parent',
          endOnly: false
        })
      ],
      listeners: {
        move(event) {
          const { target } = event;
          const x = (parseFloat(target.style.left) || 0) + event.dx;
          const y = (parseFloat(target.style.top) || 0) + event.dy;
          target.style.left = `${x}px`;
          target.style.top = `${y}px`;
        }
      }
    });

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
              block.toggleNote(blockManager._hoveredCellElement);
              moved.push(blockManager._hoveredCellElement);
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
          block.toggleNote(event.target);
        }
      });
  }

  // eslint-disable-next-line class-methods-use-this
  findFreeSpaceInContainer(): number[] {
    return [0, 0];
    // if (this._blocks.every((b) => !b.element)) {
    //   return [0, 0];
    // }
    // const containerWidth = this._containerElement.offsetWidth;
    // const containerHeight = this._containerElement.offsetHeight;
    // const blockWidth = 350;
    // const blockHeight = 120;
    // const margin = 16;

    // const maxPermittedX = containerWidth - blockWidth - margin;
    // const maxPermittedY = containerHeight - blockHeight - margin;

    // let coords = [0, 0];
    // let tries = 0;
    // do {
    //   coords = [Math.random() * maxPermittedX, Math.random() * maxPermittedY];
    //   tries += 1;
    // } while (this.anyBlockOccupying(coords[0], coords[1]) && tries < 100);

    // return coords;
  }

  // eslint-disable-next-line class-methods-use-this
  anyBlockOccupying(x: number, y: number): boolean {
    return false;
    // const blockWidth = 350;
    // const blockHeight = 120;

    // return this._blocks.some((b) => {
    //   const blockX = b.element.style.left ? parseFloat(b.element.style.left) : 0;
    //   const blockY = b.element.style.top ? parseFloat(b.element.style.top) : 0;
    //   return (
    //     blockX + blockWidth >= x &&
    //     blockX <= x + blockWidth &&
    //     blockY + blockHeight >= y &&
    //     blockY <= y + blockHeight
    //   );
    // });
  }
}

export default BlockManager;