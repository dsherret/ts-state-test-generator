import CodeBlockWriter from "code-block-writer";
import * as typeInfo from "ts-type-info";

export interface CustomTestTransform {
    condition: (definition: typeInfo.ClassDefinition | typeInfo.InterfaceDefinition) => boolean;
    testWrite: (writer: CodeBlockWriter, definition?: typeInfo.ClassDefinition | typeInfo.InterfaceDefinition) => void;
}
