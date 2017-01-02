import {StructureWrapper} from "./wrappers";

export class StructureDependencyGetter {
    getAllStructures(structures: StructureWrapper[]) {
        for (let i = 0; i < structures.length; i++) {
            const structure = structures[i];

            structure.getProperties().forEach(prop => {
                const validTypeDefinitions = prop.getAllValidTypeStructures();

                validTypeDefinitions.forEach(validTypeDef => {
                    if (structures.indexOf(validTypeDef) === -1)
                        structures.push(validTypeDef);
                });
            });

            const validExtendsStructures = structure.getValidExtendsStructures();
            validExtendsStructures.forEach(extendsStructure => {
                if (structures.indexOf(extendsStructure) === -1)
                    structures.push(extendsStructure);
            });

            structure.getTypeParameters().forEach(typeParam => {
                const constraintType = typeParam.getConstraintType();
                if (constraintType == null)
                    return;

                constraintType.getAllValidDefinitions().forEach(constraintTypeStructure => {
                    if (structures.indexOf(constraintTypeStructure) === -1)
                        structures.push(constraintTypeStructure);
                });
            });
        }

        return structures;
    }
}
