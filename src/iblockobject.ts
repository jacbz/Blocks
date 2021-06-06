interface IBlockObject {
    element: HTMLElement;
    currentStep: number;
    init(): void;
    render(): void;
    getPitchesToPlay(): number[];
}

export default IBlockObject;
