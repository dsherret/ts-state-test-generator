import * as typeInfo from "ts-type-info";
import {TransformOptions} from "./../TransformOptions";
import {StructurePropertyWrapper} from "./StructurePropertyWrapper";
import {StructureTypeParameterWrapper} from "./StructureTypeParameterWrapper";
import {StructureTypeWrapper} from "./StructureTypeWrapper";
import {StructureWrapper} from "./StructureWrapper";

type ClassOrInterfaceType = typeInfo.InterfaceDefinition | typeInfo.ClassDefinition;
type ClassOrInterfacePropertyType = typeInfo.InterfacePropertyDefinition | typeInfo.ClassPropertyDefinition;

export class WrapperFactory {
    private structureWrappers: { definition: ClassOrInterfaceType; wrapper: StructureWrapper; }[] = [];

    constructor(private readonly transformOptions: TransformOptions) {
    }

    getStructure(definition: ClassOrInterfaceType) {
        // ensure only one wrapper per class is created (otherwise infinite loop will ensue when checking if a structure already exists)
        const existing = this.structureWrappers.filter(s => s.definition === definition)[0];
        if (existing != null)
            return existing.wrapper;

        const wrapper = new StructureWrapper(this, this.transformOptions, definition);
        this.structureWrappers.push({
            wrapper,
            definition
        });

        return wrapper;
    }

    getStructureProperty(parent: ClassOrInterfaceType, definition: ClassOrInterfacePropertyType) {
        return new StructurePropertyWrapper(this, this.transformOptions, parent, definition);
    }

    getStructureTypeParameter(structure: StructureWrapper, typeParamDefinition: typeInfo.TypeParameterDefinition) {
        return new StructureTypeParameterWrapper(this, structure, typeParamDefinition);
    }

    getStructureType(structure: StructureWrapper, typeDef: typeInfo.TypeDefinition) {
        return new StructureTypeWrapper(this, this.transformOptions, structure, typeDef);
    }
}
