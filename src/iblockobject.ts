import { INoteSequence } from '@magenta/music/es6/protobuf';

interface IBlockObject {
    element: HTMLElement;
    currentStep: number;
    muted: boolean;
    render(): void;
    getPitchesToPlay(): number[];
    getNoteSequence(): INoteSequence;
}

export default IBlockObject;
