import * as typeInfo from "ts-type-info";
import {TestGenerator} from "../TestGenerator";
import {expect} from "chai";
import {fileTemplate, itMessage, itAssertion, describeAssertion, strictEqual, testRunnerFactoryStartTemplate} from "./templates";

describe(nameof(TestGenerator), () => {
    describe("getting structures", () => {
        const myInterfaceDef = typeInfo.createInterface({
            name: "MyInterface",
            properties: [{
                name: "prop1",
                type: "string"
            }, {
                name: "prop2",
                isOptional: true,
                type: "number"
            }, {
                name: "prop3",
                type: "MyClass"
            }, {
                name: "prop4",
                type: "(MyInterface | MyClass) & MyInterfaceToTransform"
            }, {
                name: "prop5",
                type: "MyInterfaceToTransform"
            }, {
                name: "propWithOptionalDefinition",
                isOptional: true,
                type: "MyClass"
            }]
        });

        const myClassDef = typeInfo.createClass({
            name: "MyClass",
            properties: [{ name: "prop", type: "string" }]
        });
        const myInterfaceToTransform = typeInfo.createInterface({
            name: "MyInterfaceToTransform",
            properties: [{ name: "prop", type: "number" }]
        });
        // prop3 - class definition
        const prop3 = myInterfaceDef.getProperty("prop3")!;
        prop3.type.definitions.push(myClassDef);
        // prop4 - union and intersection type
        const prop4 = myInterfaceDef.getProperty("prop4")!;
        const prop4IntersectionType1 = new typeInfo.TypeDefinition();
        const prop4IntersectionType1UnionType1 = new typeInfo.TypeDefinition();
        prop4IntersectionType1UnionType1.text = "MyInterface";
        prop4IntersectionType1UnionType1.definitions.push(myInterfaceDef);
        prop4IntersectionType1.unionTypes.push(prop4IntersectionType1UnionType1);
        const prop4IntersectionType1UnionType2 = new typeInfo.TypeDefinition();
        prop4IntersectionType1UnionType2.text = "MyClass";
        prop4IntersectionType1UnionType2.definitions.push(myClassDef);
        prop4IntersectionType1.unionTypes.push(prop4IntersectionType1UnionType2);
        const prop4IntersectionType2 = new typeInfo.TypeDefinition();
        prop4IntersectionType2.text = "MyInterfaceToTransform";
        prop4IntersectionType2.definitions.push(myInterfaceToTransform);
        prop4.type.intersectionTypes.push(prop4IntersectionType1, prop4IntersectionType2);
        // prop5 - type transformation
        const prop5 = myInterfaceDef.getProperty("prop5")!;
        prop5.type.definitions.push(myInterfaceToTransform);
        // propWithOptionalDefinition
        const propWithOptionalDefinition = myInterfaceDef.getProperty("propWithOptionalDefinition")!;
        propWithOptionalDefinition.type.definitions.push(myClassDef);

        const generator = new TestGenerator({});
        generator.addTypeTransform(
            typeDef => typeDef.text === "MyInterfaceToTransform",
            newTypeDef => newTypeDef.text = "string",
            writer => writer.writeLine(`this.assertions.strictEqual(actualProperty.text, expectedProperty);`));
        const structuresFile = generator.getTestFile([myInterfaceDef]);

        it("should write out the file", () => {
            const expectedCode =
`export class TestRunnerFactory {
    ${testRunnerFactoryStartTemplate}

    getMyInterfaceTestRunner() {
        return new MyInterfaceTestRunner(this.assertions);
    }

    getMyClassTestRunner() {
        return new MyClassTestRunner(this.assertions);
    }

    getMyInterfaceToTransformTestRunner() {
        return new MyInterfaceToTransformTestRunner(this.assertions);
    }
}

export class StateTestRunner {
    constructor(private readonly factory: TestRunnerFactory) {
    }

    runMyInterfaceTest(actual: MyInterface, expected: MyInterfaceTestStructure) {
        const testRunner = this.factory.getMyInterfaceTestRunner();
        testRunner.runTest(actual, expected);
    }

    runMyClassTest(actual: MyClass, expected: MyClassTestStructure) {
        const testRunner = this.factory.getMyClassTestRunner();
        testRunner.runTest(actual, expected);
    }

    runMyInterfaceToTransformTest(actual: MyInterfaceToTransform, expected: MyInterfaceToTransformTestStructure) {
        const testRunner = this.factory.getMyInterfaceToTransformTestRunner();
        testRunner.runTest(actual, expected);
    }
}

export interface MyInterfaceTestStructure {
    prop1: string;
    prop2?: number;
    prop3: MyClassTestStructure;
    prop4: ((MyInterfaceTestStructure | MyClassTestStructure) & string);
    prop5: string;
    propWithOptionalDefinition?: MyClassTestStructure;
}

export class MyInterfaceTestRunner implements TestRunner<MyInterface, MyInterfaceTestStructure> {
    constructor(private readonly assertions: WrapperAssertions) {
    }

    runTest(actual: MyInterface, expected: MyInterfaceTestStructure) {
        ${describeAssertion}("MyInterface", () => {
            ${itAssertion}(${itMessage("prop1")}, () => {
                ${strictEqual("prop1")}
            });
            ${itAssertion}(${itMessage("prop2")}, () => {
                ${strictEqual("prop2")}
            });
            ${itAssertion}(${itMessage("prop3")}, () => {
                this.MyClassTestRunner.runTest(actual.prop3 as any as MyClass, expected.prop3 as any as MyClassTestStructure);
            });
            ${itAssertion}(${itMessage("prop4")}, () => {
                this.assertions.assertAny(() => {
                    this.MyInterfaceTestRunner.runTest(actual.prop4 as any as MyInterface, expected.prop4 as any as MyInterfaceTestStructure);
                }, () => {
                    this.MyClassTestRunner.runTest(actual.prop4 as any as MyClass, expected.prop4 as any as MyClassTestStructure);
                });
                ((actualProperty, expectedProperty) =>{
                    this.assertions.strictEqual(actualProperty.text, expectedProperty);
                })(actual.prop4, expected.prop4);
            });
            ${itAssertion}(${itMessage("prop5")}, () => {
                ((actualProperty, expectedProperty) =>{
                    this.assertions.strictEqual(actualProperty.text, expectedProperty);
                })(actual.prop5, expected.prop5);
            });
            ${itAssertion}(${itMessage("propWithOptionalDefinition")}, () => {
                this.assertions.assertAny(() => {
                    this.assertions.strictEqual(actual.propWithOptionalDefinition, undefined);
                }, () => {
                    this.MyClassTestRunner.runTest(actual.propWithOptionalDefinition as any as MyClass, expected.propWithOptionalDefinition as any as MyClassTestStructure);
                });
            });
        });
    }
}

export interface MyClassTestStructure {
    prop: string;
}

export class MyClassTestRunner implements TestRunner<MyClass, MyClassTestStructure> {
    constructor(private readonly assertions: WrapperAssertions) {
    }

    runTest(actual: MyClass, expected: MyClassTestStructure) {
        ${describeAssertion}("MyClass", () => {
            ${itAssertion}(${itMessage("prop")}, () => {
                this.assertions.strictEqual(actual.prop, expected.prop);
            });
        });
    }
}

export interface MyInterfaceToTransformTestStructure {
    prop: number;
}

export class MyInterfaceToTransformTestRunner implements TestRunner<MyInterfaceToTransform, MyInterfaceToTransformTestStructure> {
    constructor(private readonly assertions: WrapperAssertions) {
    }

    runTest(actual: MyInterfaceToTransform, expected: MyInterfaceToTransformTestStructure) {
        ${describeAssertion}("MyInterfaceToTransform", () => {
            ${itAssertion}(${itMessage("prop")}, () => {
                this.assertions.strictEqual(actual.prop, expected.prop);
            });
        });
    }
}`;
            expect(structuresFile.write()).to.equal(fileTemplate(expectedCode));
        });
    });
});
