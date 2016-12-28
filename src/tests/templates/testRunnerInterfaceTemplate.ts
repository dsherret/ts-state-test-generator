export const testRunnerInterfaceTemplate =
`export interface TestRunner<TActual, TExpected> {
    runTest(actual: TActual, expected: TExpected): void;
}`;
