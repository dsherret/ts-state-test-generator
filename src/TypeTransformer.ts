import * as typeInfo from "ts-type-info";
import {StructureTypeWrapper} from "./wrappers";

type ClassOrInterfacePropertyType = typeInfo.InterfacePropertyDefinition | typeInfo.ClassPropertyDefinition;

export class TypeTransformer {
    getNewType(structureType: StructureTypeWrapper) {
        const newTypeDef = new typeInfo.TypeDefinition();
        const matchedTypeTransforms = structureType.getMatchedTypeTransforms();

        if (matchedTypeTransforms.length > 0) {
            matchedTypeTransforms.forEach(typeTransform => {
                typeTransform.typeTransform(newTypeDef);
            });
            return newTypeDef;
        }

        const unionTypes = structureType.getUnionTypes();
        const intersectionTypes = structureType.getIntersectionTypes();
        const arrayType = structureType.getArrayType();
        if (unionTypes.length > 0) {
            const filteredUnionTypes = unionTypes.filter(f => !f.shouldIgnoreType());
            filteredUnionTypes.forEach(subType => {
                const newSubType = this.getNewType(subType);
                newTypeDef.unionTypes.push(newSubType);
            });

            newTypeDef.text = `(${newTypeDef.unionTypes.map(t => t.text).join(" | ")})`;
        }
        else if (intersectionTypes.length > 0) {
            const filteredIntersectionTypes = intersectionTypes.filter(f => !f.shouldIgnoreType());
            filteredIntersectionTypes.forEach(subType => {
                const newSubType = this.getNewType(subType);
                newTypeDef.intersectionTypes.push(newSubType);
            });

            newTypeDef.text = `(${newTypeDef.intersectionTypes.map(t => t.text).join(" & ")})`;
        }
        else if (arrayType != null) {
            const arraySubType = this.getNewType(arrayType);
            newTypeDef.arrayElementType = arraySubType;
            newTypeDef.text = `${arraySubType.text}[]`;
        }
        else {
            newTypeDef.text = structureType.getTestStructureName();
        }

        return newTypeDef;
    }
}
