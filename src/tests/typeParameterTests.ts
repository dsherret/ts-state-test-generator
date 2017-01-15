import * as typeInfo from "ts-type-info";
import {TestGenerator} from "../TestGenerator";
import {expect} from "chai";
import {fileTemplate, itMessage, itAssertion, describeAssertion, nullAssertion, strictEqual, testRunnerFactoryStartTemplate} from "./templates";

describe(nameof(TestGenerator), () => {
    describe("type parameter tests", () => {
        const myTypeParameterClass = typeInfo.createClass({
            name: "MyTypeParameterClass",
            typeParameters: [{
                name: "T"
            }, {
                name: "U",
                constraintType: "MyClass<string>"
            }],
            properties: [
                { name: "prop", type: "T" },
                { name: "prop2", type: "U" }
            ]
        });
        const myClass = typeInfo.createClass({
            name: "MyClass",
            typeParameters: [{ name: "T" }],
            properties: [{ name: "prop", type: "T" }]
        });
        const myExtendsClass = typeInfo.createClass({
            name: "MyExtendsClass",
            properties: [{ name: "extendsProp", type: "Date" }]
        });
        // type parameter class
        const constraintType = myTypeParameterClass.typeParameters[1].constraintType!;
        constraintType.definitions.push(myClass);
        const constraintTypeArgumentType = new typeInfo.TypeDefinition();
        constraintTypeArgumentType.text = "string";
        constraintType.typeArguments.push(constraintTypeArgumentType);
        // extends class
        myExtendsClass.addExtends(myTypeParameterClass, ["string", "MyClass<string>"]);
        myExtendsClass.extendsTypes[0].definitions.push(myTypeParameterClass);
        const extendsClassExtendsTypeTypeArg1 = new typeInfo.TypeDefinition();
        extendsClassExtendsTypeTypeArg1.text = "string";
        myExtendsClass.extendsTypes[0].typeArguments.push(extendsClassExtendsTypeTypeArg1);
        const extendsClassExtendsTypeTypeArg2 = new typeInfo.TypeDefinition();
        extendsClassExtendsTypeTypeArg2.text = "MyClass<string>";
        extendsClassExtendsTypeTypeArg2.definitions.push(myClass);
        extendsClassExtendsTypeTypeArg2.typeArguments.push(extendsClassExtendsTypeTypeArg1);
        myExtendsClass.extendsTypes[0].typeArguments.push(extendsClassExtendsTypeTypeArg2);

        const generator = new TestGenerator();
        const structuresFile = generator.getTestFile([myExtendsClass]);

        it("should write out the file", () => {
            const expectedCode =
`export class TestRunnerFactory {
    private readonly assertions: WrapperAssertions;
    private MyExtendsClassTestRunner: MyExtendsClassTestRunner;
    private readonly MyTypeParameterClassTestRunnerArgsCache = new TestRunnerArgsCache<MyTypeParameterClassTestRunner<any, any, any, any>>();
    private readonly MyClassTestRunnerArgsCache = new TestRunnerArgsCache<MyClassTestRunner<any, any>>();

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

        vMyExtendsClassTestRunner.initialize(this.getMyTypeParameterClassTestRunner(this.getStrictEqualTestRunner(), this.getMyClassTestRunner(this.getStrictEqualTestRunner())));

        return vMyExtendsClassTestRunner;
    }

    getMyTypeParameterClassTestRunner<T, U extends MyClass<string>, TExpected, UExpected extends MyClassTestStructure<string>>\
(TTestRunner: TestRunner<T, TExpected>, UTestRunner: TestRunner<U, UExpected>) {
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
}

export class StateTestRunner {
    constructor(private readonly factory: TestRunnerFactory) {
    }

    runMyExtendsClassTest(actual: MyExtendsClass, expected: MyExtendsClassTestStructure) {
        const testRunner = this.factory.getMyExtendsClassTestRunner();
        testRunner.runTest(actual, expected);
    }

    runMyTypeParameterClassTest<T, U extends MyClass<string>, TExpected, UExpected extends MyClassTestStructure<string>>\
(actual: MyTypeParameterClass<T, U>, expected: MyTypeParameterClassTestStructure<TExpected, UExpected>, \
TTestRunner: TestRunner<T, TExpected>, UTestRunner: TestRunner<U, UExpected>) {
        const testRunner = this.factory.getMyTypeParameterClassTestRunner(TTestRunner, UTestRunner);
        testRunner.runTest(actual, expected);
    }

    runMyClassTest<T, TExpected>(actual: MyClass<T>, expected: MyClassTestStructure<TExpected>, TTestRunner: TestRunner<T, TExpected>) {
        const testRunner = this.factory.getMyClassTestRunner(TTestRunner);
        testRunner.runTest(actual, expected);
    }
}

export interface MyExtendsClassTestStructure extends MyTypeParameterClassTestStructure<string, MyClassTestStructure<string>> {
    extendsProp: Date;
}

export class MyExtendsClassTestRunner implements TestRunner<MyExtendsClass, MyExtendsClassTestStructure> {
    private MyTypeParameterClassTestRunner: TestRunner<MyTypeParameterClass<string, MyClass<string>>, MyTypeParameterClassTestStructure<string, MyClassTestStructure<string>>>;

    constructor(private readonly assertions: WrapperAssertions) {
    }

    initialize(MyTypeParameterClassTestRunner: TestRunner<MyTypeParameterClass<string, MyClass<string>>, MyTypeParameterClassTestStructure<string, MyClassTestStructure<string>>>) {
        this.MyTypeParameterClassTestRunner = MyTypeParameterClassTestRunner;
    }

    runTest(actual: MyExtendsClass, expected: MyExtendsClassTestStructure) {
        ${describeAssertion}("MyExtendsClass", () => {
            ${nullAssertion(3)}
            this.MyTypeParameterClassTestRunner.runTest(actual, expected);
            ${describeAssertion}("extendsProp", () => {
                ${itAssertion}(${itMessage}, () => {
                    ${strictEqual("extendsProp")}
                });
            });
        });
    }
}

export interface MyTypeParameterClassTestStructure<T, U extends MyClassTestStructure<string>> {
    prop: T;
    prop2: U;
}

export class MyTypeParameterClassTestRunner<T, U extends MyClass<string>, TExpected, UExpected extends MyClassTestStructure<string>> \
implements TestRunner<MyTypeParameterClass<T, U>, MyTypeParameterClassTestStructure<TExpected, UExpected>> {
    private TTestRunner: TestRunner<T, TExpected>;
    private UTestRunner: TestRunner<U, UExpected>;

    constructor(private readonly assertions: WrapperAssertions) {
    }

    initialize(TTestRunner: TestRunner<T, TExpected>, UTestRunner: TestRunner<U, UExpected>) {
        this.TTestRunner = TTestRunner;
        this.UTestRunner = UTestRunner;
    }

    runTest(actual: MyTypeParameterClass<T, U>, expected: MyTypeParameterClassTestStructure<TExpected, UExpected>) {
        ${describeAssertion}("MyTypeParameterClass", () => {
            ${nullAssertion(3)}
            ${describeAssertion}("prop", () => {
                this.TTestRunner.runTest(actual.prop, expected.prop);
            });
            ${describeAssertion}("prop2", () => {
                this.UTestRunner.runTest(actual.prop2, expected.prop2);
            });
        });
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
        ${describeAssertion}("MyClass", () => {
            ${nullAssertion(3)}
            ${describeAssertion}("prop", () => {
                this.TTestRunner.runTest(actual.prop, expected.prop);
            });
        });
    }
}`;
            expect(structuresFile.write()).to.equal(fileTemplate(expectedCode));
        });
    });
});
