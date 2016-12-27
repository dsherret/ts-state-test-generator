export const testInterfaceTemplate =
`export interface Test<TActual, TExpected> {
    runTest(actual: TActual, expected: TExpected): void;
}`;
