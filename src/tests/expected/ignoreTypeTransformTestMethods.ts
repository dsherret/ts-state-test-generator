/* tslint:disable */

import * as assert from "assert";
import {MyClass} from "./../testFiles/ignoreTypeTransformFile";

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
    unionProp: (string);
    intersectionProp: (string);
}

export class MyClassTestRunner implements TestRunner<MyClass, MyClassTestStructure> {
    constructor(private readonly assertions: WrapperAssertions) {
    }

    initialize() {
    }

    runTest(actual: MyClass, expected: MyClassTestStructure) {
        this.assertions.describe("MyClass", () => {
            if (this.assertions.isNull(actual, expected)) return;
            this.assertions.describe("unionProp", () => {
                let actualValue = actual.unionProp;
                let expectedValue = expected.unionProp;
                this.assertions.it("should have the same value", () => {
                    this.assertions.strictEqual(actualValue, expectedValue);
                });this.assertions.it("should have the same value", () => {
                    this.assertions.strictEqual(actualValue, expectedValue);
                });
            });
            this.assertions.describe("intersectionProp", () => {
                let actualValue = actual.intersectionProp;
                let expectedValue = expected.intersectionProp;
                this.assertions.it("should have the same value", () => {
                    this.assertions.strictEqual(actualValue, expectedValue);
                });
            });
        });
    }
}

export function runMyClassTests(actual: MyClass, expected: MyClassTestStructure) {
    new TestRunnerFactory().getMyClassTestRunner().runTest(actual, expected);
}
