interface IBlockObject {
    element: HTMLElement;
    currentStep: number;
    muted: boolean;
    render(): void;
    getPitchesToPlay(): number[];
}

export default IBlockObject;
