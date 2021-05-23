// import * as core from '@magenta/music/es6/core';
import { MusicVAE } from '@magenta/music/es6/music_vae';
import { Block } from './block';
// import * as Tone from 'tone'
// import * as Constants from './constants';
// import * as rnn from '@magenta/music/node/music_rnn';

let drumsVae: MusicVAE;

// let isPlaying = false;

const temperature = 1.1;
// const rnn_steps = 20;

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
    document.getElementById('loading').remove();
    drumsVae
        .sample(2, temperature)
        .then((samples) => {
            console.log(samples);
            samples.forEach(s => blocks.push(new Block(s)));
            drawBlocks();
        });
}

function drawBlocks() {
    const containerElement = document.getElementById('container');
    for(const block of blocks) {
        const blockTemplate = document.getElementById('block-template') as HTMLTemplateElement;
        const blockElement = blockTemplate.content.cloneNode(true) as HTMLElement;
        block.element = blockElement.querySelector('.block');
        block.initGrid();      
        containerElement.appendChild(blockElement);
    }
}