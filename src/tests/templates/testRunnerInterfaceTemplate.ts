export const testRunnerInterfaceTemplate =
`export interface TestRunner<TActual, TExpected> {
    runTest(actual: TActual, expected: TExpected): void;
}

export interface TestRunnerConstructor<T extends TestRunner<any, any>> {
    new(): T;
}

export class StrictEqualTestRunner implements TestRunner<any, any> {
    constructor(private readonly assertions: WrapperAssertions) {
    }

    runTest(actual: any, expected: any) {
        this.assertions.strictEqual(actual, expected);
    }
}`;
