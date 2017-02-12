import * as typeInfo from "ts-type-info";

export interface IgnorePropertyTransform {
    condition: (
        propertyDef: typeInfo.ClassPropertyDefinition | typeInfo.InterfacePropertyDefinition,
        parent?: typeInfo.ClassDefinition | typeInfo.InterfaceDefinition
    ) => boolean;
}
