import * as typeInfo from "ts-type-info";
import {TransformOptions} from "./../TransformOptions";
import {WrapperFactory} from "./WrapperFactory";

type ClassOrInterfaceType = typeInfo.InterfaceDefinition | typeInfo.ClassDefinition;
type ClassOrInterfacePropertyType = typeInfo.InterfacePropertyDefinition | typeInfo.ClassPropertyDefinition;

export class StructureWrapper {
    constructor(
        private readonly wrapperFactory: WrapperFactory,
        private readonly transformOptions: TransformOptions,
        private readonly structure: ClassOrInterfaceType
    ) {
    }

    getName() {
        return this.structure.name;
    }

    getTestStructureName() {
        return this.transformOptions.getNameToTestStructureName(this.structure.name);
    }

    getProperties() {
        return (this.structure.properties as ClassOrInterfacePropertyType[]).map(p => this.wrapperFactory.getStructureProperty(p));
    }

    getTypeParameters() {
        return this.structure.typeParameters.map(t => this.wrapperFactory.getStructureTypeParameter(t));
    }

    getValidExtendsStructures() {
        const validExtendsDefinitions: typeInfo.ClassDefinition[] = [];
        this.structure.extendsTypes.forEach(extendsType => {
            validExtendsDefinitions.push(...extendsType.definitions.filter(extendsTypeDefinition =>
                extendsTypeDefinition instanceof typeInfo.ClassDefinition) as typeInfo.ClassDefinition[]);
        });
        return validExtendsDefinitions.map(d => this.wrapperFactory.getStructure(d));
    }
}
