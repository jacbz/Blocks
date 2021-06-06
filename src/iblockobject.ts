interface IBlockObject {
    element: HTMLElement;
    currentStep: number;
    muted: boolean;
    render(): void;
    getPitchesToPlay(): number[];
    toggleMute(): void;
}

export default IBlockObject;
