export const TOTAL_STEPS = 32;
export const STEPS_PER_QUARTER = 4;
export const START_BPM = 120;

export const NUMBER_OF_BLOCKS_AT_START = 1;
export const INTERPOLATION_LENGTH = 40;

// see https://github.com/magenta/magenta-js/blob/master/music/src/core/constants.ts
export const DRUM_PITCHES = [36, 38, 42, 46, 45, 48, 50, 49, 51];
export const DRUM_NAMES = ['bass drum', 'snare drum', 'closed hi-hat', 'open hi-hat', 'low tom', 'mid tom', 'high tom', 'crash cymbal', 'ride cymbal'];

export const TEMPERATURE = 1.1;

export const PRESETS = [
  {
    name: 'Rock',
    notes: [
      { pitch: 36, quantizedStartStep: 0, quantizedEndStep: 1, isDrum: true },
      { pitch: 36, quantizedStartStep: 2, quantizedEndStep: 3, isDrum: true },
      { pitch: 38, quantizedStartStep: 4, quantizedEndStep: 5, isDrum: true },
      { pitch: 36, quantizedStartStep: 8, quantizedEndStep: 9, isDrum: true },
      { pitch: 36, quantizedStartStep: 10, quantizedEndStep: 11, isDrum: true },
      { pitch: 38, quantizedStartStep: 12, quantizedEndStep: 13, isDrum: true },
      { pitch: 36, quantizedStartStep: 16, quantizedEndStep: 17, isDrum: true },
      { pitch: 36, quantizedStartStep: 18, quantizedEndStep: 19, isDrum: true },
      { pitch: 38, quantizedStartStep: 20, quantizedEndStep: 21, isDrum: true },
      { pitch: 36, quantizedStartStep: 24, quantizedEndStep: 25, isDrum: true },
      { pitch: 36, quantizedStartStep: 26, quantizedEndStep: 27, isDrum: true },
      { pitch: 38, quantizedStartStep: 28, quantizedEndStep: 29, isDrum: true }
    ]
  }
];
