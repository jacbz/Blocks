interface IBlockObject {
    element: HTMLElement;
    currentStep: number;
    muted: boolean;
    init(): void;
    render(): void;
    getPitchesToPlay(): number[];
    toggleMute(): void;
}

export default IBlockObject;
