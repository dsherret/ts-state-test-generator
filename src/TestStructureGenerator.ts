import * as typeInfo from "ts-type-info";
import {TypeTransformer} from "./TypeTransformer";
import {StructureWrapper} from "./wrappers";

export class TestStructureGenerator {
    constructor(private readonly typeTransformer: TypeTransformer) {
    }

    fillTestFileFromDefinition(testFile: typeInfo.FileDefinition, structure: StructureWrapper) {
        const testStructure = testFile.addInterface({ name: structure.getTestStructureName(), isExported: true });

        this.fillTestStructureTypeParameters(structure, testStructure);
        this.fillTestStructureProperties(structure, testStructure);
        this.addExtendsTypes(structure, testStructure);
        structure.getTestStructureTransforms().forEach(transform => {
            transform.transform(testStructure);
        });
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
        structure.getProperties().forEach(prop => {
            const propertyTransforms = prop.getMatchedPropertyTransforms();
            const newProp = testStructure.addProperty({
                name: prop.getName(),
                isOptional: prop.getIsOptional() || prop.getMatchedDefaultTransforms().length > 0 || prop.hasMatchedOptInTransforms()
            });
            newProp.type = this.typeTransformer.getNewType(prop.getType());

            propertyTransforms.forEach(transform => transform.propertyTransform(newProp));
        });
    }

    private addExtendsTypes(structure: StructureWrapper, testStructure: typeInfo.InterfaceDefinition) {
        const extendsTypes = structure.getValidExtendsTypes();

        extendsTypes.forEach(extendsType => {
            testStructure.addExtends(extendsType.getTestStructureName());
        });
    }
}
