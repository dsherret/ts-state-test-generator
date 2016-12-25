import * as typeInfo from "ts-type-info";
import {TestGenerator} from "../TestGenerator";
import {expect} from "chai";

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

        const generator = new TestGenerator({});
        generator.addTypeTransform(
            typeDef => typeDef.text === "MyInterfaceToTransform",
            newTypeDef => newTypeDef.text = "string",
            writer => writer.writeLine(`assert.strictEqual(actualProperty.text, expectedProperty);`));
        const structuresFile = generator.getTestFile([myInterfaceDef]);

        it("should write out the file", () => {
            const expectedCode =
`export class StateTestRunner {
    runMyInterfaceTest(actual: MyInterface, expected: MyInterfaceTestStructure) {
        describe("MyInterface", () => {
            it("should have the correct 'prop1' property.", () => {
                assert.strictEqual(actual.prop1, expected.prop1);
            });
            it("should have the correct 'prop2' property.", () => {
                assert.strictEqual(actual.prop2, expected.prop2);
            });
            it("should have the correct 'prop3' property.", () => {
                this.runMyClassTest(actual.prop3 as MyClass, expected.prop3);
            });
            it("should have the correct 'prop4' property.", () => {
                assertAny(() => {
                    this.runMyInterfaceTest(actual.prop4 as MyInterface, expected.prop4);
                }, () => {
                    this.runMyClassTest(actual.prop4 as MyClass, expected.prop4);
                });
                ((actualProperty, expectedProperty) =>{
                    assert.strictEqual(actualProperty.text, expectedProperty);
                })(actual.prop4, expected.prop4);
            });
            it("should have the correct 'prop5' property.", () => {
                ((actualProperty, expectedProperty) =>{
                    assert.strictEqual(actualProperty.text, expectedProperty);
                })(actual.prop5, expected.prop5);
            });
        });
    }

    runMyClassTest(actual: MyClass, expected: MyClassTestStructure) {
        describe("MyClass", () => {
            it("should have the correct 'prop' property.", () => {
                assert.strictEqual(actual.prop, expected.prop);
            });
        });
    }

    runMyInterfaceToTransformTest(actual: MyInterfaceToTransform, expected: MyInterfaceToTransformTestStructure) {
        describe("MyInterfaceToTransform", () => {
            it("should have the correct 'prop' property.", () => {
                assert.strictEqual(actual.prop, expected.prop);
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
}

export interface MyClassTestStructure {
    prop: string;
}

export interface MyInterfaceToTransformTestStructure {
    prop: number;
}
`;
            expect(structuresFile.write()).to.equal(expectedCode);
        });
    });
});
