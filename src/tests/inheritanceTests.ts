import * as typeInfo from "ts-type-info";
import {expect} from "chai";
import {TestGenerator} from "./../TestGenerator";
import {fileTemplate, itMessage, itAssertion, describeAssertion, strictEqual, testRunnerFactoryStartTemplate} from "./templates";

describe(nameof(TestGenerator), () => {
    describe("inheritance tests", () => {
        const myBaseClass = typeInfo.createClass({
            name: "MyBaseClass",
            properties: [{ name: "prop", type: "Date" }]
        });
        const myExtendsClass = typeInfo.createClass({
            name: "MyExtendsClass",
            properties: [{ name: "extendsProp", type: "string" }]
        });
        const myOtherExtendsClass = typeInfo.createClass({
            name: "MyOtherExtendsClass"
        });
        myExtendsClass.addExtends(myBaseClass);
        myExtendsClass.extendsTypes[0].definitions.push(myBaseClass);
        myOtherExtendsClass.addExtends(myBaseClass);
        myOtherExtendsClass.extendsTypes[0].definitions.push(myBaseClass);

        const generator = new TestGenerator({});
        const structuresFile = generator.getTestFile([myExtendsClass, myOtherExtendsClass]); // do not pass in the base class (for testing purposes)

        it("should write out the file", () => {
            const expectedCode =
`export class TestRunnerFactory {
    ${testRunnerFactoryStartTemplate}

    getMyExtendsClassTestRunner() {
        return new MyExtendsClassTestRunner(this.assertions, this.getMyBaseClassTestRunner());
    }

    getMyOtherExtendsClassTestRunner() {
        return new MyOtherExtendsClassTestRunner(this.assertions, this.getMyBaseClassTestRunner());
    }

    getMyBaseClassTestRunner() {
        return new MyBaseClassTestRunner(this.assertions);
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
    constructor(private readonly assertions: WrapperAssertions, private readonly MyBaseClassTestRunner: TestRunner<MyBaseClass, MyBaseClassTestStructure>) {
    }

    runTest(actual: MyExtendsClass, expected: MyExtendsClassTestStructure) {
        ${describeAssertion}("MyExtendsClass", () => {
            this.MyBaseClassTestRunner.runTest(actual, expected);
            ${describeAssertion}("extendsProp", () => {
                ${itAssertion}(${itMessage}, () => {
                    ${strictEqual("extendsProp")}
                });
            });
        });
    }
}

export interface MyOtherExtendsClassTestStructure extends MyBaseClassTestStructure {
}

export class MyOtherExtendsClassTestRunner implements TestRunner<MyOtherExtendsClass, MyOtherExtendsClassTestStructure> {
    constructor(private readonly assertions: WrapperAssertions, private readonly MyBaseClassTestRunner: TestRunner<MyBaseClass, MyBaseClassTestStructure>) {
    }

    runTest(actual: MyOtherExtendsClass, expected: MyOtherExtendsClassTestStructure) {
        ${describeAssertion}("MyOtherExtendsClass", () => {
            this.MyBaseClassTestRunner.runTest(actual, expected);
        });
    }
}

export interface MyBaseClassTestStructure {
    prop: Date;
}

export class MyBaseClassTestRunner implements TestRunner<MyBaseClass, MyBaseClassTestStructure> {
    constructor(private readonly assertions: WrapperAssertions) {
    }

    runTest(actual: MyBaseClass, expected: MyBaseClassTestStructure) {
        ${describeAssertion}("MyBaseClass", () => {
            ${describeAssertion}("prop", () => {
                ${itAssertion}(${itMessage}, () => {
                    ${strictEqual("prop")}
                });
            });
        });
    }
}`;
            expect(structuresFile.write()).to.equal(fileTemplate(expectedCode));
        });
    });
});
