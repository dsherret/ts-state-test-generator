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

    private getValidDefinitionsFromDefs(defs: typeInfo.ExportableDefinitions[]) {
        const validDefs = defs.filter(d =>
            d instanceof typeInfo.ClassDefinition ||
            d instanceof typeInfo.InterfaceDefinition) as ClassOrInterfaceType[];

        return validDefs.map(d => this.wrapperFactory.getStructure(d));
    }

    getTestStructureName() {
        const validDefinitions = this.getImmediateValidDefinitions();
        const hasValidDefinition = validDefinitions.length > 0;

        if (!hasValidDefinition)
            return this.typeDef.text;

        let name = validDefinitions[0].getTestStructureName();

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
}
