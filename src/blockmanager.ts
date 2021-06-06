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

  // return null if block is not in any blockchain
  getBlockChainOfBlock(block: Block): BlockChain {
    for (const blockChain of this._blocks.filter((b) => b instanceof BlockChain)) {
      if ((blockChain as BlockChain).blocks.find((b) => b === block)) {
        return blockChain as BlockChain;
      }
    }
    return null;
  }

  createBlock() {
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
      block.continue(this._worker);
    });

    const deleteButton = block.element.querySelector('#delete-button');
    deleteButton.addEventListener('click', () => {
      this._blocks.splice(this._blocks.indexOf(block), 1);
      block.element.parentElement.removeChild(block.element);
    });

    block.init();
  }

  initBlockChain(block: Block): BlockChain {
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

    const blockChain = new BlockChain(block, blockChainElement);
    const index = this._blocks.indexOf(block);
    this._blocks[index] = blockChain;

    blockChain.init();
    return blockChain;
  }

  chainBlock(block1: Block, block2: Block) {
    if (block1 === block2) return;

    const blockChain1 = this.getBlockChainOfBlock(block1);
    const blockChain2 = this.getBlockChainOfBlock(block2);

    if (blockChain1) {
      blockChain1.addBlockAfter(block1, block2);
    } else {
      const blockchain = this.initBlockChain(block1);
      blockchain.addBlock(block2);
    }

    if (blockChain2 && blockChain1 !== blockChain2) {
      blockChain2.removeBlock(block2);
      if (blockChain2.length < 2) {
        this.releaseBlock(blockChain2.first);
      }
    } else {
      this._blocks = this._blocks.filter((b) => b !== block2);
    }
  }

  // removes a block from a blockchain
  releaseBlock(block: Block) {
    const containerRect = this._containerElement.getBoundingClientRect();
    const blockRect = block.element.getBoundingClientRect();

    const blockchain = this.getBlockChainOfBlock(block);
    blockchain.removeBlock(block);
    this._blocks.push(block);

    // recalculate position
    block.element.style.left = `${blockRect.x - containerRect.x}px`;
    block.element.style.top = `${blockRect.y - containerRect.y}px`;

    this._containerElement.appendChild(block.element);

    if (blockchain.length < 2) this.destroyBlockChain(blockchain);
  }

  // remove blockchain if only one element is remaining
  destroyBlockChain(blockchain: BlockChain) {
    if (blockchain.length === 1) {
      this.releaseBlock(blockchain.first);
    }
    this._blocks = this._blocks.filter((b) => b !== blockchain);
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
      ignoreFrom: '.grid',
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
      ignoreFrom: '.grid',
      modifiers: [
        interact.modifiers.restrictRect({
          restriction: blockManager._containerElement,
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
