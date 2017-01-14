import * as typeInfo from "ts-type-info";

export interface OptInPropertyTransform {
    condition: (
        propertyDef: typeInfo.ClassPropertyDefinition | typeInfo.InterfacePropertyDefinition,
        parent?: typeInfo.ClassDefinition | typeInfo.InterfaceDefinition
    ) => boolean;
}
