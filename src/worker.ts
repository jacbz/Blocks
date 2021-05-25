import { MusicVAE } from '@magenta/music/es6/music_vae';
import { MusicRNN } from '@magenta/music/es6/music_rnn';
import { INoteSequence } from '@magenta/music/es6/protobuf';
import * as Constants from './constants';

// eslint-disable-next-line no-restricted-globals
const ctx: Worker = self as any;

const drumsVae = new MusicVAE(
  'https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/drums_2bar_hikl_small'
);
const drumsRnn = new MusicRNN(
  'https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/drum_kit_rnn'
);

class WorkerData {
  // Inputs
  startLoading: boolean;

  numberOfSamples: number;

  sequenceToContinue: INoteSequence;

  // Outputs
  finishedLoading: boolean;

  samples: INoteSequence[];

  continuedSequence: INoteSequence;

  public constructor(init?: Partial<WorkerData>) {
    Object.assign(this, init);
  }
}

// Respond to message from parent thread
ctx.addEventListener('message', ({ data }: { data: WorkerData }) => {
  if (data.startLoading) {
    Promise.all([drumsVae.initialize(), drumsRnn.initialize()]).then(() => {
      ctx.postMessage(new WorkerData({ finishedLoading: true }));
    });
    return;
  }

  if (data.numberOfSamples) {
    drumsVae.sample(data.numberOfSamples, Constants.TEMPERATURE).then((samples) => {
      ctx.postMessage(new WorkerData({ samples }));
    });
    return;
  }

  if (data.sequenceToContinue) {
    drumsRnn
      .continueSequence(data.sequenceToContinue, Constants.TOTAL_STEPS, Constants.TEMPERATURE)
      .then((continuedSequence) => {
        ctx.postMessage(new WorkerData({ continuedSequence }));
      });
  }
});

export default WorkerData;
