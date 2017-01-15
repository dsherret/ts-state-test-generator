import * as typeInfo from "ts-type-info";
import {expect} from "chai";
import {TestGenerator} from "./../TestGenerator";
import {fileTemplate, itMessage, itAssertion, describeAssertion, nullAssertion, testRunnerFactoryStartTemplate, testRunnerStartTemplate} from "./templates";

describe(nameof(TestGenerator), () => {
    describe("array tests", () => {
        const myClass = typeInfo.createClass({
            name: "MyClass",
            properties: [
                { name: "prop", type: "string[]" },
                { name: "prop2", type: "any" }
            ]
        });
        const prop2 = myClass.getProperty("prop2")!;
        const numberType = new typeInfo.TypeDefinition();
        numberType.text = "number";
        const numberArrayType = new typeInfo.TypeDefinition();
        numberArrayType.text = "number[]";
        numberArrayType.arrayElementType = numberType;
        const myClassType = new typeInfo.TypeDefinition();
        myClassType.text = "MyClass";
        myClassType.definitions.push(myClass);
        const propArrayElementType = new typeInfo.TypeDefinition();
        propArrayElementType.text = "number[] | MyClass";
        propArrayElementType.unionTypes.push(numberArrayType);
        propArrayElementType.unionTypes.push(myClassType);
        prop2.type.arrayElementType = propArrayElementType;
        prop2.type.text = "(number[] | MyClass)[]";

        const generator = new TestGenerator();
        const structuresFile = generator.getTestFile([myClass]);

        it("should write out the file", () => {
            const expectedCode =
`export class TestRunnerFactory {
    ${testRunnerFactoryStartTemplate(["MyClass"], [""])}
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
    ${testRunnerStartTemplate([], [])}

    runTest(actual: MyClass, expected: MyClassTestStructure) {
        ${describeAssertion}("MyClass", () => {
            ${nullAssertion(3)}
            ${describeAssertion}("prop", () => {
                ${itAssertion}("should have the same length", () => {
                    this.assertions.strictEqual(actual.prop.length, expected.prop.length);
                });
                for (let i = 0; i < (expected.prop || []).length; i++) {
                    ((actualValue, expectedValue, i) => {
                        ${describeAssertion}(\`index \${i}\`, () => {
                            ${itAssertion}(${itMessage}, () => {
                                this.assertions.strictEqual(actualValue, expectedValue);
                            });
                        });
                    })(actual.prop[i], expected.prop[i], i);
                }
            });
            ${describeAssertion}("prop2", () => {
                this.assertions.it("should have the same length", () => {
                    this.assertions.strictEqual(actual.prop2.length, expected.prop2.length);
                });
                for (let i = 0; i < (expected.prop2 || []).length; i++) {
                    ((actualValue, expectedValue, i) => {
                        ${describeAssertion}(\`index \${i}\`, () => {
                            this.assertions.assertAny(() => {
                                ${itAssertion}("should have the same length", () => {
                                    this.assertions.strictEqual(actualValue.length, expectedValue.length);
                                });
                                for (let i = 0; i < (expectedValue || []).length; i++) {
                                    ((actualValue, expectedValue, i) => {
                                        ${describeAssertion}(\`index \${i}\`, () => {
                                            ${itAssertion}("should have the same value", () => {
                                                this.assertions.strictEqual(actualValue, expectedValue);
                                            });
                                        });
                                    })(actualValue[i], expectedValue[i], i);
                                }
                            }, () => {
                                this.runTest(actualValue as any as MyClass, expectedValue as any as MyClassTestStructure);
                            });
                        });
                    })(actual.prop2[i], expected.prop2[i], i);
                }
            });
        });
    }
}`;
            expect(structuresFile.write()).to.equal(fileTemplate(expectedCode));
        });
    });
});
