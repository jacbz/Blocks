import { INoteSequence, NoteSequence } from "@magenta/music/es6/protobuf/index";
import * as Constants from './constants';
import { DrumKit } from "./drumkit";

export class Block {
    id: number;
    noteSequence: INoteSequence;
    element: HTMLElement;

    constructor(id: number, noteSequence: INoteSequence) {
        this.id = id;
        this.noteSequence = noteSequence;
    }

    initGrid() {
        const gridElement = this.element.querySelector('.grid');
        for (let row = 0; row < Constants.DRUM_PITCHES.length; row++) {
            const rowElement = document.createElement('div');
            rowElement.classList.add('row');
            rowElement.setAttribute('block', this.id.toString());
            rowElement.setAttribute('row', row.toString());
            gridElement.appendChild(rowElement);

            for (let col = 0; col < Constants.TOTAL_STEPS; col++) {
                const cellElement = document.createElement('div');
                cellElement.classList.add('cell');
                
                cellElement.setAttribute('block', this.id.toString());
                cellElement.setAttribute('row', row.toString());
                cellElement.setAttribute('col', col.toString());
                rowElement.appendChild(cellElement);
            }
        }
        this.updateGrid();
    }

    updateGrid() {
        // reset class names
        this.element.querySelectorAll('.cell').forEach(cell => cell.className = 'cell');

        const gridElement = this.element.querySelector('.grid');
        for (const note of this.noteSequence.notes) {
            for (let step = note.quantizedStartStep; step < note.quantizedEndStep; step++) {
                const rowIndex = this.pitchToRowIndex(note.pitch);
                gridElement.children[rowIndex].children[step].classList.add('active');
            }
        }
    }

    // updates with step highlighted
    updateStep(step: number) {
        this.updateGrid();
        if (step === undefined) {
            return;
        }

        const gridElement = this.element.querySelector('.grid');
        for (let row = 0; row < Constants.DRUM_PITCHES.length; row++) {
            // console.log(`row ${row}, step ${step}`);
            (gridElement.querySelectorAll('.row')[row].querySelectorAll('.cell')[step] as HTMLElement).classList.add('current');
        }
    }

    playStep(step: number, time: number) {
        const drumkit = DrumKit.getInstance();

        for(const note of this.noteSequence.notes.filter(n => n.quantizedStartStep === step)) {
            const velocity = note.hasOwnProperty('velocity') ? note.velocity / Constants.MAX_MIDI_VELOCITY : undefined;    
            drumkit.playNote(note.pitch, time, velocity);
        }
    }

    toggleNote(cellElement: HTMLElement) {
        const pitch = this.rowIndexToPitch(parseInt(cellElement.getAttribute('row')));
        const step = parseInt(cellElement.getAttribute('col'));

        console.log(`${this.id},${pitch}, ${step}`)

        if (cellElement.classList.contains('active')) {
            this.removeNote(pitch, step);
        } else {
            this.addNote(pitch, step);
        }
        this.updateGrid();
    }

    addNote(pitch: number, step: number) {
        if (!this.noteSequence.notes.find(n => n.pitch === pitch && n.quantizedStartStep === step && n.quantizedEndStep === step + 1)) {
            this.noteSequence.notes.push({
                pitch,
                quantizedStartStep: step,
                quantizedEndStep: step + 1,
                isDrum: true
            });
        }
    }

    removeNote(pitch: number, step: number) {
        console.log(this.noteSequence.notes);
        this.noteSequence.notes = this.noteSequence.notes.filter(n => n.pitch !== pitch || n.quantizedStartStep !== step || n.quantizedEndStep !== step + 1);
        console.log(this.noteSequence.notes);
        // let addedToExisting = false;
        // for(const note of this.noteSequence.notes.filter(n => n.pitch === pitch && n.quantizedStartStep <= step && n.quantizedEndStep > step)) {
        //     console.log(note);
        // }
    }

    // e.g. 0 -> 51
    rowIndexToPitch(row: number) {
        return Constants.DRUM_PITCHES[Constants.DRUM_PITCHES.length - row - 1];
    }

    // invert, since lower pitch means higher index, e.g. 36 -> 6
    pitchToRowIndex(pitch: number) {
        return Constants.DRUM_PITCHES.length - Constants.DRUM_PITCHES.indexOf(pitch) - 1;
    }
}