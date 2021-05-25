// @ts-ignore
import * as Tone from 'tone';
import { MusicVAE } from '@magenta/music/es6/music_vae';
import { MusicRNN } from '@magenta/music/es6/music_rnn';
import interact from 'interactjs';

import Block from './block';
import * as Constants from './constants';
import DrumKit from './drumkit';

let drumsVae: MusicVAE;
let drumsRnn: MusicRNN;

let isPlaying = false;
let currentStep: number;

const blocks: Block[] = [];

let hoveredCellElement: HTMLElement;
const containerElement = document.getElementById('container') as HTMLDivElement;
const volumeSlider = document.getElementById('volume') as HTMLInputElement;
volumeSlider.valueAsNumber = Constants.BPM;
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
    block.doMagic(drumsVae, drumsRnn);
  });

  const deleteButton = block.element.querySelector('#delete-button');
  deleteButton.addEventListener('click', () => {
    blocks.splice(blocks.indexOf(block), 1);
    // hide instead of delete: otherwise blocks would be moved by the resulting layout change
    block.element.style.visibility = 'hidden';
  });
}

function finishLoading() {
  drumsVae.sample(Constants.NUMBER_OF_BLOCKS_AT_START, Constants.TEMPERATURE).then((samples) => {
    for (let i = 0; i < Constants.NUMBER_OF_BLOCKS_AT_START; i += 1) {
      const block = new Block(i, samples[i]);
      blocks.push(block);
      initBlock(block);
    }

    document.getElementById('loading').remove();
    document.getElementById('container').style.display = null;
  });
}

function init() {
  drumsVae = new MusicVAE(
    'https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/drums_2bar_hikl_small'
  );
  drumsRnn = new MusicRNN(
    'https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/drum_kit_rnn'
  );

  Promise.all([
    drumsVae.initialize(),
    drumsRnn.initialize()
  ]).then(() => {
    finishLoading();
  });
}

function play() {
  const smallestDivision = `${Constants.STEPS_PER_QUARTER * 4}n`; // default: 16th note

  currentStep = 0;
  Tone.Transport.scheduleRepeat((time: number) => {
    blocks.forEach((b) => {
      b.playStep(currentStep, time)
      b.currentStep = currentStep;
      b.updateGrid();
    });
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
const drumkit = DrumKit.getInstance();
const container = document.querySelector('#test-panel');
for (let i = 0; i < Constants.DRUM_PITCHES.length; i += 1) {
  const button = document.createElement('button');
  button.innerText = Constants.DRUM_NAMES[i];
  button.addEventListener('click', () => {
    Tone.Transport.start();
    Tone.Transport.schedule((time: number) => {
      drumkit.playNote(Constants.DRUM_PITCHES[i], time, undefined);
    }, '+0');
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
    if (block){
      block.toggleNote(event.target);
    }
  });
