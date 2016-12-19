import * as typeInfo from "ts-type-info";
import {TestGenerator} from "../TestGenerator";
import {expect} from "chai";

describe(nameof(TestGenerator), () => {
    describe("getting structures", () => {
        const interfaceInfo = typeInfo.createInterface({
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
                type: "MyInterface"
            }]
        });

        interfaceInfo.getProperty("prop3")!.type.definitions.push(typeInfo.createClass({
            name: "MyClass",
            properties: [{ name: "prop", type: "string" }]
        }));
        interfaceInfo.getProperty("prop4")!.type.definitions.push(interfaceInfo);

        const generator = new TestGenerator({});
        const structuresFile = generator.getTestStructures([interfaceInfo]);

        function checkProperty(prop: typeInfo.InterfacePropertyDefinition, expected: { name: string; isOptional?: boolean; type: string; }) {
            expect(prop.name).to.equal(expected.name);
            expect(prop.isOptional).to.equal(expected.isOptional || false);
            expect(prop.type.text).to.equal(expected.type);
        }

        it("should create the interface MyInterfaceTestStructure", () => {
            const testStructure = structuresFile.getInterface("MyInterfaceTestStructure")!;
            const prop1 = testStructure.getProperty("prop1")!;
            checkProperty(prop1, {
                name: "prop1",
                type: "string"
            });
            const prop2 = testStructure.getProperty("prop2")!;
            checkProperty(prop2, {
                name: "prop2",
                isOptional: true,
                type: "number"
            });
            const prop3 = testStructure.getProperty("prop3")!;
            checkProperty(prop3, {
                name: "prop3",
                type: "MyClassTestStructure"
            });
            const prop4 = testStructure.getProperty("prop4")!;
            checkProperty(prop4, {
                name: "prop4",
                type: "MyInterfaceTestStructure"
            });
        });

        it("should create the interface MyClassTestStructure", () => {
            const testStructure = structuresFile.getInterface("MyClassTestStructure")!;
            const prop = testStructure.getProperty("prop")!;
            checkProperty(prop, {
                name: "prop",
                type: "string"
            });
        });
    });
});
