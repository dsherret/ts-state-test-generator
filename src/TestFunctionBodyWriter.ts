import CodeBlockWriter from "code-block-writer";
import * as typeInfo from "ts-type-info";
import {TransformOptions} from "./TransformOptions";
import {StructureWrapper, StructurePropertyWrapper} from "./wrappers";

export class TestFunctionBodyWriter {
    constructor(private readonly transformOptions: TransformOptions) {
    }

    writeForStructure(structure: StructureWrapper, writer: CodeBlockWriter) {
        writer.write(`this.assertions.describe("${structure.getName()}", () => `).inlineBlock(() => {
            structure.getValidExtendsStructures().forEach(extendsStructure => {
                writer.writeLine(`this.run${extendsStructure.getName()}Test(` +
                    `actual as any as ${extendsStructure.getName()}, ` +
                    `expected);`);
            });

            structure.getProperties().forEach(prop => {
                this.writeTestForProperty(prop, writer);
            });
        }).write(");").newLine();
    }

    private writeTestForProperty(prop: StructurePropertyWrapper, writer: CodeBlockWriter) {
        writer.write(`this.assertions.it("should have the correct '${prop.getName()}' property", () => `).inlineBlock(() => {
            if (prop.shouldWriteOptionalAnyCheck()) {
                writer.write("this.assertions.assertAny(() => ").inlineBlock(() => {
                    writer.writeLine(`this.assertions.strictEqual(actual.${prop.getName()}, undefined);`);
                }).write(", () => ").inlineBlock(() => {
                    this.writeTypeTest(prop, prop.getType(), writer);
                }).write(");");
            }
            else
                this.writeTypeTest(prop, prop.getType(), writer);
        }).write(");").newLine();
    }

    private writeTypeTest(prop: StructurePropertyWrapper, typeDef: typeInfo.TypeDefinition, writer: CodeBlockWriter) {
        const matchedTypeTransforms = this.transformOptions.getTypeTransforms().filter(t => t.condition(typeDef));

        if (matchedTypeTransforms.length > 0) {
            writer.write("((actualProperty, expectedProperty) =>").inlineBlock(() => {
                matchedTypeTransforms.forEach(typeTransform => {
                    typeTransform.testWrite(writer);
                });
            }).write(`)(actual.${prop.getName()}, expected.${prop.getName()});`).newLine();
            return;
        }

        if (typeDef.unionTypes.length > 0) {
            writer.write("this.assertions.assertAny(");
            typeDef.unionTypes.forEach((subType, i) => {
                writer.conditionalWrite(i !== 0, ", ");
                writer.write("() => ").inlineBlock(() => {
                    this.writeTypeTest(prop, subType, writer);
                });
            });
            writer.write(");").newLine();
        }
        else if (typeDef.intersectionTypes.length > 0) {
            typeDef.intersectionTypes.forEach(subType => {
                this.writeTypeTest(prop, subType, writer);
            });
        }
        else {
            const hasValidDefinition = typeDef.definitions.some(typeDefinitionDefinition =>
                typeDefinitionDefinition instanceof typeInfo.ClassDefinition ||
                typeDefinitionDefinition instanceof typeInfo.InterfaceDefinition);

            if (hasValidDefinition)
                writer.writeLine(`this.run${typeDef.definitions[0].name}Test(` +
                    `actual.${prop.getName()} as any as ${typeDef.definitions[0].name}, ` +
                    `expected.${prop.getName()} as any as ${this.transformOptions.getNameToTestStructureName(typeDef.definitions[0].name)});`);
            else
                writer.writeLine(`this.assertions.strictEqual(actual.${prop.getName()}, expected.${prop.getName()});`);
        }
    }
}
