import * as typeInfo from "ts-type-info";
import {WrapperFactory} from "./WrapperFactory";

type ClassOrInterfaceType = typeInfo.InterfaceDefinition | typeInfo.ClassDefinition;
type ClassOrInterfacePropertyType = typeInfo.InterfacePropertyDefinition | typeInfo.ClassPropertyDefinition;

export class StructurePropertyWrapper {
    constructor(
        private readonly wrapperFactory: WrapperFactory,
        private readonly prop: ClassOrInterfacePropertyType
    ) {
    }

    getName() {
        return this.prop.name;
    }

    getIsOptional() {
        return this.prop.isOptional;
    }

    getType() {
        return this.prop.type;
    }

    shouldWriteOptionalAnyCheck() {
        return this.prop.isOptional && (this.prop.type.unionTypes.length > 0 || this.prop.type.definitions.length > 0);
    }

    getAllValidTypeStructures() {
        const defs = this.prop.type.getAllDefinitions().filter(propTypeDefinition =>
            propTypeDefinition instanceof typeInfo.ClassDefinition ||
            propTypeDefinition instanceof typeInfo.InterfaceDefinition) as ClassOrInterfaceType[];

        return defs.map(d => this.wrapperFactory.getStructure(d));
    }
}
