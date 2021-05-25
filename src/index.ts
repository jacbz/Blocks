import * as Tone from 'tone';
import interact from 'interactjs';

import Block from './block';
import * as Constants from './constants';
import DrumKit from './drumkit';
import WorkerData from './worker';

const drumkit = DrumKit.getInstance();
const worker = new Worker(new URL('./worker.ts', import.meta.url));

let isPlaying = false;
let currentStep: number;

const blocks: Block[] = [];

let hoveredCellElement: HTMLElement;
const containerElement = document.getElementById('container') as HTMLDivElement;
const volumeSlider = document.getElementById('volume') as HTMLInputElement;
volumeSlider.valueAsNumber = Constants.START_BPM;
const volumeLabel = document.getElementById('bpm') as HTMLSpanElement;

function initBlock(block: Block) {
  const mouseOver = (event: Event) => {
    hoveredCellElement = event.target as HTMLElement;
  };

  const blockTemplate = document.getElementById('block-template') as HTMLTemplateElement;
  const blockElement = blockTemplate.content.cloneNode(true) as HTMLElement;
  block.element = blockElement.querySelector('.block');
  block.initGrid();
  containerElement.appendChild(blockElement);
  const grid = block.element.querySelector('.grid');
  grid.addEventListener('mouseover', mouseOver, false);

  const muteButton = block.element.querySelector('#mute-button');
  muteButton.addEventListener('click', () => {
    muteButton.classList.toggle('muted');
    block.toggleMute();
  });

  const magicButton = block.element.querySelector('#magic-button');
  magicButton.addEventListener('click', () => {
    block.doMagic(worker);
  });

  const deleteButton = block.element.querySelector('#delete-button');
  deleteButton.addEventListener('click', () => {
    blocks.splice(blocks.indexOf(block), 1);
    // hide instead of delete: otherwise blocks would be moved by the resulting layout change
    block.element.style.visibility = 'hidden';
  });
}

function finishLoading() {
  worker.postMessage(new WorkerData({
    numberOfSamples: Constants.NUMBER_OF_BLOCKS_AT_START
  }));

  worker.onmessage = ({ data }: { data: WorkerData }) => {
    for (let i = 0; i < Constants.NUMBER_OF_BLOCKS_AT_START; i += 1) {
      const block = new Block(i, data.samples[i]);
      blocks.push(block);
      initBlock(block);
    }
    document.getElementById('loading').remove();
    document.getElementById('container').style.display = null;
  };
}

function init() {
  worker.postMessage(new WorkerData({
    startLoading: true
  }));
  worker.onmessage = ({ data }: { data: WorkerData }) => {
    if (data.finishedLoading) {
      finishLoading();
    }
  };
}

function play() {
  const smallestDivision = `${Constants.STEPS_PER_QUARTER * 4}n`; // default: 16th note

  currentStep = 0;
  Tone.Transport.scheduleRepeat((time: number) => {
    const pitchToCountMap = new Map<number, number>();
    blocks.forEach((b) => {
      b.currentStep = currentStep;
      b.getPitchesToPlay().forEach((p) => {
        pitchToCountMap.set(p, pitchToCountMap.get(p) ? pitchToCountMap.get(p) + 1 : 1);
      });
      b.updateGrid();
    });

    for (const [pitch, count] of pitchToCountMap) {
      drumkit.playNote(pitch, time, count);
    }

    currentStep = (currentStep + 1) % Constants.TOTAL_STEPS;
  }, smallestDivision);

  Tone.Transport.start();
}

function stop() {
  Tone.Transport.stop();
  Tone.Transport.cancel();
  currentStep = undefined;
  blocks.forEach((b) => {
    b.currentStep = undefined;
    b.updateGrid();
  });
}

init();

const btn = document.getElementById('play-button') as HTMLButtonElement;
btn.addEventListener('click', () => {
  if (isPlaying) {
    stop();
    btn.innerText = 'Play';
    isPlaying = false;
  } else {
    Tone.start().then(play);
    btn.innerText = 'Stop';
    isPlaying = true;
  }
});

// test panel
const container = document.querySelector('#test-panel');
for (let i = 0; i < Constants.DRUM_PITCHES.length; i += 1) {
  const button = document.createElement('button');
  button.innerText = Constants.DRUM_NAMES[i];
  button.addEventListener('click', () => {
    drumkit.playNote(Constants.DRUM_PITCHES[i], '+0', 1);
  });
  container.appendChild(button);
}

// volume slider
volumeSlider.addEventListener('input', () => {
  Tone.Transport.bpm.value = volumeSlider.valueAsNumber;
  volumeLabel.innerText = volumeSlider.value;
});

// new block
document.getElementById('new-button').addEventListener('click', () => {
  const block = new Block(blocks.length > 0 ? blocks[blocks.length - 1].id + 1 : 0);
  blocks.push(block);
  initBlock(block);
});

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
      // keep the dragged position in the data-x/data-y attributes
      const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
      const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

      // translate the element
      target.style.transform = `translate(${x}px, ${y}px)`;

      // update the posiion attributes
      target.setAttribute('data-x', x);
      target.setAttribute('data-y', y);
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
        if (moved.indexOf(hoveredCellElement) >= 0) {
          return;
        }
        const blockId = parseInt(hoveredCellElement.getAttribute('block'), 10);
        const block = blocks.find((b) => b.id === blockId);
        if (block) {
          block.toggleNote(hoveredCellElement);
          moved.push(hoveredCellElement);
        }
      }
    }
  })
  .styleCursor(false)
  // clear the canvas on doubletap
  .on('click', (event) => {
    const blockId = parseInt(event.target.getAttribute('block'), 10);
    const block = blocks.find((b) => b.id === blockId);
    if (block) {
      block.toggleNote(event.target);
    }
  });
