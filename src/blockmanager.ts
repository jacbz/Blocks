import interact from 'interactjs';
import Block from './block';

class BlockManager {
  private _containerElement: HTMLDivElement;

  private _blocks: Block[];

  private _worker: Worker;

  private _hoveredCellElement: HTMLElement;

  constructor(containerElement: HTMLDivElement, worker: Worker) {
    this._containerElement = containerElement;
    this._blocks = [];
    this._worker = worker;

    this.initInteractEvents();
  }

  // eslint-disable-next-line no-unused-vars
  do(func: (b: Block) => void) {
    this._blocks.forEach(func);
  }

  addBlock() {
    const block = new Block(
      this._blocks.length > 0 ? this._blocks[this._blocks.length - 1].id + 1 : 0
    );
    this.initBlock(block);
  }

  initBlock(block: Block) {
    // position
    const coords = this.findFreeSpaceInContainer();

    this._blocks.push(block);
    const blockTemplate = document.getElementById('block-template') as HTMLTemplateElement;
    const blockElement = blockTemplate.content.cloneNode(true) as HTMLElement;
    block.element = blockElement.querySelector('.block');
    block.initGrid();
    this._containerElement.appendChild(blockElement);

    block.element.style.left = `${coords[0]}px`;
    block.element.style.top = `${coords[1]}px`;

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

    const deleteButton = block.element.querySelector('#delete-button');
    deleteButton.addEventListener('click', () => {
      this._blocks.splice(this._blocks.indexOf(block), 1);
      block.element.parentElement.removeChild(block.element);
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
            const block = blockManager._blocks.find((b) => b.id === blockId);
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
        const block = blockManager._blocks.find((b) => b.id === blockId);
        if (block) {
          block.toggleNote(event.target);
        }
      });
  }

  findFreeSpaceInContainer(): number[] {
    if (this._blocks.every((b) => !b.element)) {
      return [0, 0];
    }
    const containerWidth = this._containerElement.offsetWidth;
    const containerHeight = this._containerElement.offsetHeight;
    const blockWidth = this._blocks[0].element.offsetWidth;
    const blockHeight = this._blocks[0].element.offsetHeight;
    const margin = 16;

    const maxPermittedX = containerWidth - blockWidth - margin;
    const maxPermittedY = containerHeight - blockHeight - margin;

    let coords = [0, 0];
    let tries = 0;
    do {
      coords = [Math.random() * maxPermittedX, Math.random() * maxPermittedY];
      tries += 1;
    } while (this.anyBlockOccupying(coords[0], coords[1]) && tries < 100);

    return coords;
  }

  anyBlockOccupying(x: number, y: number): boolean {
    const blockWidth = this._blocks[0].element.offsetWidth;
    const blockHeight = this._blocks[0].element.offsetHeight;

    return this._blocks.some((b) => {
      const blockX = b.element.style.left ? parseFloat(b.element.style.left) : 0;
      const blockY = b.element.style.top ? parseFloat(b.element.style.top) : 0;
      return (
        blockX + blockWidth >= x &&
        blockY + blockHeight >= y &&
        blockY + blockHeight >= y &&
        blockY <= y + blockHeight
      );
    });
  }
}

export default BlockManager;
