import * as typeInfo from "ts-type-info";
import {TransformOptions} from "./../TransformOptions";
import {Memoize} from "./../utils";
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

    @Memoize
    getExpectedText(): string {
        const unionTypes = this.getUnionTypes();
        if (unionTypes.length > 0)
            return unionTypes.filter(t => !t.shouldIgnoreType()).map(t => t.getExpectedText()).join(" | ");

        const intersectionTypes = this.getIntersectionTypes();
        if (intersectionTypes.length > 0)
            return intersectionTypes.filter(t => !t.shouldIgnoreType()).map(t => t.getExpectedText()).join(" & ");

        const arrayType = this.getArrayType();
        if (arrayType != null)
            return arrayType.getExpectedText() + "[]";

        return this.getTestStructureName();
    }

    @Memoize
    isTypeParameterType() {
        return this.structure.getTypeParameters().some(typeParam => typeParam.getName() === this.getText());
    }

    @Memoize
    getMatchedTypeTransforms() {
        return this.transformOptions.getTypeTransforms().filter(t => t.condition(this.typeDef));
    }

    @Memoize
    getUnionTypes() {
        return this.typeDef.unionTypes.map(t => this.wrapperFactory.getStructureType(this.structure, t));
    }

    @Memoize
    getIntersectionTypes() {
        return this.typeDef.intersectionTypes.map(t => this.wrapperFactory.getStructureType(this.structure, t));
    }

    @Memoize
    getAllValidDefinitions() {
        return this.getValidDefinitionsFromDefs(this.typeDef.getAllDefinitions());
    }

    @Memoize
    getImmediateValidDefinitions() {
        return this.getValidDefinitionsFromDefs(this.typeDef.definitions);
    }

    @Memoize
    getName(): string {
        const validDefs = this.getImmediateValidDefinitions();

        if (validDefs.length === 0)
            return this.getText();

        return this.getNameWithTypeParametersInternal(validDefs[0].getName(), structureType => structureType.getName());
    }

    @Memoize
    getTestStructureName(): string {
        const validDefs = this.getImmediateValidDefinitions();

        if (validDefs.length === 0)
            return this.getText();

        return this.getNameWithTypeParametersInternal(validDefs[0].getTestStructureName(), structureType => structureType.getTestStructureName());
    }

    @Memoize
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

    @Memoize
    getTypeArguments() {
        return this.typeDef.typeArguments.map(t => this.wrapperFactory.getStructureType(this.structure, t));
    }

    @Memoize
    getArrayType() {
        return this.typeDef.arrayElementType == null ? null : this.wrapperFactory.getStructureType(this.structure, this.typeDef.arrayElementType!);
    }

    @Memoize
    shouldIgnoreType() {
        for (let tranform of this.transformOptions.getIgnoreTypeTransforms()) {
            if (tranform.condition(this.typeDef))
                return true;
        }

        const arrayType = this.getArrayType();
        if (arrayType != null && arrayType.shouldIgnoreType())
            return true;

        const unionTypes = this.getUnionTypes();
        const intersectionTypes = this.getIntersectionTypes();

        if (unionTypes.length === 0 && intersectionTypes.length === 0)
            return this.typeDef.callSignatures.length !== 0;

        for (let unionType of unionTypes) {
            if (!unionType.shouldIgnoreType())
                return false;
        }

        for (let intersectionType of intersectionTypes) {
            if (!intersectionType.shouldIgnoreType())
                return false;
        }

        return true;
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
