/* tslint:disable */

import * as assert from "assert";
import {MyBaseClass, MyExtendsClass, MyOtherExtendsClass} from "./../testFiles/inheritanceFile";

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
    private MyExtendsClassTestRunner: MyExtendsClassTestRunner;
    private MyOtherExtendsClassTestRunner: MyOtherExtendsClassTestRunner;
    private MyBaseClassTestRunner: MyBaseClassTestRunner;

    constructor(assertions?: Assertions) {
        this.assertions = new WrapperAssertions(assertions || new DefaultAssertions());
    }

    getStrictEqualTestRunner() {
        return new StrictEqualTestRunner(this.assertions);
    }

    getMyExtendsClassTestRunner() {
        if (this.MyExtendsClassTestRunner != null) {
            return this.MyExtendsClassTestRunner;
        }

        const vMyExtendsClassTestRunner = new MyExtendsClassTestRunner(this.assertions);
        this.MyExtendsClassTestRunner = vMyExtendsClassTestRunner;

        vMyExtendsClassTestRunner.initialize(this.getMyBaseClassTestRunner());

        return vMyExtendsClassTestRunner;
    }

    getMyOtherExtendsClassTestRunner() {
        if (this.MyOtherExtendsClassTestRunner != null) {
            return this.MyOtherExtendsClassTestRunner;
        }

        const vMyOtherExtendsClassTestRunner = new MyOtherExtendsClassTestRunner(this.assertions);
        this.MyOtherExtendsClassTestRunner = vMyOtherExtendsClassTestRunner;

        vMyOtherExtendsClassTestRunner.initialize(this.getMyBaseClassTestRunner());

        return vMyOtherExtendsClassTestRunner;
    }

    getMyBaseClassTestRunner() {
        if (this.MyBaseClassTestRunner != null) {
            return this.MyBaseClassTestRunner;
        }

        const vMyBaseClassTestRunner = new MyBaseClassTestRunner(this.assertions);
        this.MyBaseClassTestRunner = vMyBaseClassTestRunner;

        vMyBaseClassTestRunner.initialize();

        return vMyBaseClassTestRunner;
    }
}

export class StateTestRunner {
    constructor(private readonly factory: TestRunnerFactory) {
    }

    runMyExtendsClassTest(actual: MyExtendsClass, expected: MyExtendsClassTestStructure) {
        const testRunner = this.factory.getMyExtendsClassTestRunner();
        testRunner.runTest(actual, expected);
    }

    runMyOtherExtendsClassTest(actual: MyOtherExtendsClass, expected: MyOtherExtendsClassTestStructure) {
        const testRunner = this.factory.getMyOtherExtendsClassTestRunner();
        testRunner.runTest(actual, expected);
    }

    runMyBaseClassTest(actual: MyBaseClass, expected: MyBaseClassTestStructure) {
        const testRunner = this.factory.getMyBaseClassTestRunner();
        testRunner.runTest(actual, expected);
    }
}

export interface MyExtendsClassTestStructure extends MyBaseClassTestStructure {
    extendsProp: string;
}

export class MyExtendsClassTestRunner implements TestRunner<MyExtendsClass, MyExtendsClassTestStructure> {
    private MyBaseClassTestRunner: TestRunner<MyBaseClass, MyBaseClassTestStructure>;

    constructor(private readonly assertions: WrapperAssertions) {
    }

    initialize(MyBaseClassTestRunner: TestRunner<MyBaseClass, MyBaseClassTestStructure>) {
        this.MyBaseClassTestRunner = MyBaseClassTestRunner;
    }

    runTest(actual: MyExtendsClass, expected: MyExtendsClassTestStructure) {
        this.assertions.describe("MyExtendsClass", () => {
            if (this.assertions.isNull(actual, expected)) return;
            this.MyBaseClassTestRunner.runTest(actual, expected);
            this.assertions.describe("extendsProp", () => {
                let actualValue = actual.extendsProp;
                let expectedValue = expected.extendsProp;
                this.assertions.it("should have the same value", () => {
                    this.assertions.strictEqual(actualValue, expectedValue);
                });
            });
        });
    }
}

export interface MyOtherExtendsClassTestStructure extends MyBaseClassTestStructure {
}

export class MyOtherExtendsClassTestRunner implements TestRunner<MyOtherExtendsClass, MyOtherExtendsClassTestStructure> {
    private MyBaseClassTestRunner: TestRunner<MyBaseClass, MyBaseClassTestStructure>;

    constructor(private readonly assertions: WrapperAssertions) {
    }

    initialize(MyBaseClassTestRunner: TestRunner<MyBaseClass, MyBaseClassTestStructure>) {
        this.MyBaseClassTestRunner = MyBaseClassTestRunner;
    }

    runTest(actual: MyOtherExtendsClass, expected: MyOtherExtendsClassTestStructure) {
        this.assertions.describe("MyOtherExtendsClass", () => {
            if (this.assertions.isNull(actual, expected)) return;
            this.MyBaseClassTestRunner.runTest(actual, expected);
        });
    }
}

export interface MyBaseClassTestStructure {
    prop: number;
}

export class MyBaseClassTestRunner implements TestRunner<MyBaseClass, MyBaseClassTestStructure> {
    constructor(private readonly assertions: WrapperAssertions) {
    }

    initialize() {
    }

    runTest(actual: MyBaseClass, expected: MyBaseClassTestStructure) {
        this.assertions.describe("MyBaseClass", () => {
            if (this.assertions.isNull(actual, expected)) return;
            this.assertions.describe("prop", () => {
                let actualValue = actual.prop;
                let expectedValue = expected.prop;
                this.assertions.it("should have the same value", () => {
                    this.assertions.strictEqual(actualValue, expectedValue);
                });
            });
        });
    }
}

export function runMyExtendsClassTests(actual: MyExtendsClass, expected: MyExtendsClassTestStructure) {
    new TestRunnerFactory().getMyExtendsClassTestRunner().runTest(actual, expected);
}

export function runMyOtherExtendsClassTests(actual: MyOtherExtendsClass, expected: MyOtherExtendsClassTestStructure) {
    new TestRunnerFactory().getMyOtherExtendsClassTestRunner().runTest(actual, expected);
}

export function runMyBaseClassTests(actual: MyBaseClass, expected: MyBaseClassTestStructure) {
    new TestRunnerFactory().getMyBaseClassTestRunner().runTest(actual, expected);
}
