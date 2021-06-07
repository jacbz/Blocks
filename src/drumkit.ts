import * as Tone from 'tone';
import * as Constants from './constants';

interface IDrumKit {
  playNote(pitch: number, time: any, count: number): void;
}

/**
 * A singleton drum kit synthesizer with 9 pitch classes. Based on Magenta.js drumkit.
 */
class SynthDrumKit implements IDrumKit {
  private _pitchPlayers: any[];

  constructor() {
    const bassDrum = new Tone.MembraneSynth({
      volume: -3
    }).toDestination();

    const snareDrum = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: {
        attack: 0.005,
        decay: 0.05,
        sustain: 0.1,
        release: 0.4
      },
      volume: 0
    }).toDestination();

    const closedHihat = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.1, release: 0.8 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1,
      volume: -10
    }).toDestination();

    const openHihat = new Tone.MetalSynth({
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

    const lowTom = new Tone.MembraneSynth({
      pitchDecay: 0.008,
      envelope: { attack: 0.01, decay: 0.5, sustain: 0 },
      volume: -3
    }).toDestination();

    const midTom = new Tone.MembraneSynth({
      pitchDecay: 0.008,
      envelope: { attack: 0.01, decay: 0.5, sustain: 0 },
      volume: -3
    }).toDestination();

    const highTom = new Tone.MembraneSynth({
      pitchDecay: 0.008,
      envelope: { attack: 0.01, decay: 0.5, sustain: 0 },
      volume: -3
    }).toDestination();

    const crashCymbal = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 1, release: 3 },
      harmonicity: 5.1,
      modulationIndex: 64,
      resonance: 4000,
      octaves: 1.5,
      volume: 3
    }).toDestination();

    const rideCymbal = new Tone.MetalSynth({
      volume: -10
    }).toDestination();

    this._pitchPlayers = [
      (time: any, velocity: number) => bassDrum.triggerAttackRelease('C2', '8n', time, velocity),
      (time: any, velocity: number) => snareDrum.triggerAttackRelease('16n', time, velocity),
      (time: any, velocity: number) => closedHihat.triggerAttackRelease('G4', 0.3, time, velocity),
      (time: any, velocity: number) => openHihat.triggerAttackRelease('G4', 0.3, time, velocity),
      (time: any, velocity: number) => lowTom.triggerAttack('G3', time, velocity),
      (time: any, velocity: number) => midTom.triggerAttack('C4', time, velocity),
      (time: any, velocity: number) => highTom.triggerAttack('F4', time, velocity),
      (time: any, velocity: number) => crashCymbal.triggerAttackRelease('D4', 1.0, time, velocity),
      (time: any, velocity: number) => rideCymbal.triggerAttackRelease('D4', 1.0, time, velocity)
    ];
  }

  public playNote(pitch: number, time: any, count: number): void {
    const pitchIndex = Constants.DRUM_PITCHES.indexOf(pitch);
    const velocity = Math.min(0.3, 0.1 + (count - 1) * 0.07);
    this._pitchPlayers[pitchIndex](time, velocity);
  }
}

/**
 * A sample-based drumkit by Google, licensed under Apache License, Version 2.0
 */
class PlayerDrumKit implements IDrumKit {
  private _urls = Constants.DRUM_PITCHES.map((pitch) => `./drums/${pitch}.mp3`);

  private _volumes = [-6, -10, -4, -4, -10, -10, -10, -2, -2];

  private _players: Tone.Players;

  constructor() {
    this._players = new Tone.Players(
      this._urls.reduce((toneAudioBuffersUrlMap: Tone.ToneAudioBuffersUrlMap, url, index) => {
        toneAudioBuffersUrlMap[`${index}`] = url;
        return toneAudioBuffersUrlMap;
      }, {}),
      () => {
        this._volumes.forEach((volume, index) => {
          this._players.player(`${index}`).volume.value = volume;
        });
      }
    ).toDestination();
  }

  public playNote(pitch: number, time: any, count: number): void {
    const pitchIndex = Constants.DRUM_PITCHES.indexOf(pitch);
    this._players.player(`${pitchIndex}`).start(time, 0);
  }
}

export { SynthDrumKit, PlayerDrumKit, IDrumKit };
