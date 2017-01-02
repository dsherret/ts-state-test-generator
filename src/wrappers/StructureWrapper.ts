import * as typeInfo from "ts-type-info";
import {TransformOptions} from "./../TransformOptions";
import {WrapperFactory} from "./WrapperFactory";
import {StructureTypeWrapper} from "./StructureTypeWrapper";
import {StructureTypeParameterWrapper} from "./StructureTypeParameterWrapper";

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

    getDefinition() {
        return this.structure;
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

    getValidExtendsTypes() {
        const validExtendsTypes: StructureTypeWrapper[] = [];

        this.structure.extendsTypes.forEach(extendsType => {
            const hasValidDefinition = extendsType.definitions.some(extendsTypeDefinition => extendsTypeDefinition instanceof typeInfo.ClassDefinition);

            if (hasValidDefinition)
                validExtendsTypes.push(this.wrapperFactory.getStructureType(extendsType));
        });

        return validExtendsTypes;
    }

    getValidExtendsStructures() {
        const validExtendsDefinitions: typeInfo.ClassDefinition[] = [];
        this.structure.extendsTypes.forEach(extendsType => {
            validExtendsDefinitions.push(...extendsType.definitions.filter(extendsTypeDefinition =>
                extendsTypeDefinition instanceof typeInfo.ClassDefinition) as typeInfo.ClassDefinition[]);
        });
        return validExtendsDefinitions.map(d => this.wrapperFactory.getStructure(d));
    }

    getNameWithTypeParameters() {
        return this.getNameWithTypeParametersInternal(this.getName(), t => t.getName());
    }

    getTestStructureNameWithTypeParameters() {
        return this.getNameWithTypeParametersInternal(this.getTestStructureName(), t => t.getTestStructureName());
    }

    getConstructorDependencies(): (StructureTypeWrapper | StructureWrapper | StructureTypeParameterWrapper)[] {
        const typeParams = this.getTypeParameters();
        const extendsTypes = this.getValidExtendsTypes();
        const propDependencies = this.getPropertyDependencies();
        const dependencies: ({ name: string; dep: (StructureTypeWrapper | StructureWrapper | StructureTypeParameterWrapper); })[] = [];
        const structureName = this.getName();

        function addToDependency(name: string, dep: StructureTypeWrapper | StructureWrapper | StructureTypeParameterWrapper) {
            if (name === structureName || dependencies.some(d => d.name === name))
                return;
            dependencies.push({ name, dep });
        }

        typeParams.forEach(typeParam => {
            addToDependency(typeParam.getName(), typeParam);
        });
        extendsTypes.forEach(extendsType => {
            addToDependency(extendsType.getImmediateValidDefinitions()[0].getName(), extendsType);
        });
        propDependencies.forEach(dep => {
            addToDependency(dep.getName(), dep);
        });

        return dependencies.map(d => d.dep);
    }

    private getPropertyDependencies() {
        const props = this.structure.properties as ClassOrInterfacePropertyType[];
        const dependencies: ClassOrInterfaceType[] = [];
        props.forEach(prop => {
            prop.type.getAllDefinitions().forEach(def => {
                if (!(def instanceof typeInfo.ClassDefinition || def instanceof typeInfo.InterfaceDefinition))
                    return;

                if (dependencies.indexOf(def) === -1)
                    dependencies.push(def);
            });
        });
        return dependencies.map(d => this.wrapperFactory.getStructure(d));
    }

    private getNameWithTypeParametersInternal(
        name: string,
        getTypeParamName: (typeParam: StructureTypeParameterWrapper) => string
    ) {
        const typeParams = this.getTypeParameters();
        if (typeParams.length === 0)
            return name;

        name += "<";
        typeParams.forEach((typeParam, i) => {
            if (i > 0)
                name += ", ";
            name += getTypeParamName(typeParam);
        });
        name += ">";
        return name;
    }
}
