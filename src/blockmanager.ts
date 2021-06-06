import { INoteSequence } from '@magenta/music/es6/protobuf';
import interact from 'interactjs';
import Block from './block';
import BlockChain from './blockchain';
import IBlockObject from './iblockobject';
import WorkerData from './worker';

class BlockManager {
  private _containerElement: HTMLDivElement;

  private _blockObjects: IBlockObject[];

  private _worker: Worker;

  private _hoveredCellElement: HTMLElement;

  private _highestZIndex = 0;

  constructor(containerElement: HTMLDivElement, worker: Worker) {
    this._containerElement = containerElement;
    this._blockObjects = [];
    this._worker = worker;

    this.initInteractEvents();
  }

  // eslint-disable-next-line no-unused-vars
  do(func: (b: IBlockObject) => void) {
    this._blockObjects.forEach(func);
  }

  getAllBlocks(): Block[] {
    return this._blockObjects.reduce((arr, blockObject) => {
      if (blockObject instanceof Block) {
        return [...arr, blockObject];
      }
      if (blockObject instanceof BlockChain) {
        return [...arr, ...blockObject.blocks];
      }
      return arr;
    }, []);
  }

  getBlockById(id: number): Block {
    return this.getAllBlocks().find((b) => b.id === id);
  }

  // return null if block is not in any blockchain
  getBlockChainOfBlock(block: Block): BlockChain {
    for (const blockChain of this._blockObjects.filter((b) => b instanceof BlockChain)) {
      if ((blockChain as BlockChain).blocks.find((b) => b === block)) {
        return blockChain as BlockChain;
      }
    }
    return null;
  }

  createBlock() {
    const id = Math.max(...this.getAllBlocks().map((b) => b.id)) + 1;
    const block = new Block(id);
    this.initBlock(block);
  }

  initBlock(block: Block) {
    // position
    const coords = this.findFreeSpaceInContainer();

    this._blockObjects.push(block);
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
      block.continue(this._worker);
    });

    const deleteButton = block.element.querySelector('#delete-button');
    deleteButton.addEventListener('click', () => {
      this._blockObjects.splice(this._blockObjects.indexOf(block), 1);
      block.element.remove();
    });

    block.init();
  }

  initBlockchain(block: Block): BlockChain {
    const blockChainTemplate = document.getElementById(
      'blockchain-template'
    ) as HTMLTemplateElement;
    const blockChainElement = (
      blockChainTemplate.content.cloneNode(true) as HTMLElement
    ).querySelector('.blockchain') as HTMLElement;
    blockChainElement.style.left = block.element.style.left;
    blockChainElement.style.top = block.element.style.top;
    block.element.style.left = null;
    block.element.style.top = null;
    this._containerElement.appendChild(blockChainElement);
    this._containerElement.removeChild(block.element);

    const blockchain = new BlockChain(blockChainElement);
    blockchain.addBlock(block);
    const index = this._blockObjects.indexOf(block);
    this._blockObjects[index] = blockchain;

    const muteButton = blockChainElement.querySelector('#mute-button');
    muteButton.addEventListener('click', () => {
      muteButton.classList.toggle('muted');
      blockchain.toggleMute();
    });

    const deleteButton = blockChainElement.querySelector('#delete-button');
    deleteButton.addEventListener('click', () => {
      this._blockObjects.splice(this._blockObjects.indexOf(blockchain), 1);
      blockChainElement.remove();
    });
    return blockchain;
  }

  chainBlock(block1: Block, block2: Block) {
    if (block1 === block2) return;

    const blockChain1 = this.getBlockChainOfBlock(block1);
    const blockChain2 = this.getBlockChainOfBlock(block2);

    if (blockChain1) {
      blockChain1.addBlockAfter(block1, block2);
    } else {
      const blockchain = this.initBlockchain(block1);
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

  // removes a block from a blockchain
  releaseBlock(blockToRelease: Block) {
    const blockchain = this.getBlockChainOfBlock(blockToRelease);

    // if there are only two blocks left, release both (but last one first to preserve pos)
    const blocksToRelease =
      blockchain.length === 2 ? [blockchain.last, blockchain.first] : [blockToRelease];
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

    if (blockchain.length === 0) this.destroyBlockChain(blockchain);
  }

  // remove empty blockchain
  destroyBlockChain(blockchain: BlockChain) {
    this._blockObjects = this._blockObjects.filter((b) => b !== blockchain);
    blockchain.element.remove();
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
    interact('.block').draggable({
      // inertia: true,
      ignoreFrom: '.grid, button',
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
          // reset position if element was in blockchain
          if (target.matches('.blockchain .block')) {
            target.style.left = null;
            target.style.top = null;
          }
        }
      }
    });

    interact('.blockchain').draggable({
      // inertia: true,
      ignoreFrom: '.grid, button',
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
      accept: '.blockchain .block',
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
        const blockchainRect = draggableElement.closest('.blockchain').getBoundingClientRect();
        const mouseIsInsideBlockchain =
          event.clientX >= blockchainRect.left &&
          event.clientX <= blockchainRect.right &&
          event.clientY >= blockchainRect.top &&
          event.clientY <= blockchainRect.bottom;
        return dropped && !mouseIsInsideBlockchain;
      },
      ondropactivate() {
        blockManager._containerElement.classList.add('droppable');
      },
      ondrop(event) {
        const blockElement = event.relatedTarget;
        const block = blockManager.getBlockById(parseInt(blockElement.id, 10));
        blockManager.releaseBlock(block);
      },
      ondropdeactivate() {
        blockManager._containerElement.classList.remove('droppable');
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
    const blocks = this.getAllBlocks();
    if (blocks.every((b) => !b.element)) {
      return [128, 128];
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
