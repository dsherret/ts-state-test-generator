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

            const validExtendsTypes = structure.getValidExtendsTypes();
            validExtendsTypes.forEach(extendsType => {
                extendsType.getAllValidDefinitions().forEach(structure => {
                    if (structures.indexOf(structure) === -1)
                        structures.push(structure);
                });
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
