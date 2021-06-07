export const TOTAL_STEPS = 32;
export const STEPS_PER_QUARTER = 4;
export const START_BPM = 120;

export const NUMBER_OF_BLOCKS_AT_START = 1;
export const INTERPOLATION_LENGTH = 40;

// see https://github.com/magenta/magenta-js/blob/master/music/src/core/constants.ts
export const DRUM_PITCHES = [36, 38, 42, 46, 45, 48, 50, 49, 51];
export const DRUM_NAMES = [
  'bass drum',
  'snare drum',
  'closed hi-hat',
  'open hi-hat',
  'low tom',
  'mid tom',
  'high tom',
  'crash cymbal',
  'ride cymbal'
];

export const TEMPERATURE = 1.1;

// some of these are adapted from https://www.onlinedrummer.com/
export const PRESETS = [
  {
    name: 'Standard',
    notes: [
      { pitch: 36, quantizedStartStep: 0, quantizedEndStep: 1, isDrum: true },
      { pitch: 38, quantizedStartStep: 4, quantizedEndStep: 5, isDrum: true },
      { pitch: 36, quantizedStartStep: 8, quantizedEndStep: 9, isDrum: true },
      { pitch: 38, quantizedStartStep: 12, quantizedEndStep: 13, isDrum: true },
      { pitch: 42, quantizedStartStep: 0, quantizedEndStep: 1, isDrum: true },
      { pitch: 42, quantizedStartStep: 2, quantizedEndStep: 3, isDrum: true },
      { pitch: 42, quantizedStartStep: 4, quantizedEndStep: 5, isDrum: true },
      { pitch: 42, quantizedStartStep: 6, quantizedEndStep: 7, isDrum: true },
      { pitch: 42, quantizedStartStep: 8, quantizedEndStep: 9, isDrum: true },
      { pitch: 42, quantizedStartStep: 10, quantizedEndStep: 11, isDrum: true },
      { pitch: 42, quantizedStartStep: 12, quantizedEndStep: 13, isDrum: true },
      { pitch: 42, quantizedStartStep: 14, quantizedEndStep: 15, isDrum: true },
      { pitch: 42, quantizedStartStep: 16, quantizedEndStep: 17, isDrum: true },
      { pitch: 42, quantizedStartStep: 18, quantizedEndStep: 19, isDrum: true },
      { pitch: 42, quantizedStartStep: 20, quantizedEndStep: 21, isDrum: true },
      { pitch: 42, quantizedStartStep: 22, quantizedEndStep: 23, isDrum: true },
      { pitch: 42, quantizedStartStep: 24, quantizedEndStep: 25, isDrum: true },
      { pitch: 42, quantizedStartStep: 26, quantizedEndStep: 27, isDrum: true },
      { pitch: 42, quantizedStartStep: 28, quantizedEndStep: 29, isDrum: true },
      { pitch: 42, quantizedStartStep: 30, quantizedEndStep: 31, isDrum: true },
      { pitch: 36, quantizedStartStep: 16, quantizedEndStep: 17, isDrum: true },
      { pitch: 38, quantizedStartStep: 20, quantizedEndStep: 21, isDrum: true },
      { pitch: 36, quantizedStartStep: 24, quantizedEndStep: 25, isDrum: true },
      { pitch: 38, quantizedStartStep: 28, quantizedEndStep: 29, isDrum: true }
    ]
  },
  {
    name: 'Rock I',
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
  },
  {
    name: 'Rock II',
    notes: [
      { pitch: 42, quantizedStartStep: 0, quantizedEndStep: 1, isDrum: true },
      { pitch: 42, quantizedStartStep: 2, quantizedEndStep: 3, isDrum: true },
      { pitch: 42, quantizedStartStep: 4, quantizedEndStep: 5, isDrum: true },
      { pitch: 42, quantizedStartStep: 6, quantizedEndStep: 7, isDrum: true },
      { pitch: 42, quantizedStartStep: 8, quantizedEndStep: 9, isDrum: true },
      { pitch: 42, quantizedStartStep: 10, quantizedEndStep: 11, isDrum: true },
      { pitch: 42, quantizedStartStep: 12, quantizedEndStep: 13, isDrum: true },
      { pitch: 42, quantizedStartStep: 14, quantizedEndStep: 15, isDrum: true },
      { pitch: 42, quantizedStartStep: 16, quantizedEndStep: 17, isDrum: true },
      { pitch: 42, quantizedStartStep: 18, quantizedEndStep: 19, isDrum: true },
      { pitch: 42, quantizedStartStep: 20, quantizedEndStep: 21, isDrum: true },
      { pitch: 42, quantizedStartStep: 22, quantizedEndStep: 23, isDrum: true },
      { pitch: 42, quantizedStartStep: 24, quantizedEndStep: 25, isDrum: true },
      { pitch: 42, quantizedStartStep: 26, quantizedEndStep: 27, isDrum: true },
      { pitch: 42, quantizedStartStep: 28, quantizedEndStep: 29, isDrum: true },
      { pitch: 42, quantizedStartStep: 30, quantizedEndStep: 31, isDrum: true },
      { pitch: 36, quantizedStartStep: 0, quantizedEndStep: 1, isDrum: true },
      { pitch: 36, quantizedStartStep: 8, quantizedEndStep: 9, isDrum: true },
      { pitch: 36, quantizedStartStep: 6, quantizedEndStep: 7, isDrum: true },
      { pitch: 36, quantizedStartStep: 14, quantizedEndStep: 15, isDrum: true },
      { pitch: 36, quantizedStartStep: 16, quantizedEndStep: 17, isDrum: true },
      { pitch: 36, quantizedStartStep: 22, quantizedEndStep: 23, isDrum: true },
      { pitch: 36, quantizedStartStep: 24, quantizedEndStep: 25, isDrum: true },
      { pitch: 36, quantizedStartStep: 26, quantizedEndStep: 27, isDrum: true },
      { pitch: 36, quantizedStartStep: 30, quantizedEndStep: 31, isDrum: true },
      { pitch: 38, quantizedStartStep: 4, quantizedEndStep: 5, isDrum: true },
      { pitch: 38, quantizedStartStep: 7, quantizedEndStep: 8, isDrum: true },
      { pitch: 38, quantizedStartStep: 12, quantizedEndStep: 13, isDrum: true },
      { pitch: 38, quantizedStartStep: 20, quantizedEndStep: 21, isDrum: true },
      { pitch: 38, quantizedStartStep: 23, quantizedEndStep: 24, isDrum: true },
      { pitch: 38, quantizedStartStep: 28, quantizedEndStep: 29, isDrum: true }
    ]
  },
  {
    name: 'Reggaeton',
    notes: [
      { pitch: 36, quantizedStartStep: 0, quantizedEndStep: 1, isDrum: true },
      { pitch: 38, quantizedStartStep: 3, quantizedEndStep: 4, isDrum: true },
      { pitch: 36, quantizedStartStep: 4, quantizedEndStep: 5, isDrum: true },
      { pitch: 38, quantizedStartStep: 6, quantizedEndStep: 7, isDrum: true },
      { pitch: 36, quantizedStartStep: 8, quantizedEndStep: 9, isDrum: true },
      { pitch: 38, quantizedStartStep: 11, quantizedEndStep: 12, isDrum: true },
      { pitch: 36, quantizedStartStep: 12, quantizedEndStep: 13, isDrum: true },
      { pitch: 38, quantizedStartStep: 14, quantizedEndStep: 15, isDrum: true },
      { pitch: 36, quantizedStartStep: 16, quantizedEndStep: 17, isDrum: true },
      { pitch: 38, quantizedStartStep: 19, quantizedEndStep: 20, isDrum: true },
      { pitch: 36, quantizedStartStep: 20, quantizedEndStep: 21, isDrum: true },
      { pitch: 38, quantizedStartStep: 22, quantizedEndStep: 23, isDrum: true },
      { pitch: 36, quantizedStartStep: 24, quantizedEndStep: 25, isDrum: true },
      { pitch: 38, quantizedStartStep: 27, quantizedEndStep: 28, isDrum: true },
      { pitch: 36, quantizedStartStep: 28, quantizedEndStep: 29, isDrum: true },
      { pitch: 38, quantizedStartStep: 30, quantizedEndStep: 31, isDrum: true },
      { pitch: 42, quantizedStartStep: 0, quantizedEndStep: 1, isDrum: true },
      { pitch: 42, quantizedStartStep: 2, quantizedEndStep: 3, isDrum: true },
      { pitch: 42, quantizedStartStep: 4, quantizedEndStep: 5, isDrum: true },
      { pitch: 42, quantizedStartStep: 6, quantizedEndStep: 7, isDrum: true },
      { pitch: 42, quantizedStartStep: 8, quantizedEndStep: 9, isDrum: true },
      { pitch: 42, quantizedStartStep: 10, quantizedEndStep: 11, isDrum: true },
      { pitch: 42, quantizedStartStep: 12, quantizedEndStep: 13, isDrum: true },
      { pitch: 42, quantizedStartStep: 14, quantizedEndStep: 15, isDrum: true },
      { pitch: 42, quantizedStartStep: 16, quantizedEndStep: 17, isDrum: true },
      { pitch: 42, quantizedStartStep: 18, quantizedEndStep: 19, isDrum: true },
      { pitch: 42, quantizedStartStep: 20, quantizedEndStep: 21, isDrum: true },
      { pitch: 42, quantizedStartStep: 22, quantizedEndStep: 23, isDrum: true },
      { pitch: 42, quantizedStartStep: 24, quantizedEndStep: 25, isDrum: true },
      { pitch: 42, quantizedStartStep: 26, quantizedEndStep: 27, isDrum: true },
      { pitch: 42, quantizedStartStep: 28, quantizedEndStep: 29, isDrum: true },
      { pitch: 42, quantizedStartStep: 30, quantizedEndStep: 31, isDrum: true }
    ]
  },
  {
    name: 'Hip Hop',
    notes: [
      { pitch: 46, quantizedStartStep: 1, quantizedEndStep: 2, isDrum: true },
      { pitch: 42, quantizedStartStep: 2, quantizedEndStep: 3, isDrum: true },
      { pitch: 42, quantizedStartStep: 4, quantizedEndStep: 5, isDrum: true },
      { pitch: 42, quantizedStartStep: 3, quantizedEndStep: 4, isDrum: true },
      { pitch: 42, quantizedStartStep: 5, quantizedEndStep: 6, isDrum: true },
      { pitch: 42, quantizedStartStep: 7, quantizedEndStep: 8, isDrum: true },
      { pitch: 42, quantizedStartStep: 6, quantizedEndStep: 7, isDrum: true },
      { pitch: 42, quantizedStartStep: 9, quantizedEndStep: 10, isDrum: true },
      { pitch: 42, quantizedStartStep: 10, quantizedEndStep: 11, isDrum: true },
      { pitch: 42, quantizedStartStep: 11, quantizedEndStep: 12, isDrum: true },
      { pitch: 42, quantizedStartStep: 12, quantizedEndStep: 13, isDrum: true },
      { pitch: 42, quantizedStartStep: 13, quantizedEndStep: 14, isDrum: true },
      { pitch: 42, quantizedStartStep: 14, quantizedEndStep: 15, isDrum: true },
      { pitch: 42, quantizedStartStep: 15, quantizedEndStep: 16, isDrum: true },
      { pitch: 46, quantizedStartStep: 17, quantizedEndStep: 18, isDrum: true },
      { pitch: 42, quantizedStartStep: 18, quantizedEndStep: 19, isDrum: true },
      { pitch: 42, quantizedStartStep: 19, quantizedEndStep: 20, isDrum: true },
      { pitch: 42, quantizedStartStep: 20, quantizedEndStep: 21, isDrum: true },
      { pitch: 42, quantizedStartStep: 21, quantizedEndStep: 22, isDrum: true },
      { pitch: 42, quantizedStartStep: 23, quantizedEndStep: 24, isDrum: true },
      { pitch: 42, quantizedStartStep: 26, quantizedEndStep: 27, isDrum: true },
      { pitch: 42, quantizedStartStep: 27, quantizedEndStep: 28, isDrum: true },
      { pitch: 42, quantizedStartStep: 28, quantizedEndStep: 29, isDrum: true },
      { pitch: 42, quantizedStartStep: 29, quantizedEndStep: 30, isDrum: true },
      { pitch: 42, quantizedStartStep: 30, quantizedEndStep: 31, isDrum: true },
      { pitch: 42, quantizedStartStep: 31, quantizedEndStep: 32, isDrum: true },
      { pitch: 36, quantizedStartStep: 0, quantizedEndStep: 1, isDrum: true },
      { pitch: 36, quantizedStartStep: 3, quantizedEndStep: 4, isDrum: true },
      { pitch: 38, quantizedStartStep: 4, quantizedEndStep: 5, isDrum: true },
      { pitch: 36, quantizedStartStep: 6, quantizedEndStep: 7, isDrum: true },
      { pitch: 36, quantizedStartStep: 8, quantizedEndStep: 9, isDrum: true },
      { pitch: 38, quantizedStartStep: 12, quantizedEndStep: 13, isDrum: true },
      { pitch: 36, quantizedStartStep: 16, quantizedEndStep: 17, isDrum: true },
      { pitch: 36, quantizedStartStep: 19, quantizedEndStep: 20, isDrum: true },
      { pitch: 38, quantizedStartStep: 20, quantizedEndStep: 21, isDrum: true },
      { pitch: 36, quantizedStartStep: 22, quantizedEndStep: 23, isDrum: true },
      { pitch: 38, quantizedStartStep: 28, quantizedEndStep: 29, isDrum: true },
      { pitch: 36, quantizedStartStep: 24, quantizedEndStep: 25, isDrum: true }
    ]
  }
];
