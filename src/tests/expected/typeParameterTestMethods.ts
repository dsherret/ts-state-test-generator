/* tslint:disable */

import * as assert from "assert";
import {MyClass, MyExtendsClass, MyTypeParameterClass} from "./../testFiles/typeParameterFile";

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
    private readonly MyClassTestRunnerArgsCache = new TestRunnerArgsCache<MyClassTestRunner<any, any>>();
    private readonly MyTypeParameterClassTestRunnerArgsCache = new TestRunnerArgsCache<MyTypeParameterClassTestRunner<any, any, any, any>>();
    private MyExtendsClassTestRunner: MyExtendsClassTestRunner;

    constructor(assertions?: Assertions) {
        this.assertions = new WrapperAssertions(assertions || new DefaultAssertions());
    }

    getStrictEqualTestRunner() {
        return new StrictEqualTestRunner(this.assertions);
    }

    getMyClassTestRunner<T, TExpected>(TTestRunner: TestRunner<T, TExpected>) {
        const args = [TTestRunner];
        const index = this.MyClassTestRunnerArgsCache.getIndex(args);

        if (index >= 0) {
            return this.MyClassTestRunnerArgsCache.getItemAtIndex(index);
        }

        const vMyClassTestRunner = new MyClassTestRunner(this.assertions);
        this.MyClassTestRunnerArgsCache.addItem(vMyClassTestRunner, args);

        vMyClassTestRunner.initialize(TTestRunner);

        return vMyClassTestRunner;
    }

    getMyTypeParameterClassTestRunner<T, U extends MyClass<string>, TExpected, UExpected extends MyClassTestStructure<string>>(TTestRunner: TestRunner<T, TExpected>, UTestRunner: TestRunner<U, UExpected>) {
        const args = [TTestRunner, UTestRunner];
        const index = this.MyTypeParameterClassTestRunnerArgsCache.getIndex(args);

        if (index >= 0) {
            return this.MyTypeParameterClassTestRunnerArgsCache.getItemAtIndex(index);
        }

        const vMyTypeParameterClassTestRunner = new MyTypeParameterClassTestRunner(this.assertions);
        this.MyTypeParameterClassTestRunnerArgsCache.addItem(vMyTypeParameterClassTestRunner, args);

        vMyTypeParameterClassTestRunner.initialize(TTestRunner, UTestRunner);

        return vMyTypeParameterClassTestRunner;
    }

    getMyExtendsClassTestRunner() {
        if (this.MyExtendsClassTestRunner != null) {
            return this.MyExtendsClassTestRunner;
        }

        const vMyExtendsClassTestRunner = new MyExtendsClassTestRunner(this.assertions);
        this.MyExtendsClassTestRunner = vMyExtendsClassTestRunner;

        vMyExtendsClassTestRunner.initialize(this.getMyClassTestRunner(this.getStrictEqualTestRunner()));

        return vMyExtendsClassTestRunner;
    }
}

export class StateTestRunner {
    constructor(private readonly factory: TestRunnerFactory) {
    }

    runMyClassTest<T, TExpected>(actual: MyClass<T>, expected: MyClassTestStructure<TExpected>, TTestRunner: TestRunner<T, TExpected>) {
        const testRunner = this.factory.getMyClassTestRunner(TTestRunner);
        testRunner.runTest(actual, expected);
    }

    runMyTypeParameterClassTest<T, U extends MyClass<string>, TExpected, UExpected extends MyClassTestStructure<string>>(actual: MyTypeParameterClass<T, U>, expected: MyTypeParameterClassTestStructure<TExpected, UExpected>, TTestRunner: TestRunner<T, TExpected>, UTestRunner: TestRunner<U, UExpected>) {
        const testRunner = this.factory.getMyTypeParameterClassTestRunner(TTestRunner, UTestRunner);
        testRunner.runTest(actual, expected);
    }

    runMyExtendsClassTest(actual: MyExtendsClass, expected: MyExtendsClassTestStructure) {
        const testRunner = this.factory.getMyExtendsClassTestRunner();
        testRunner.runTest(actual, expected);
    }
}

export interface MyClassTestStructure<T> {
    prop: T;
}

export class MyClassTestRunner<T, TExpected> implements TestRunner<MyClass<T>, MyClassTestStructure<TExpected>> {
    private TTestRunner: TestRunner<T, TExpected>;

    constructor(private readonly assertions: WrapperAssertions) {
    }

    initialize(TTestRunner: TestRunner<T, TExpected>) {
        this.TTestRunner = TTestRunner;
    }

    runTest(actual: MyClass<T>, expected: MyClassTestStructure<TExpected>) {
        this.assertions.describe("MyClass", () => {
            if (this.assertions.isNull(actual, expected)) return;
            this.assertions.describe("prop", () => {
                let actualValue = actual.prop;
                let expectedValue = expected.prop;
                this.TTestRunner.runTest(actualValue, expectedValue);
            });
        });
    }
}

export interface MyTypeParameterClassTestStructure<T, U extends MyClassTestStructure<string>> {
    prop: T;
    prop2: U;
}

export class MyTypeParameterClassTestRunner<T, U extends MyClass<string>, TExpected, UExpected extends MyClassTestStructure<string>> implements TestRunner<MyTypeParameterClass<T, U>, MyTypeParameterClassTestStructure<TExpected, UExpected>> {
    private TTestRunner: TestRunner<T, TExpected>;
    private UTestRunner: TestRunner<U, UExpected>;

    constructor(private readonly assertions: WrapperAssertions) {
    }

    initialize(TTestRunner: TestRunner<T, TExpected>, UTestRunner: TestRunner<U, UExpected>) {
        this.TTestRunner = TTestRunner;
        this.UTestRunner = UTestRunner;
    }

    runTest(actual: MyTypeParameterClass<T, U>, expected: MyTypeParameterClassTestStructure<TExpected, UExpected>) {
        this.assertions.describe("MyTypeParameterClass", () => {
            if (this.assertions.isNull(actual, expected)) return;
            this.assertions.describe("prop", () => {
                let actualValue = actual.prop;
                let expectedValue = expected.prop;
                this.TTestRunner.runTest(actualValue, expectedValue);
            });
            this.assertions.describe("prop2", () => {
                let actualValue = actual.prop2;
                let expectedValue = expected.prop2;
                this.UTestRunner.runTest(actualValue, expectedValue);
            });
        });
    }
}

export interface MyExtendsClassTestStructure extends MyClassTestStructure<string> {
}

export class MyExtendsClassTestRunner implements TestRunner<MyExtendsClass, MyExtendsClassTestStructure> {
    private MyClassTestRunner: TestRunner<MyClass<string>, MyClassTestStructure<string>>;

    constructor(private readonly assertions: WrapperAssertions) {
    }

    initialize(MyClassTestRunner: TestRunner<MyClass<string>, MyClassTestStructure<string>>) {
        this.MyClassTestRunner = MyClassTestRunner;
    }

    runTest(actual: MyExtendsClass, expected: MyExtendsClassTestStructure) {
        this.assertions.describe("MyExtendsClass", () => {
            if (this.assertions.isNull(actual, expected)) return;
            this.MyClassTestRunner.runTest(actual, expected);
        });
    }
}

export function runMyExtendsClassTests(actual: MyExtendsClass, expected: MyExtendsClassTestStructure) {
    new TestRunnerFactory().getMyExtendsClassTestRunner().runTest(actual, expected);
}
