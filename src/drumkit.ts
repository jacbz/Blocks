import * as Tone from 'tone';
import { Player } from 'tone';
import * as Constants from './constants';

interface IDrumKit {
  playNote(pitch: number, time: any, count: number): void;
}

/**
 * A singleton drum kit synthesizer with 9 pitch classes. Based on Magenta.js drumkit.
 */
class SynthDrumKit implements IDrumKit {
  private bassDrum = new Tone.MembraneSynth({
    volume: -3
  }).toDestination();

  private snareDrum = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: {
      attack: 0.005,
      decay: 0.05,
      sustain: 0.1,
      release: 0.4
    },
    volume: 0
  }).toDestination();

  private closedHihat = new Tone.MetalSynth({
    envelope: { attack: 0.001, decay: 0.1, release: 0.8 },
    harmonicity: 5.1,
    modulationIndex: 32,
    resonance: 4000,
    octaves: 1,
    volume: -10
  }).toDestination();

  private openHihat = new Tone.MetalSynth({
    envelope: {
      attack: 0.001,
      decay: 0.5,
      release: 0.8,
      sustain: 1
    },
    harmonicity: 5.1,
    modulationIndex: 32,
    resonance: 4000,
    octaves: 1,
    volume: -10
  }).toDestination();

  private lowTom = new Tone.MembraneSynth({
    pitchDecay: 0.008,
    envelope: { attack: 0.01, decay: 0.5, sustain: 0 },
    volume: -3
  }).toDestination();

  private midTom = new Tone.MembraneSynth({
    pitchDecay: 0.008,
    envelope: { attack: 0.01, decay: 0.5, sustain: 0 },
    volume: -3
  }).toDestination();

  private highTom = new Tone.MembraneSynth({
    pitchDecay: 0.008,
    envelope: { attack: 0.01, decay: 0.5, sustain: 0 },
    volume: -3
  }).toDestination();

  private crashCymbal = new Tone.MetalSynth({
    envelope: { attack: 0.001, decay: 1, release: 3 },
    harmonicity: 5.1,
    modulationIndex: 64,
    resonance: 4000,
    octaves: 1.5,
    volume: 3
  }).toDestination();

  private rideCymbal = new Tone.MetalSynth({
    volume: -10
  }).toDestination();

  private pitchPlayers = [
    (time: any, velocity: number) => this.bassDrum.triggerAttackRelease('C2', '8n', time, velocity),
    (time: any, velocity: number) => this.snareDrum.triggerAttackRelease('16n', time, velocity),
    (time: any, velocity: number) => this.closedHihat.triggerAttackRelease('G4', 0.3, time, velocity),
    (time: any, velocity: number) => this.openHihat.triggerAttackRelease('G4', 0.3, time, velocity),
    (time: any, velocity: number) => this.lowTom.triggerAttack('G3', time, velocity),
    (time: any, velocity: number) => this.midTom.triggerAttack('C4', time, velocity),
    (time: any, velocity: number) => this.highTom.triggerAttack('F4', time, velocity),
    (time: any, velocity: number) => this.crashCymbal.triggerAttackRelease('D4', 1.0, time, velocity),
    (time: any, velocity: number) => this.rideCymbal.triggerAttackRelease('D4', 1.0, time, velocity)
  ];

  public playNote(pitch: number, time: any, count: number): void {
    const pitchIndex = Constants.DRUM_PITCHES.indexOf(pitch);
    const velocity = Math.min(0.3, 0.1 + (count - 1) * 0.07);
    this.pitchPlayers[pitchIndex](time, velocity);
  }
}

/**
 * A sample-based drumkit by Google, licensed under Apache License, Version 2.0
 */
class PlayerDrumKit implements IDrumKit {
  private _urls = Constants.DRUM_PITCHES.map((pitch) => `/drums/${pitch}.mp3`);

  private _players: Player[];

  constructor() {
    this._players = this._urls.map((url) => {
      const player = new Tone.Player(url).toDestination();
      player.volume.value = -10;
      return player;
    });
  }

  public playNote(pitch: number, time: any, count: number): void {
    const pitchIndex = Constants.DRUM_PITCHES.indexOf(pitch);
    this._players[pitchIndex].start(time, 0);
  }
}

export { SynthDrumKit, PlayerDrumKit };
