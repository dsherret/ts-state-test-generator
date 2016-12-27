import * as typeInfo from "ts-type-info";
import {TestGenerator} from "../TestGenerator";
import {expect} from "chai";
import {fileTemplate} from "./templates";

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
`export class StateTestRunner {
    private readonly assertions: WrapperAssertions;

    constructor(assertions: Assertions) {
        this.assertions = new WrapperAssertions(assertions || new DefaultAssertions());
    }

    runMyInterfaceTest(actual: MyInterface, expected: MyInterfaceTestStructure) {
        this.assertions.describe("MyInterface", () => {
            this.assertions.it("should have the correct 'prop1' property", () => {
                this.assertions.strictEqual(actual.prop1, expected.prop1);
            });
            this.assertions.it("should have the correct 'prop2' property", () => {
                this.assertions.strictEqual(actual.prop2, expected.prop2);
            });
            this.assertions.it("should have the correct 'prop3' property", () => {
                this.runMyClassTest(actual.prop3 as any as MyClass, expected.prop3 as any as MyClassTestStructure);
            });
            this.assertions.it("should have the correct 'prop4' property", () => {
                this.assertions.assertAny(() => {
                    this.runMyInterfaceTest(actual.prop4 as any as MyInterface, expected.prop4 as any as MyInterfaceTestStructure);
                }, () => {
                    this.runMyClassTest(actual.prop4 as any as MyClass, expected.prop4 as any as MyClassTestStructure);
                });
                ((actualProperty, expectedProperty) =>{
                    this.assertions.strictEqual(actualProperty.text, expectedProperty);
                })(actual.prop4, expected.prop4);
            });
            this.assertions.it("should have the correct 'prop5' property", () => {
                ((actualProperty, expectedProperty) =>{
                    this.assertions.strictEqual(actualProperty.text, expectedProperty);
                })(actual.prop5, expected.prop5);
            });
            this.assertions.it("should have the correct 'propWithOptionalDefinition' property", () => {
                this.assertions.assertAny(() => {
                    this.assertions.strictEqual(actual.propWithOptionalDefinition, undefined);
                }, () => {
                    this.runMyClassTest(actual.propWithOptionalDefinition as any as MyClass, expected.propWithOptionalDefinition as any as MyClassTestStructure);
                });
            });
        });
    }

    runMyClassTest(actual: MyClass, expected: MyClassTestStructure) {
        this.assertions.describe("MyClass", () => {
            this.assertions.it("should have the correct 'prop' property", () => {
                this.assertions.strictEqual(actual.prop, expected.prop);
            });
        });
    }

    runMyInterfaceToTransformTest(actual: MyInterfaceToTransform, expected: MyInterfaceToTransformTestStructure) {
        this.assertions.describe("MyInterfaceToTransform", () => {
            this.assertions.it("should have the correct 'prop' property", () => {
                this.assertions.strictEqual(actual.prop, expected.prop);
            });
        });
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

export interface MyClassTestStructure {
    prop: string;
}

export interface MyInterfaceToTransformTestStructure {
    prop: number;
}`;
            expect(structuresFile.write()).to.equal(fileTemplate(expectedCode));
        });
    });
});
