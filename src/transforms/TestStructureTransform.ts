import * as typeInfo from "ts-type-info";

export interface TestStructureTransform {
    condition: (definition: typeInfo.ClassDefinition | typeInfo.InterfaceDefinition) => boolean;
    transform: (testStructure: typeInfo.InterfaceDefinition) => void;
}
