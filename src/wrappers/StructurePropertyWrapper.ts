import * as typeInfo from "ts-type-info";
import {WrapperFactory} from "./WrapperFactory";
import {TransformOptions} from "./../TransformOptions";
import {Memoize} from "./../utils";

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

    @Memoize
    hasMatchedOptInTransforms() {
        return this.transformOptions.getOptInPropertyTransforms().some(p => p.condition(this.prop, this.parent));
    }

    @Memoize
    getMatchedDefaultTransforms() {
        return this.transformOptions.getDefaultValueTransforms().filter(p => p.condition(this.prop, this.parent));
    }

    @Memoize
    getMatchedPropertyTransforms() {
        return this.transformOptions.getPropertyTransforms().filter(p => p.condition(this.prop, this.parent));
    }

    getDefinition() {
        return this.prop;
    }

    getIsOptional() {
        return this.prop.isOptional;
    }

    @Memoize
    getType() {
        return this.wrapperFactory.getStructureType(this.wrapperFactory.getStructure(this.parent), this.prop.type);
    }

    @Memoize
    shouldIgnoreProperty() {
        for (let tranform of this.transformOptions.getIgnorePropertyTransforms()) {
            if (tranform.condition(this.prop, this.parent))
                return true;
        }

        if (this.getType().shouldIgnoreType())
            return true;

        return false;
    }

    shouldWriteOptionalAnyCheck() {
        return this.prop.isOptional && (this.prop.type.unionTypes.length > 0 || this.prop.type.definitions.length > 0);
    }

    @Memoize
    getAllValidTypeStructures() {
        const defs = this.prop.type.getAllDefinitions().filter(propTypeDefinition =>
            propTypeDefinition instanceof typeInfo.ClassDefinition ||
            propTypeDefinition instanceof typeInfo.InterfaceDefinition) as ClassOrInterfaceType[];

        return defs.map(d => this.wrapperFactory.getStructure(d));
    }
}
