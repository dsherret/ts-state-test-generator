import * as typeInfo from "ts-type-info";
import {expect} from "chai";
import {TestGenerator} from "./../TestGenerator";
import {fileTemplate, itMessage, itAssertion, describeAssertion, strictEqual, testRunnerFactoryStartTemplate} from "./templates";

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
    prop2: (number[] | MyClassTestStructure)[];
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
            ${describeAssertion}("prop2", () => {
                this.assertions.it("should have the same length", () => {
                    this.assertions.strictEqual(actual.prop2.length, expected.prop2.length);
                });
                for (let i = 0; i < (expected.prop2 || []).length; i++) {
                    this.assertions.describe(\`index \${i}\`, () => {
                        this.assertions.assertAny(() => {
                            this.assertions.it("should have the same length", () => {
                                this.assertions.strictEqual(actual.prop2[i].length, expected.prop2[i].length);
                            });
                            for (let i = 0; i < (expected.prop2[i] || []).length; i++) {
                                this.assertions.describe(\`index \${i}\`, () => {
                                    this.assertions.it("should have the same value", () => {
                                        this.assertions.strictEqual(actual.prop2[i][i], expected.prop2[i][i]);
                                    });
                                });
                            }
                        }, () => {
                            this.runTest(actual.prop2[i] as any as MyClass, expected.prop2[i] as any as MyClassTestStructure);
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
