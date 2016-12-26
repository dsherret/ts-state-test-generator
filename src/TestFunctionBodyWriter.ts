import CodeBlockWriter from "code-block-writer";
import * as typeInfo from "ts-type-info";
import {TransformOptions} from "./TransformOptions";

type ClassOrInterfacePropertyType = typeInfo.InterfacePropertyDefinition | typeInfo.ClassPropertyDefinition;

export class TestFunctionBodyWriter {
    constructor(private readonly transformOptions: TransformOptions) {
    }

    getNewType(prop: ClassOrInterfacePropertyType, writer: CodeBlockWriter) {
        const getNewTypeInternal = (typeDef: typeInfo.TypeDefinition) => {
            const newTypeDef = new typeInfo.TypeDefinition();
            const matchedTypeTransforms = this.transformOptions.getTypeTransforms().filter(t => t.condition(typeDef));

            if (matchedTypeTransforms.length > 0) {
                writer.write("((actualProperty, expectedProperty) =>").inlineBlock(() => {
                    matchedTypeTransforms.forEach(typeTransform => {
                        typeTransform.testWrite(writer);
                        typeTransform.typeTransform(newTypeDef);
                    });
                }).write(`)(actual.${prop.name}, expected.${prop.name});`).newLine();
                return newTypeDef;
            }

            if (typeDef.unionTypes.length > 0) {
                writer.write("this.assertions.assertAny(");
                typeDef.unionTypes.forEach((subType, i) => {
                    writer.conditionalWrite(i !== 0, ", ");
                    writer.write("() => ").inlineBlock(() => {
                        const newSubType = getNewTypeInternal(subType);
                        newTypeDef.unionTypes.push(newSubType);
                    });
                });
                writer.write(");").newLine();

                newTypeDef.text = `(${newTypeDef.unionTypes.map(t => t.text).join(" | ")})`;
            }
            else if (typeDef.intersectionTypes.length > 0) {
                typeDef.intersectionTypes.forEach(subType => {
                    const newSubType = getNewTypeInternal(subType);
                    newTypeDef.intersectionTypes.push(newSubType);
                });

                newTypeDef.text = `(${newTypeDef.intersectionTypes.map(t => t.text).join(" & ")})`;
            }
            else {
                const hasValidDefinition = typeDef.definitions.some(typeDefinitionDefinition =>
                    typeDefinitionDefinition instanceof typeInfo.ClassDefinition ||
                    typeDefinitionDefinition instanceof typeInfo.InterfaceDefinition);

                newTypeDef.text = hasValidDefinition ? this.transformOptions.getNameToTestStructureName(typeDef.text) : typeDef.text;

                if (hasValidDefinition)
                    writer.writeLine(`this.run${typeDef.definitions[0].name}Test(` +
                        `actual.${prop.name} as any as ${typeDef.definitions[0].name}, ` +
                        `expected.${prop.name} as any as ${this.transformOptions.getNameToTestStructureName(typeDef.definitions[0].name)});`);
                else
                    writer.writeLine(`this.assertions.strictEqual(actual.${prop.name}, expected.${prop.name});`);
            }

            return newTypeDef;
        };
        const handleTopLevelType = () => {
            let newTypeDef: typeInfo.TypeDefinition | undefined;
            if (prop.isOptional && (prop.type.unionTypes.length > 0 || prop.type.definitions.length > 0)) {
                writer.write("this.assertions.assertAny(() => ").inlineBlock(() => {
                    writer.writeLine(`this.assertions.strictEqual(actual.${prop.name}, undefined);`);
                }).write(", () => ").inlineBlock(() => {
                    newTypeDef = getNewTypeInternal(prop.type);
                }).write(");");
            }
            else
                newTypeDef = getNewTypeInternal(prop.type);
            return newTypeDef!;
        };

        return handleTopLevelType();
    }
}
