import { MusicVAE } from '@magenta/music/es6/music_vae';
import { Block } from './block';
import * as Constants from './constants';
import { DrumKit } from './drumkit';
// import * as rnn from '@magenta/music/node/music_rnn';

// @ts-ignore
import * as Tone from 'tone'
import interact from 'interactjs'

let drumsVae: MusicVAE;

let isPlaying = false;
let currentStep: number = undefined;

const temperature = 1.1;
const rnn_steps = 20;

const blocks: Block[] = [];
init();


function init() {
    drumsVae = new MusicVAE(
        'https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/drums_2bar_hikl_small'
    );
    drumsVae.initialize().then(_ => {
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

function finishLoading() {
    drumsVae
        .sample(2, temperature)
        .then((samples) => {
            console.log(samples);
            samples.forEach(s => blocks.push(new Block(s)));
            drawBlocks();
            
            document.getElementById('loading').remove();
            document.getElementById('container').style.display = null;
        });
}

function drawBlocks() {
    const containerElement = document.getElementById('container');
    for (const block of blocks) {
        const blockTemplate = document.getElementById('block-template') as HTMLTemplateElement;
        const blockElement = blockTemplate.content.cloneNode(true) as HTMLElement;
        block.element = blockElement.querySelector('.block');
        block.initGrid();
        containerElement.appendChild(blockElement);
    }
}

function play() {
    Tone.Transport.bpm.value = Constants.BPM;
    const smallestDivision = (Constants.STEPS_PER_QUARTER * 4) + 'n'; // default: 16th note

    currentStep = 0;
    Tone.Transport.scheduleRepeat((time: number) => {
        blocks.forEach(b => b.playStep(currentStep, time));
        blocks.forEach(b => b.updateStep(currentStep));
        currentStep = (currentStep + 1) % Constants.TOTAL_STEPS;
    }, smallestDivision);

    Tone.Transport.start();
}

function stop() {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    currentStep = undefined;
    blocks.forEach(b => b.updateGrid());
}

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

const drumkit = DrumKit.getInstance();
const container = document.querySelector('#test-panel');
for (let i = 0; i < Constants.DRUM_PITCHES.length; i++) {
    const button = document.createElement('button');
    button.innerText = Constants.DRUM_NAMES[i];
    button.addEventListener('click', () => {
        console.log(Constants.DRUM_NAMES[i]);
        Tone.Transport.start();
        Tone.Transport.schedule((time: number) => {
            drumkit.playNote(Constants.DRUM_PITCHES[i], time, undefined);
        }, "+0");
    });
    container.appendChild(button);
}

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
        start(event) {
            const target = event.target;
        },
        move(event) {
            const target = event.target;
            // keep the dragged position in the data-x/data-y attributes
            var x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx
            var y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy

            // translate the element
            target.style.transform = 'translate(' + x + 'px, ' + y + 'px)'

            // update the posiion attributes
            target.setAttribute('data-x', x)
            target.setAttribute('data-y', y)
        },
    }
})