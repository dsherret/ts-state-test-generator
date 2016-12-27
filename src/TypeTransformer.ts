import CodeBlockWriter from "code-block-writer";
import * as typeInfo from "ts-type-info";
import {TransformOptions} from "./TransformOptions";

type ClassOrInterfacePropertyType = typeInfo.InterfacePropertyDefinition | typeInfo.ClassPropertyDefinition;

export class TypeTransformer {
    constructor(private readonly transformOptions: TransformOptions) {
    }

    getNewType(typeDef: typeInfo.TypeDefinition) {
        const newTypeDef = new typeInfo.TypeDefinition();
        const matchedTypeTransforms = this.transformOptions.getTypeTransforms().filter(t => t.condition(typeDef));

        if (matchedTypeTransforms.length > 0) {
            matchedTypeTransforms.forEach(typeTransform => {
                typeTransform.typeTransform(newTypeDef);
            });
            return newTypeDef;
        }

        if (typeDef.unionTypes.length > 0) {
            typeDef.unionTypes.forEach(subType => {
                const newSubType = this.getNewType(subType);
                newTypeDef.unionTypes.push(newSubType);
            });

            newTypeDef.text = `(${newTypeDef.unionTypes.map(t => t.text).join(" | ")})`;
        }
        else if (typeDef.intersectionTypes.length > 0) {
            typeDef.intersectionTypes.forEach(subType => {
                const newSubType = this.getNewType(subType);
                newTypeDef.intersectionTypes.push(newSubType);
            });

            newTypeDef.text = `(${newTypeDef.intersectionTypes.map(t => t.text).join(" & ")})`;
        }
        else {
            const hasValidDefinition = typeDef.definitions.some(typeDefinitionDefinition =>
                typeDefinitionDefinition instanceof typeInfo.ClassDefinition ||
                typeDefinitionDefinition instanceof typeInfo.InterfaceDefinition);

            newTypeDef.text = hasValidDefinition ? this.transformOptions.getNameToTestStructureName(typeDef.text) : typeDef.text;
        }

        return newTypeDef;
    }
}
