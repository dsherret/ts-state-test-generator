import * as typeInfo from "ts-type-info";
import {WrapperFactory} from "./WrapperFactory";
import {TransformOptions} from "./../TransformOptions";

type ClassOrInterfaceType = typeInfo.InterfaceDefinition | typeInfo.ClassDefinition;
type ClassOrInterfacePropertyType = typeInfo.InterfacePropertyDefinition | typeInfo.ClassPropertyDefinition;

export class StructurePropertyWrapper {
    constructor(
        private readonly wrapperFactory: WrapperFactory,
        private readonly transformOptions: TransformOptions,
        private readonly parent: ClassOrInterfaceType,
        private readonly prop: ClassOrInterfacePropertyType
    ) {
    }

    getName() {
        return this.prop.name;
    }

    hasMatchedOptInTransforms() {
        return this.transformOptions.getOptInPropertyTransforms().some(p => p.condition(this.prop, this.parent));
    }

    getMatchedDefaultTransforms() {
        return this.transformOptions.getDefaultValueTransforms().filter(p => p.condition(this.prop, this.parent));
    }

    getMatchedPropertyTransforms() {
        return this.transformOptions.getPropertyTransforms().filter(p => p.condition(this.prop, this.parent));
    }

    getDefinition() {
        return this.prop;
    }

    getIsOptional() {
        return this.prop.isOptional;
    }

    getType() {
        return this.wrapperFactory.getStructureType(this.wrapperFactory.getStructure(this.parent), this.prop.type);
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
