/* eslint-disable max-classes-per-file */
import { MusicVAE } from '@magenta/music/es6/music_vae';
import { MusicRNN } from '@magenta/music/es6/music_rnn';
import { INoteSequence } from '@magenta/music/es6/protobuf';
import * as Constants from './constants';

// eslint-disable-next-line no-restricted-globals
const context: Worker = self as any;

const drumsVae = new MusicVAE(
  'https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/drums_2bar_hikl_small'
);
const drumsRnn = new MusicRNN(
  'https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/drum_kit_rnn'
);

class AppWorker {
  static instance: Worker;

  static init(worker: Worker) {
    AppWorker.instance = worker;
  }

  static load(): Promise<boolean> {
    return new Promise((resolve) => {
      AppWorker.instance.postMessage({
        startLoading: true
      });

      AppWorker.instance.onmessage = ({ data }) => {
        resolve(data.finishedLoading);
      };
    });
  }

  static generateSamples(numberOfSamples: number): Promise<INoteSequence[]> {
    return new Promise((resolve) => {
      AppWorker.instance.postMessage({
        numberOfSamples
      });

      AppWorker.instance.onmessage = ({ data }) => {
        resolve(data.samples);
      };
    });
  }

  static getContinuedSequence(noteSequence: INoteSequence): Promise<INoteSequence> {
    return new Promise((resolve) => {
      AppWorker.instance.postMessage({
        sequenceToContinue: noteSequence
      });

      AppWorker.instance.onmessage = ({ data }) => {
        resolve(data.continuedSequence);
      };
    });
  }
}

context.onmessage = async ({ data }) => {
  if (data.startLoading) {
    await drumsVae.initialize();
    await drumsRnn.initialize();
    context.postMessage({ finishedLoading: true });
    return;
  }

  if (data.numberOfSamples) {
    const samples = await drumsVae.sample(data.numberOfSamples, Constants.TEMPERATURE);
    context.postMessage({ samples });
    return;
  }

  if (data.sequenceToContinue) {
    const continuedSequence = await drumsRnn.continueSequence(
      data.sequenceToContinue,
      Constants.TOTAL_STEPS,
      Constants.TEMPERATURE
    );
    context.postMessage({ continuedSequence });
  }
};

export default AppWorker;
