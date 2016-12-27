import * as typeInfo from "ts-type-info";
import {TransformOptions} from "./TransformOptions";
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
        if (unionTypes.length > 0) {
            unionTypes.forEach(subType => {
                const newSubType = this.getNewType(subType);
                newTypeDef.unionTypes.push(newSubType);
            });

            newTypeDef.text = `(${newTypeDef.unionTypes.map(t => t.text).join(" | ")})`;
        }
        else if (intersectionTypes.length > 0) {
            intersectionTypes.forEach(subType => {
                const newSubType = this.getNewType(subType);
                newTypeDef.intersectionTypes.push(newSubType);
            });

            newTypeDef.text = `(${newTypeDef.intersectionTypes.map(t => t.text).join(" & ")})`;
        }
        else {
            newTypeDef.text = structureType.getTestStructureName();
        }

        return newTypeDef;
    }
}
