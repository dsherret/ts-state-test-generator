import CodeBlockWriter from "code-block-writer";
import {StructureWrapper, StructurePropertyWrapper, StructureTypeWrapper} from "./wrappers";

export class TestFunctionBodyWriter {
    writeForStructure(structure: StructureWrapper, writer: CodeBlockWriter) {
        writer.write(`this.assertions.describe("${structure.getName()}", () => `).inlineBlock(() => {
            this.writeNullCheck(writer);
            structure.getValidExtendsStructures().forEach(extendsStructure => {
                this.writeExtends(extendsStructure, writer);
            });

            structure.getProperties().forEach(prop => {
                this.writeTestForProperty(structure, prop, writer);
            });

            structure.getCustomTestTransforms().forEach(transform => {
                transform.testWrite(writer, structure.getDefinition());
            });
        }).write(");").newLine();
    }

    private writeNullCheck(writer: CodeBlockWriter) {
        writer.writeLine("if (this.assertions.isNull(actual, expected)) return;");
    }

    private writeExtends(extendsStructure: StructureWrapper, writer: CodeBlockWriter) {
        writer.writeLine(`this.${extendsStructure.getName()}TestRunner.runTest(actual, expected);`);
    }

    private writeTestForProperty(structure: StructureWrapper, prop: StructurePropertyWrapper, writer: CodeBlockWriter) {
        if (prop.hasMatchedOptInTransforms()) {
            writer.write(`if (typeof expected.${prop.getName()} !== "undefined")`).block(() => {
                this.writeTestForPropertyInternal(structure, prop, writer);
            });
        }
        else
            this.writeTestForPropertyInternal(structure, prop, writer);
    }

    private writeTestForPropertyInternal(structure: StructureWrapper, prop: StructurePropertyWrapper, writer: CodeBlockWriter) {
        writer.write(`this.assertions.describe("${prop.getName()}", () => `).inlineBlock(() => {
            if (prop.shouldWriteOptionalAnyCheck()) {
                writer.write("this.assertions.assertAny(() => ").inlineBlock(() => {
                    writer.write(`this.assertions.it("should be undefined", () => `).inlineBlock(() => {
                        writer.writeLine(`this.assertions.strictEqual(actual.${prop.getName()}, undefined);`);
                    }).write(");");
                }).write(", () => ").inlineBlock(() => {
                    this.writePropertyTypeTest(structure, prop, prop.getType(), writer);
                }).write(");");
            }
            else
                this.writePropertyTypeTest(structure, prop, prop.getType(), writer);
        }).write(");").newLine();
    }

    private writePropertyTypeTest(
        structure: StructureWrapper,
        prop: StructurePropertyWrapper,
        structureType: StructureTypeWrapper,
        writer: CodeBlockWriter
    ) {
        const matchedDefaultValueTransforms = prop.getMatchedDefaultTransforms();
        // todo: use the transformed properties name
        writer.writeLine(`let actualValue = actual.${prop.getName()};`);
        writer.writeLine(`let expectedValue = expected.${prop.getName()};`);
        if (matchedDefaultValueTransforms.length > 0) {
            writer.write(`if (typeof expectedValue === "undefined")`).block(() => {
                writer.writeLine(`expectedValue = ${matchedDefaultValueTransforms[0].value};`);
            });
        }

        const matchedPropertyTransforms = prop.getMatchedPropertyTransforms();
        if (matchedPropertyTransforms.length > 0) {
            // todo: use the transformed properties name
            writer.write(`this.assertions.it("should have the same value", () => `).inlineBlock(() => {
                matchedPropertyTransforms.forEach(transform => {
                    transform.testWrite(writer);
                });
            }).write(");");
            return;
        }

        this.writeTypeTest(structure, structureType, writer, `actualValue`, `expectedValue`);
    }

    private writeTypeTest(
        structure: StructureWrapper,
        structureType: StructureTypeWrapper,
        writer: CodeBlockWriter,
        actualName: string,
        expectedName: string
    ) {
        const matchedTypeTransforms = structureType.getMatchedTypeTransforms();
        if (matchedTypeTransforms.length > 0) {
            writer.write("((actualValue, expectedValue) => ").inlineBlock(() => {
                writer.write(`this.assertions.it("should have the same value", () => `).inlineBlock(() => {
                    matchedTypeTransforms.forEach(typeTransform => {
                        typeTransform.testWrite(writer);
                    });
                }).write(");");
            }).write(`)(${actualName}, ${expectedName});`).newLine();
            return;
        }

        const unionTypes = structureType.getUnionTypes();
        const intersectionTypes = structureType.getIntersectionTypes();
        if (unionTypes.length > 0) {
            writer.write(`this.assertions.it("should equal one of the union types", () => `).inlineBlock(() => {
                writer.write("this.assertions.assertAny(");
                unionTypes.forEach((subType, i) => {
                    writer.conditionalWrite(i !== 0, ", ");
                    writer.write("() => ").inlineBlock(() => {
                        this.writeTypeTest(structure, subType, writer, actualName, expectedName);
                    });
                });
                writer.write(");").newLine();
            }).write(");").newLine();
        }
        else if (intersectionTypes.length > 0) {
            intersectionTypes.forEach(subType => {
                this.writeTypeTest(structure, subType, writer, actualName, expectedName);
            });
        }
        else {
            this.writeNonUnionAndIntersectionTypeTest(structure, structureType, writer, actualName, expectedName);
        }
    }

    private writeNonUnionAndIntersectionTypeTest(
        structure: StructureWrapper,
        structureType: StructureTypeWrapper,
        writer: CodeBlockWriter,
        actualName: string,
        expectedName: string
    ) {
        const validDefinitions = structureType.getImmediateValidDefinitions();
        const hasValidDefinition = validDefinitions.length > 0;
        const arrayType = structureType.getArrayType();

        if (arrayType != null) {
            writer.write(`this.assertions.it("should have the same length", () => `).inlineBlock(() => {
                writer.writeLine(`this.assertions.strictEqual(${actualName}!.length, ${expectedName}!.length);`);
            }).write(");").newLine();

            writer.write(`for (let i = 0; i < (${expectedName} || []).length; i++)`).block(() => {
                writer.write("((actualValue, expectedValue, i) => ").inlineBlock(() => {
                    writer.write("this.assertions.describe(`index ${i}`, () => ").inlineBlock(() => {
                        this.writeTypeTest(structure, arrayType, writer, `actualValue`, `expectedValue`);
                    }).write(");");
                }).write(`)(${actualName}[i], ${expectedName}![i], i);`);
            });
        }
        else if (structureType.isTypeParameterType())
            writer.writeLine(`this.${structureType.getText()}TestRunner.runTest(${actualName}, ${expectedName});`);
        else if (hasValidDefinition) {
            const isSameClass = validDefinitions[0].getName() === structure.getName();
            const runTestMethodName = isSameClass ? "runTest" : `${validDefinitions[0].getName()}TestRunner.runTest`;

            writer.writeLine(`this.${runTestMethodName}(` +
                `${actualName} as any as ${validDefinitions[0].getName()}, ` +
                `${expectedName} as any as ${validDefinitions[0].getTestStructureName()});`);
        }
        else {
            writer.write(`this.assertions.it("should have the same value", () => `).inlineBlock(() => {
                writer.writeLine(`this.assertions.strictEqual(${actualName}, ${expectedName});`);
            }).write(");");
        }
    }
}
