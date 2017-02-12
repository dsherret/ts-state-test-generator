import * as typeInfo from "ts-type-info";

export interface IgnoreTypeTransform {
    condition: (typeDef: typeInfo.TypeDefinition) => boolean;
}
