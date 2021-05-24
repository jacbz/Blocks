/**
 * A singleton drum kit synthesizer with 9 pitch classes. Based on Magenta.js drumkit.
 *
 * @license
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// @ts-ignore
import * as Tone from 'tone';
import * as Constants from './constants';

class DrumKit {
  private static instance: DrumKit;

  // private DRUM_PITCH_TO_CLASS = new Map<number, number>();
  private bassDrum = new Tone.MembraneSynth({
    volume: -30
  }).toMaster();

  private lowTom = new Tone.MembraneSynth({
    pitchDecay: 0.008,
    envelope: { attack: 0.01, decay: 0.5, sustain: 0 },
    volume: -20
  }).toMaster();

  private midTom = new Tone.MembraneSynth({
    pitchDecay: 0.008,
    envelope: { attack: 0.01, decay: 0.5, sustain: 0 },
    volume: -20
  }).toMaster();

  private HighTom = new Tone.MembraneSynth({
    pitchDecay: 0.008,
    envelope: { attack: 0.01, decay: 0.5, sustain: 0 },
    volume: -20
  }).toMaster();

  private closedHihat = new Tone.MetalSynth({
    frequency: 400,
    envelope: { attack: 0.001, decay: 0.1, release: 0.8 },
    harmonicity: 5.1,
    modulationIndex: 32,
    resonance: 4000,
    octaves: 1,
    volume: -20
  }).toMaster();

  private openHihat = new Tone.MetalSynth({
    frequency: 400,
    envelope: {
      attack: 0.001, decay: 0.5, release: 0.8, sustain: 1
    },
    harmonicity: 5.1,
    modulationIndex: 32,
    resonance: 4000,
    octaves: 1,
    volume: -20
  }).toMaster();

  private rideCymbal = new Tone.MetalSynth({
    volume: -26
  }).toMaster();

  private crashCymbal = new Tone.MetalSynth({
    frequency: 300,
    envelope: { attack: 0.001, decay: 1, release: 3 },
    harmonicity: 5.1,
    modulationIndex: 64,
    resonance: 4000,
    octaves: 1.5,
    volume: -20
  }).toMaster();

  private snareDrum = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: {
      attack: 0.005, decay: 0.05, sustain: 0.1, release: 0.4
    },
    volume: -26
  }).toMaster();

  private pitchPlayers = [
    (time: number, velocity = 1) => this.bassDrum.triggerAttackRelease('C2', '8n', time, velocity),
    (time: number, velocity = 1) => this.snareDrum.triggerAttackRelease('16n', time, velocity),
    (time: number, velocity = 1) => this.closedHihat.triggerAttack(time, 0.3, velocity),
    (time: number, velocity = 1) => this.openHihat.triggerAttack(time, 0.3, velocity),
    (time: number, velocity = 0.5) => this.lowTom.triggerAttack('G3', time, velocity),
    (time: number, velocity = 0.5) => this.midTom.triggerAttack('C4', time, velocity),
    (time: number, velocity = 0.5) => this.HighTom.triggerAttack('F4', time, velocity),
    (time: number, velocity = 1) => this.crashCymbal.triggerAttack(time, 1.0, velocity),
    (time: number, velocity = 1) => this.rideCymbal.triggerAttack(time, 0.5, velocity)
  ];

  static getInstance() {
    if (!DrumKit.instance) {
      DrumKit.instance = new DrumKit();
    }
    return DrumKit.instance;
  }

  public playNote(pitch: number, time: number, velocity: number) {
    // this.closedHihat.frequency = new Tone.Signal(400);
    const pitchIndex = Constants.DRUM_PITCHES.indexOf(pitch);
    this.pitchPlayers[pitchIndex](time, velocity);
  }
}

export default DrumKit;
