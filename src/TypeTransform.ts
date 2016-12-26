import * as typeInfo from "ts-type-info";
import CodeBlockWriter from "code-block-writer";

export interface TypeTransform {
    condition: (typeDef: typeInfo.TypeDefinition) => boolean;
    typeTransform: (newTypeDef: typeInfo.TypeDefinition) => void;
    testWrite: (writer: CodeBlockWriter) => void;
}
