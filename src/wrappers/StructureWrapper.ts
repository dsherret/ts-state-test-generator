import * as typeInfo from "ts-type-info";
import {TransformOptions} from "./../TransformOptions";
import {Memoize} from "./../utils";
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

    @Memoize
    getTestStructureName() {
        return this.transformOptions.getNameToTestStructureName(this.structure.name);
    }

    getProperties() {
        return this.getValidProperties();
    }

    hasTypeParameters() {
        return this.structure.typeParameters.length > 0;
    }

    getTypeParametersCount() {
        return this.structure.typeParameters.length;
    }

    @Memoize
    getTypeParameters() {
        return this.structure.typeParameters.map(t => this.wrapperFactory.getStructureTypeParameter(this, t));
    }

    @Memoize
    getValidExtendsTypes() {
        const extendsTypes = this.getExtendsTypes();
        return extendsTypes.filter(t => !t.shouldIgnoreType() && t.getAllValidDefinitions().length > 0);
    }

    @Memoize
    getValidExtendsStructures() {
        const validExtendsDefinitions: StructureWrapper[] = [];
        this.getExtendsTypes().forEach(extendsType => {
            validExtendsDefinitions.push(...extendsType.getAllValidDefinitions());
        });
        return validExtendsDefinitions;
    }

    @Memoize
    getNameWithTypeParameters() {
        return this.getNameWithTypeParametersInternal(this.getName(), t => t.getName());
    }

    @Memoize
    getTestStructureNameWithTypeParameters() {
        return this.getNameWithTypeParametersInternal(this.getTestStructureName(), t => t.getTestStructureName());
    }

    @Memoize
    getInitializeDependencies(): (StructureTypeWrapper | StructureWrapper | StructureTypeParameterWrapper)[] {
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

    @Memoize
    getCustomTestTransforms() {
        return this.transformOptions.getCustomTestTransforms().filter(t => t.condition(this.structure));
    }

    @Memoize
    getTestStructureTransforms() {
        return this.transformOptions.getTestStructureTransforms().filter(t => t.condition(this.structure));
    }

    private getPropertyDependencies() {
        const props = this.getValidProperties();
        const dependencies: StructureWrapper[] = [];
        props.forEach(prop => {
            const definitions = prop.getType().getAllValidDefinitions();
            dependencies.push(...definitions);
        });
        return dependencies;
    }

    private getValidProperties() {
        // todo: memoize
        const tsProps = this.structure.properties as ClassOrInterfacePropertyType[];
        const props = tsProps.map(p => this.wrapperFactory.getStructureProperty(this.structure, p));
        return props.filter(p => !p.shouldIgnoreProperty());
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

    private getExtendsTypes() {
        return this.structure.extendsTypes.map(t => this.wrapperFactory.getStructureType(this, t));
    }
}
