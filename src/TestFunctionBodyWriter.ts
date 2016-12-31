﻿import CodeBlockWriter from "code-block-writer";
import * as typeInfo from "ts-type-info";
import {TransformOptions} from "./TransformOptions";
import {StructureWrapper, StructurePropertyWrapper, StructureTypeWrapper} from "./wrappers";

export class TestFunctionBodyWriter {
    constructor(private readonly transformOptions: TransformOptions) {
    }

    writeForStructure(structure: StructureWrapper, writer: CodeBlockWriter) {
        writer.write(`this.assertions.describe("${structure.getName()}", () => `).inlineBlock(() => {
            structure.getValidExtendsStructures().forEach(extendsStructure => {
                this.writeExtends(extendsStructure, writer);
            });

            structure.getProperties().forEach(prop => {
                this.writeTestForProperty(structure, prop, writer);
            });
        }).write(");").newLine();
    }

    private writeExtends(extendsStructure: StructureWrapper, writer: CodeBlockWriter) {
        writer.writeLine(`this.${extendsStructure.getName()}TestRunner.runTest(` +
            `actual, ` +
            `expected);`);
    }

    private writeTestForProperty(structure: StructureWrapper, prop: StructurePropertyWrapper, writer: CodeBlockWriter) {
        writer.write(`this.assertions.it("should have the correct '${prop.getName()}' property", () => `).inlineBlock(() => {
            if (prop.shouldWriteOptionalAnyCheck()) {
                writer.write("this.assertions.assertAny(() => ").inlineBlock(() => {
                    writer.writeLine(`this.assertions.strictEqual(actual.${prop.getName()}, undefined);`);
                }).write(", () => ").inlineBlock(() => {
                    this.writeTypeTest(structure, prop, prop.getType(), writer);
                }).write(");");
            }
            else
                this.writeTypeTest(structure, prop, prop.getType(), writer);
        }).write(");").newLine();
    }

    private writeTypeTest(structure: StructureWrapper, prop: StructurePropertyWrapper, structureType: StructureTypeWrapper, writer: CodeBlockWriter) {
        const matchedTypeTransforms = structureType.getMatchedTypeTransforms();

        if (matchedTypeTransforms.length > 0) {
            writer.write("((actualProperty, expectedProperty) =>").inlineBlock(() => {
                matchedTypeTransforms.forEach(typeTransform => {
                    typeTransform.testWrite(writer);
                });
            }).write(`)(actual.${prop.getName()}, expected.${prop.getName()});`).newLine();
            return;
        }

        const unionTypes = structureType.getUnionTypes();
        const intersectionTypes = structureType.getIntersectionTypes();
        if (unionTypes.length > 0) {
            writer.write("this.assertions.assertAny(");
            unionTypes.forEach((subType, i) => {
                writer.conditionalWrite(i !== 0, ", ");
                writer.write("() => ").inlineBlock(() => {
                    this.writeTypeTest(structure, prop, subType, writer);
                });
            });
            writer.write(");").newLine();
        }
        else if (intersectionTypes.length > 0) {
            intersectionTypes.forEach(subType => {
                this.writeTypeTest(structure, prop, subType, writer);
            });
        }
        else {
            const validDefinitions = structureType.getImmediateValidDefinitions();
            const hasValidDefinition = validDefinitions.length > 0;
            const isTypeParameterType = structure.getTypeParameters().some(typeParam => typeParam.getName() === structureType.getText());

            if (isTypeParameterType)
                writer.writeLine(`this.${structureType.getText()}TestRunner.runTest(actual.${prop.getName()}, expected.${prop.getName()});`);
            else if (hasValidDefinition)
                writer.writeLine(`this.${validDefinitions[0].getName()}TestRunner.runTest(` +
                    `actual.${prop.getName()} as any as ${validDefinitions[0].getName()}, ` +
                    `expected.${prop.getName()} as any as ${this.transformOptions.getNameToTestStructureName(validDefinitions[0].getName())});`);
            else
                writer.writeLine(`this.assertions.strictEqual(actual.${prop.getName()}, expected.${prop.getName()});`);
        }
    }
}
