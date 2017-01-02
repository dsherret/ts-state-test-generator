﻿import * as typeInfo from "ts-type-info";
import {TransformOptions} from "./TransformOptions";
import {TypeTransformer} from "./TypeTransformer";
import {StructureWrapper} from "./wrappers";

export class TestStructureGenerator {
    constructor(private readonly typeTransformer: TypeTransformer, private readonly transformOptions: TransformOptions) {
    }

    fillTestFileFromDefinition(testFile: typeInfo.FileDefinition, structure: StructureWrapper) {
        const testStructure = testFile.addInterface({ name: structure.getTestStructureName(), isExported: true });

        this.fillTestStructureTypeParameters(structure, testStructure);
        this.fillTestStructureProperties(structure, testStructure);
        this.addExtendsTypes(structure, testStructure);
    }

    private fillTestStructureTypeParameters(structure: StructureWrapper, testStructure: typeInfo.InterfaceDefinition) {
        structure.getTypeParameters().forEach(typeParam => {
            const newTypeParam = testStructure.addTypeParameter({
                name: typeParam.getName()
            });
            const constraintType = typeParam.getConstraintType();
            newTypeParam.constraintType = constraintType == null ? null : this.typeTransformer.getNewType(constraintType);
        });
    }

    private fillTestStructureProperties(structure: StructureWrapper, testStructure: typeInfo.InterfaceDefinition) {
        const defaultValueTransforms = this.transformOptions.getDefaultValueTransforms();
        structure.getProperties().forEach(prop => {
            const newProp = testStructure.addProperty({
                name: prop.getName(),
                isOptional: prop.getIsOptional() || defaultValueTransforms.some(t => t.condition(prop.getDefinition(), structure.getDefinition()))
            });
            newProp.type = this.typeTransformer.getNewType(prop.getType());
        });
    }

    private addExtendsTypes(structure: StructureWrapper, testStructure: typeInfo.InterfaceDefinition) {
        const extendsTypes = structure.getValidExtendsTypes();

        extendsTypes.forEach(extendsType => {
            testStructure.addExtends(extendsType.getTestStructureName());
        });
    }
}
