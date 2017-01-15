import * as typeInfo from "ts-type-info";
import CodeBlockWriter from "code-block-writer";

export class TestGenerator {
    constructor();

    addCustomTestTransform(condition: (definition: typeInfo.ClassDefinition | typeInfo.InterfaceDefinition) => boolean, testWrite: (writer: CodeBlockWriter) => void): void;
    addDefaultValue(condition: (propertyDef: typeInfo.ClassPropertyDefinition | typeInfo.InterfacePropertyDefinition, parent?: typeInfo.ClassDefinition | typeInfo.InterfaceDefinition | undefined) => boolean, value: string): void;
    addOptInPropertyTransform(condition: (propertyDef: typeInfo.ClassPropertyDefinition | typeInfo.InterfacePropertyDefinition, parent?: typeInfo.ClassDefinition | typeInfo.InterfaceDefinition | undefined) => boolean): void;
    addPropertyTransform(condition: (propertyDef: typeInfo.ClassPropertyDefinition | typeInfo.InterfacePropertyDefinition, parent?: typeInfo.ClassDefinition | typeInfo.InterfaceDefinition | undefined) => boolean, propertyTransform: (newProperty: typeInfo.InterfacePropertyDefinition) => void, testWrite: (writer: CodeBlockWriter) => void): void;
    addTestStructureTransform(condition: (definition: typeInfo.ClassDefinition | typeInfo.InterfaceDefinition) => boolean, transform: (testStructure: typeInfo.InterfaceDefinition) => void): void;
    addTypeTransform(condition: (typeDef: typeInfo.TypeDefinition) => boolean, typeTransform: (newTypeDef: typeInfo.TypeDefinition) => void, testWrite: (writer: CodeBlockWriter) => void): void;
    getTestFile(structures: (typeInfo.ClassDefinition | typeInfo.InterfaceDefinition)[]): typeInfo.FileDefinition;
}
