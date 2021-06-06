import * as Tone from 'tone';
import * as Constants from './constants';
import DrumKit from './drumkit';
import AppWorker from './worker';
import BlockManager from './blockmanager';

const containerElement = document.getElementById('container') as HTMLDivElement;
const volumeSlider = document.getElementById('volume') as HTMLInputElement;
const volumeLabel = document.getElementById('bpm') as HTMLSpanElement;

AppWorker.init(new Worker(new URL('./worker.ts', import.meta.url)));
const blockManager = new BlockManager(containerElement);
const drumkit = DrumKit.getInstance();
let isPlaying = false;
let currentStep: number;

init();
function init() {
  AppWorker.load().then((finishedLoading) => {
    if (finishedLoading) {
      initStartingBlocks();
    }
  });
}

function initStartingBlocks() {
  AppWorker.generateSamples(Constants.NUMBER_OF_BLOCKS_AT_START).then((samples) => {
    for (const sample of samples) {
      blockManager.createBlock(sample);
    }

    finishLoading();
  });
}

function finishLoading() {
  document.getElementById('loading').remove();
  document.getElementById('contents').style.display = null;
}

function play() {
  const smallestDivision = `${Constants.STEPS_PER_QUARTER * 4}n`; // default: 16th note

  currentStep = 0;
  Tone.Transport.scheduleRepeat((time: number) => {
    const pitchToCountMap = new Map<number, number>();
    blockManager.do((b) => {
      b.currentStep = currentStep;
      b.getPitchesToPlay().forEach((p) => {
        pitchToCountMap.set(p, pitchToCountMap.get(p) ? pitchToCountMap.get(p) + 1 : 1);
      });
      b.render();
    });

    for (const [pitch, count] of pitchToCountMap) {
      drumkit.playNote(pitch, time, count);
    }

    currentStep += 1;
  }, smallestDivision);

  Tone.Transport.start();
}

function stop() {
  Tone.Transport.stop();
  Tone.Transport.cancel();
  currentStep = undefined;
  blockManager.do((b) => {
    b.currentStep = undefined;
    b.render();
  });
}

// play button
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

// new block button
document.getElementById('new-button').addEventListener('click', () => {
  blockManager.createBlock();
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
volumeSlider.valueAsNumber = Constants.START_BPM;
