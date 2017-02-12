/* tslint:disable */

import * as assert from "assert";
import {MyClass} from "./../testFiles/arrayFile";

export interface Assertions {
    describe(description: string, spec: () => void): void;
    it(expectation: string, assertion: () => void): void;
    strictEqual(actual: any, expected: any): void;
}

class DefaultAssertions implements Assertions {
    describe(description: string, spec: () => void) {
        describe(description, spec);
    }

    it(expectation: string, assertion: () => void) {
        it(expectation, assertion);
    }

    strictEqual(actual: any, expected: any) {
        assert.strictEqual(actual, expected);
    }
}

export class WrapperAssertions {
    private assertAnyCount = 0;

    constructor(private readonly assertions: Assertions) {
    }

    describe(description: string, spec: () => void) {
        this.assertions.describe(description, spec);
    }

    it(expectation: string, assertion: () => void) {
        if (this.assertAnyCount > 0) {
            assertion();
        }
        else {
            this.assertions.it(expectation, assertion);
        }
    }

    strictEqual(actual: any, expected: any) {
        this.assertions.strictEqual(actual, expected);
    }

    assertAny(...checks: (() => void)[]) {
        this.assertAnyCount++;
        try {
            let didOverallPass = false
            for (const check of checks) {
                let didPass = true;
                try {
                    check();
                } catch (err) {
                    didPass = false;
                }
                if (didPass) {
                    didOverallPass = true;
                    break;
                }
            }
            if (!didOverallPass) {
                throw new Error("Did not equal any of the union types.");
            }
        } finally {
            this.assertAnyCount--;
        }
    }

    isNull(actual: any, expected: any) {
        if (actual != null || expected == null) {
            return false;
        }
        this.it("should not be null", () => {
            throw new Error("It's null");
        });
        return true;
    }
}

export interface TestRunner<TActual, TExpected> {
    runTest(actual: TActual, expected: TExpected): void;
}

export class StrictEqualTestRunner implements TestRunner<any, any> {
    constructor(private readonly assertions: WrapperAssertions) {
    }

    runTest(actual: any, expected: any) {
        this.assertions.it("should have the same value", () => {
            this.assertions.strictEqual(actual, expected);
        });
    }
}

export class TestRunnerArgsCache<T extends TestRunner<any, any>> {
    private readonly items: { args: any[]; value: T; }[];

    constructor() {
        this.items = [];
    }

    getIndex(args: any[]) {
        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];
            if (args.length !== item.args.length) {
                continue;
            }

            let isMatch = true;
            for (let j = 0; j < args.length; j++) {
                if (args[j] !== item.args[j]) {
                    isMatch = false;
                    break;
                }
            }
            if (isMatch) {
                return i;
            }
        }

        return -1;
    }

    addItem(value: T, args: any[]) {
        this.items.push({ value, args });
    }

    getItemAtIndex(index: number) {
        return this.items[index].value;
    }
}

export class TestRunnerFactory {
    private readonly assertions: WrapperAssertions;
    private MyClassTestRunner: MyClassTestRunner;

    constructor(assertions?: Assertions) {
        this.assertions = new WrapperAssertions(assertions || new DefaultAssertions());
    }

    getStrictEqualTestRunner() {
        return new StrictEqualTestRunner(this.assertions);
    }

    getMyClassTestRunner() {
        if (this.MyClassTestRunner != null) {
            return this.MyClassTestRunner;
        }

        const vMyClassTestRunner = new MyClassTestRunner(this.assertions);
        this.MyClassTestRunner = vMyClassTestRunner;

        vMyClassTestRunner.initialize();

        return vMyClassTestRunner;
    }
}

export class StateTestRunner {
    constructor(private readonly factory: TestRunnerFactory) {
    }

    runMyClassTest(actual: MyClass, expected: MyClassTestStructure) {
        const testRunner = this.factory.getMyClassTestRunner();
        testRunner.runTest(actual, expected);
    }
}

export interface MyClassTestStructure {
    prop: string[];
    prop2: (number[] | MyClassTestStructure)[];
}

export class MyClassTestRunner implements TestRunner<MyClass, MyClassTestStructure> {
    constructor(private readonly assertions: WrapperAssertions) {
    }

    initialize() {
    }

    runTest(actual: MyClass, expected: MyClassTestStructure) {
        this.assertions.describe("MyClass", () => {
            if (this.assertions.isNull(actual, expected)) return;
            this.assertions.describe("prop", () => {
                let actualValue = actual.prop;
                let expectedValue = expected.prop;
                this.assertions.it("should have the same length", () => {
                    this.assertions.strictEqual(actualValue!.length, expectedValue!.length);
                });
                for (let i = 0; i < (expectedValue || []).length; i++) {
                    ((actualValue, expectedValue, i) => {
                        this.assertions.describe(`index ${i}`, () => {
                            this.assertions.it("should have the same value", () => {
                                this.assertions.strictEqual(actualValue, expectedValue);
                            });
                        });
                    })(actualValue[i], expectedValue![i], i);
                }
            });
            this.assertions.describe("prop2", () => {
                let actualValue = actual.prop2;
                let expectedValue = expected.prop2;
                this.assertions.it("should have the same length", () => {
                    this.assertions.strictEqual(actualValue!.length, expectedValue!.length);
                });
                for (let i = 0; i < (expectedValue || []).length; i++) {
                    ((actualValue, expectedValue, i) => {
                        this.assertions.describe(`index ${i}`, () => {
                            this.assertions.it("should equal one of the union types", () => {
                                this.assertions.assertAny(() => {
                                    ((actualValue, expectedValue) => {
                                        this.assertions.it("should have the same length", () => {
                                            this.assertions.strictEqual(actualValue!.length, expectedValue!.length);
                                        });
                                        for (let i = 0; i < (expectedValue || []).length; i++) {
                                            ((actualValue, expectedValue, i) => {
                                                this.assertions.describe(`index ${i}`, () => {
                                                    this.assertions.it("should have the same value", () => {
                                                        this.assertions.strictEqual(actualValue, expectedValue);
                                                    });
                                                });
                                            })(actualValue[i], expectedValue![i], i);
                                        }
                                    })(actualValue as number[], expectedValue as number[]);
                                }, () => {
                                    ((actualValue, expectedValue) => {
                                        this.runTest(actualValue as any as MyClass, expectedValue as any as MyClassTestStructure);
                                    })(actualValue as MyClass, expectedValue as MyClassTestStructure);
                                });
                            });
                        });
                    })(actualValue[i], expectedValue![i], i);
                }
            });
        });
    }
}

export function runMyClassTests(actual: MyClass, expected: MyClassTestStructure) {
    new TestRunnerFactory().getMyClassTestRunner().runTest(actual, expected);
}
