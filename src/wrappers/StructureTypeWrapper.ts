import * as typeInfo from "ts-type-info";
import {TransformOptions} from "./../TransformOptions";
import {StructureWrapper} from "./StructureWrapper";
import {WrapperFactory} from "./WrapperFactory";

type ClassOrInterfaceType = typeInfo.InterfaceDefinition | typeInfo.ClassDefinition;

export class StructureTypeWrapper {
    constructor(
        private readonly wrapperFactory: WrapperFactory,
        private readonly transformOptions: TransformOptions,
        private readonly structure: StructureWrapper,
        private readonly typeDef: typeInfo.TypeDefinition
    ) {
    }

    getText() {
        return this.typeDef.text;
    }

    isTypeParameterType() {
        return this.structure.getTypeParameters().some(typeParam => typeParam.getName() === this.getText());
    }

    getMatchedTypeTransforms() {
        return this.transformOptions.getTypeTransforms().filter(t => t.condition(this.typeDef));
    }

    getUnionTypes() {
        return this.typeDef.unionTypes.map(t => this.wrapperFactory.getStructureType(this.structure, t));
    }

    getIntersectionTypes() {
        return this.typeDef.intersectionTypes.map(t => this.wrapperFactory.getStructureType(this.structure, t));
    }

    getAllValidDefinitions() {
        return this.getValidDefinitionsFromDefs(this.typeDef.getAllDefinitions());
    }

    getImmediateValidDefinitions() {
        return this.getValidDefinitionsFromDefs(this.typeDef.definitions);
    }

    getName(): string {
        const validDefs = this.getImmediateValidDefinitions();

        if (validDefs.length === 0)
            return this.getText();

        return this.getNameWithTypeParametersInternal(validDefs[0].getName(), structureType => structureType.getName());
    }

    getTestStructureName(): string {
        const validDefs = this.getImmediateValidDefinitions();

        if (validDefs.length === 0)
            return this.getText();

        return this.getNameWithTypeParametersInternal(validDefs[0].getTestStructureName(), structureType => structureType.getTestStructureName());
    }

    getTestStructureNameForTestRunner(): string {
        const validDefs = this.getImmediateValidDefinitions();

        if (validDefs.length === 0)
            return this.getText();

        return this.getNameWithTypeParametersInternal(validDefs[0].getTestStructureName(), structureType => {
            let name = structureType.getTestStructureNameForTestRunner();
            if (structureType.isTypeParameterType())
                name += "Expected";
            return name;
        });
    }

    getTypeArguments() {
        return this.typeDef.typeArguments.map(t => this.wrapperFactory.getStructureType(this.structure, t));
    }

    getArrayType() {
        return this.typeDef.arrayElementType == null ? null : this.wrapperFactory.getStructureType(this.structure, this.typeDef.arrayElementType!);
    }

    private getNameWithTypeParametersInternal(
        name: string,
        getTypeName: (structureType: StructureTypeWrapper) => string
    ) {
        if (this.typeDef.typeArguments.length === 0)
            return name;

        name += "<";
        this.typeDef.typeArguments.forEach((typeArg, i) => {
            if (i !== 0)
                name += ", ";
            name += getTypeName(this.wrapperFactory.getStructureType(this.structure, typeArg));
        });
        name += ">";

        return name;
    }

    private getValidDefinitionsFromDefs(defs: typeInfo.ExportableDefinitions[]) {
        const validDefs = defs.filter(d =>
            d instanceof typeInfo.ClassDefinition ||
            d instanceof typeInfo.InterfaceDefinition) as ClassOrInterfaceType[];

        return validDefs.map(d => this.wrapperFactory.getStructure(d));
    }
}
