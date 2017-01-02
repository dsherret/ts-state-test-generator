import * as typeInfo from "ts-type-info";
import {expect} from "chai";
import {TestGenerator} from "./../TestGenerator";
import {fileTemplate, itMessage, itAssertion, describeAssertion, strictEqual, testRunnerFactoryStartTemplate} from "./templates";

describe(nameof(TestGenerator), () => {
    describe("array tests", () => {
        const myClass = typeInfo.createClass({
            name: "MyClass",
            properties: [{ name: "prop", type: "string[]" }]
        });

        const generator = new TestGenerator({});
        const structuresFile = generator.getTestFile([myClass]);

        it("should write out the file", () => {
            const expectedCode =
                `export class TestRunnerFactory {
    ${testRunnerFactoryStartTemplate}

    getMyClassTestRunner() {
        return new MyClassTestRunner(this.assertions);
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
}

export class MyClassTestRunner implements TestRunner<MyClass, MyClassTestStructure> {
    constructor(private readonly assertions: WrapperAssertions) {
    }

    runTest(actual: MyClass, expected: MyClassTestStructure) {
        ${describeAssertion}("MyClass", () => {
            ${describeAssertion}("prop", () => {
                ${itAssertion}("should have the same length", () => {
                    this.assertions.strictEqual(actual.prop.length, expected.prop.length);
                });
                for (let i = 0; i < (expected.prop || []).length; i++) {
                    ${describeAssertion}(\`index \${i}\`, () => {
                        ${itAssertion}(${itMessage}, () => {
                            ${strictEqual("prop[i]")}
                        });
                    });
                }
            });
        });
    }
}`;
            expect(structuresFile.write()).to.equal(fileTemplate(expectedCode));
        });
    });
});
