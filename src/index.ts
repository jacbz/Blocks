import * as Tone from 'tone';
import * as Constants from './constants';
import AppWorker from './worker';
import BlockManager from './blockmanager';

const containerElement = document.getElementById('container') as HTMLDivElement;
const volumeSlider = document.getElementById('volume') as HTMLInputElement;
const volumeLabel = document.getElementById('bpm') as HTMLSpanElement;
const drumkitSwitch = document.getElementById('drumkit') as HTMLInputElement;

AppWorker.init(new Worker(new URL('./worker.ts', import.meta.url)));
const blockManager = new BlockManager(containerElement);

init();
function init() {
  AppWorker.load().then((finishedLoading) => {
    if (finishedLoading) {
      initStartingBlocks();
    }
  });
}

function initStartingBlocks() {
  AppWorker.generateSamples(1).then((samples) => {
    const block = blockManager.createBlock(samples[0]);
    block.setPosition(256, 256);
    finishLoading();
  });
}

function finishLoading() {
  document.getElementById('loading').remove();
  document.getElementById('contents').style.display = null;
  blockManager.initPresets();
}

// play button
const btn = document.getElementById('play-button') as HTMLButtonElement;
btn.addEventListener('click', () => {
  if (blockManager.isPlaying) {
    blockManager.stop();
    btn.innerText = 'Play';
    blockManager.isPlaying = false;
  } else {
    Tone.start().then(() => {
      blockManager.play();
    });
    btn.innerText = 'Stop';
    blockManager.isPlaying = true;
  }
});

// volume slider
volumeSlider.addEventListener('input', () => {
  Tone.Transport.bpm.value = volumeSlider.valueAsNumber;
  volumeLabel.innerText = volumeSlider.value;
});
volumeSlider.valueAsNumber = Constants.START_BPM;

// drumkit switch
drumkitSwitch.addEventListener('change', (event) => {
  blockManager.toggleDrumkit();
});
