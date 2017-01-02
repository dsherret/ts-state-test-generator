import * as typeInfo from "ts-type-info";
import {TransformOptions} from "./../TransformOptions";
import {WrapperFactory} from "./WrapperFactory";

type ClassOrInterfaceType = typeInfo.InterfaceDefinition | typeInfo.ClassDefinition;

export class StructureTypeWrapper {
    constructor(
        private readonly wrapperFactory: WrapperFactory,
        private readonly transformOptions: TransformOptions,
        private readonly typeDef: typeInfo.TypeDefinition
    ) {
    }

    getText() {
        return this.typeDef.text;
    }

    getMatchedTypeTransforms() {
        return this.transformOptions.getTypeTransforms().filter(t => t.condition(this.typeDef));
    }

    getUnionTypes() {
        return this.typeDef.unionTypes.map(t => this.wrapperFactory.getStructureType(t));
    }

    getIntersectionTypes() {
        return this.typeDef.intersectionTypes.map(t => this.wrapperFactory.getStructureType(t));
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

    getTypeArguments() {
        return this.typeDef.typeArguments.map(t => this.wrapperFactory.getStructureType(t));
    }

    getIsArrayType() {
        return this.typeDef.isArrayType();
    }

    getArrayType() {
        return this.typeDef.arrayElementType == null ? null : this.wrapperFactory.getStructureType(this.typeDef.arrayElementType!);
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
            name += this.wrapperFactory.getStructureType(typeArg).getTestStructureName();
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
