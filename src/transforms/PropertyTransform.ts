import CodeBlockWriter from "code-block-writer";
import * as typeInfo from "ts-type-info";

export interface PropertyTransform {
    condition: (
        propertyDef: typeInfo.ClassPropertyDefinition | typeInfo.InterfacePropertyDefinition,
        parent?: typeInfo.ClassDefinition | typeInfo.InterfaceDefinition
    ) => boolean;
    propertyTransform: (newProperty: typeInfo.InterfacePropertyDefinition) => void;
    testWrite: (writer: CodeBlockWriter) => void;
}
