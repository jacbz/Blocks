import * as Tone from 'tone';
import * as Constants from './constants';
import AppWorker from './worker';
import BlockManager from './blockmanager';

const containerElement = document.getElementById('container') as HTMLDivElement;
const playButton = document.getElementById('play-button') as HTMLButtonElement;
const tempoSlider = document.getElementById('volume') as HTMLInputElement;
const tempoLabel = document.getElementById('bpm') as HTMLSpanElement;
const tempoDisplay = document.getElementById('tempo-display') as HTMLDivElement;
const drumkitSwitch = document.getElementById('drumkit') as HTMLInputElement;

AppWorker.init(new Worker(new URL('./worker.ts', import.meta.url)));
const blockManager = new BlockManager(containerElement);

if (matchMedia('(hover: none), (pointer: coarse)').matches) {
  document.getElementById('loading-text').textContent = 'Sorry. Touchscreens are not supported.';
} else {
  init();
}

function init() {
  AppWorker.load().then((finishedLoading) => {
    if (finishedLoading) {
      finishLoading();
    }
  });
}

function finishLoading() {
  document.getElementById('loading').remove();
  document.getElementById('contents').style.display = null;
  document.getElementById('contents').style.opacity = '1';
  blockManager.initTemplates();
}

// play button
playButton.addEventListener('click', () => {
  if (blockManager.isPlaying) {
    blockManager.stop();
    playButton.classList.toggle('isplaying', false);
    blockManager.isPlaying = false;
  } else {
    Tone.start().then(() => {
      blockManager.play();
    });
    playButton.classList.toggle('isplaying', true);
    blockManager.isPlaying = true;
  }
});

function adjustTempoLabelPosition() {
  const sliderWidth = tempoSlider.offsetWidth;
  const knobWidth = 18;
  const tempoDisplayWidth = tempoDisplay.offsetWidth;
  tempoDisplay.style.left = `${
    ((sliderWidth - knobWidth) / (Constants.MAX_BPM - Constants.MIN_BPM)) *
      (tempoSlider.valueAsNumber - Constants.MIN_BPM) -
    (tempoDisplayWidth / 2 - knobWidth / 2)
  }px`;
}

// volume slider
tempoSlider.addEventListener('input', () => {
  Tone.Transport.bpm.value = tempoSlider.valueAsNumber;
  tempoLabel.innerText = tempoSlider.value;
  adjustTempoLabelPosition();
});
tempoSlider.addEventListener('mousedown', () => {
  tempoDisplay.classList.add('active');
});
tempoSlider.addEventListener('mouseup', () => {
  tempoDisplay.classList.remove('active');
});
tempoSlider.min = `${Constants.MIN_BPM}`;
tempoSlider.max = `${Constants.MAX_BPM}`;
tempoSlider.valueAsNumber = Constants.START_BPM;
adjustTempoLabelPosition();

// drumkit switch
drumkitSwitch.addEventListener('change', (event) => {
  blockManager.toggleDrumkit();
});
