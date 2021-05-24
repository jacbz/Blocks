// @ts-ignore
import * as Tone from 'tone';
import { MusicVAE } from '@magenta/music/es6/music_vae';
import interact from 'interactjs';

import Block from './block';
import * as Constants from './constants';
import DrumKit from './drumkit';

let drumsVae: MusicVAE;

let isPlaying = false;
let currentStep: number;

const blocks: Block[] = [];
let hoveredCellElement: HTMLElement;

function drawBlocks() {
  const containerElement = document.getElementById('container');

  const mouseOver = (event: Event) => {
    hoveredCellElement = event.target as HTMLElement;
  };

  for (const block of blocks) {
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
  }
}

function finishLoading() {
  drumsVae.sample(Constants.NUMBER_OF_BLOCKS, Constants.TEMPERATURE).then((samples) => {
    console.log(samples);
    for (let i = 0; i < Constants.NUMBER_OF_BLOCKS; i += 1) {
      blocks.push(new Block(i, samples[i]));
    }
    drawBlocks();

    document.getElementById('loading').remove();
    document.getElementById('container').style.display = null;
  });
}

function init() {
  drumsVae = new MusicVAE(
    'https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/drums_2bar_hikl_small'
  );
  drumsVae.initialize().then(() => {
    finishLoading();
  });

  // drumsRnn = new rnn.MusicRNN(
  //   'https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/drum_kit_rnn'
  // );
  // Promise.all([
  //   drumsRnn.initialize()
  // ]).then(([vars]) => {
  //   document.getElementById('loading2').textContent += " Done.";
  // });
}

function play() {
  Tone.Transport.bpm.value = Constants.BPM;
  const smallestDivision = `${Constants.STEPS_PER_QUARTER * 4}n`; // default: 16th note

  currentStep = 0;
  Tone.Transport.scheduleRepeat((time: number) => {
    blocks.forEach((b) => b.playStep(currentStep, time));
    blocks.forEach((b) => {
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

// make blocks draggable
interact('.block').draggable({
  inertia: true,
  ignoreFrom: '.grid',
  modifiers: [
    interact.modifiers.restrictRect({
      restriction: 'parent',
      endOnly: true
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
interact('.cell')
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
        block.toggleNote(hoveredCellElement);
        moved.push(hoveredCellElement);
      }
    }
  })
  .styleCursor(false)
  // clear the canvas on doubletap
  .on('click', (event) => {
    const blockId = parseInt(event.target.getAttribute('block'), 10);
    const block = blocks.find((b) => b.id === blockId);
    block.toggleNote(event.target);
  });
