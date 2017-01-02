﻿import CodeBlockWriter from "code-block-writer";
import {TransformOptions} from "./TransformOptions";
import {StructureWrapper, StructurePropertyWrapper, StructureTypeWrapper} from "./wrappers";

export class TestFunctionBodyWriter {
    constructor(private readonly transformOptions: TransformOptions) {
    }

    writeForStructure(structure: StructureWrapper, writer: CodeBlockWriter) {
        writer.write(`this.assertions.describe("${structure.getName()}", () => `).inlineBlock(() => {
            this.writeNullCheck(writer);
            structure.getValidExtendsStructures().forEach(extendsStructure => {
                this.writeExtends(extendsStructure, writer);
            });

            structure.getProperties().forEach(prop => {
                this.writeTestForProperty(structure, prop, writer);
            });
        }).write(");").newLine();
    }

    private writeNullCheck(writer: CodeBlockWriter) {
        writer.write("if (actual == null && expected != null)").block(() => {
            writer.write(`this.assertions.it("should not be null", () => `).inlineBlock(() => {
                writer.write(`throw new Error("It's null");`);
            }).write(");").newLine();
            writer.writeLine("return;");
        });
    }

    private writeExtends(extendsStructure: StructureWrapper, writer: CodeBlockWriter) {
        writer.writeLine(`this.${extendsStructure.getName()}TestRunner.runTest(` +
            `actual, ` +
            `expected);`);
    }

    private writeTestForProperty(structure: StructureWrapper, prop: StructurePropertyWrapper, writer: CodeBlockWriter) {
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
        const matchedDefaultValueTransforms = this.transformOptions.getDefaultValueTransforms().filter(t => t.condition(prop.getDefinition(), structure.getDefinition()));
        if (matchedDefaultValueTransforms.length > 0) {
            writer.writeLine(`let expectedValue = expected.${prop.getName()};`);
            writer.write(`if (typeof expectedValue === "undefined")`).block(() => {
                writer.writeLine(`expectedValue = ${matchedDefaultValueTransforms[0].value};`);
            });
            writer.write(`this.assertions.it("should have the same value", () => `).inlineBlock(() => {
                writer.writeLine(`this.assertions.strictEqual(actual.${prop.getName()}, expectedValue);`);
            }).write(");");
            return;
        }

        this.writeTypeTest(structure, structureType, writer, `actual.${prop.getName()}`, `expected.${prop.getName()}`);
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
            writer.write("this.assertions.assertAny(");
            unionTypes.forEach((subType, i) => {
                writer.conditionalWrite(i !== 0, ", ");
                writer.write("() => ").inlineBlock(() => {
                    this.writeTypeTest(structure, subType, writer, actualName, expectedName);
                });
            });
            writer.write(");").newLine();
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
        const isTypeParameterType = structure.getTypeParameters().some(typeParam => typeParam.getName() === structureType.getText());
        const isArrayType = structureType.getIsArrayType();

        if (isArrayType) {
            writer.write(`this.assertions.it("should have the same length", () => `).inlineBlock(() => {
                writer.writeLine(`this.assertions.strictEqual(${actualName}.length, ${expectedName}.length);`);
            }).write(");").newLine();

            writer.write(`for (let i = 0; i < (${expectedName} || []).length; i++)`).block(() => {
                writer.write("this.assertions.describe(`index ${i}`, () => ").inlineBlock(() => {
                    writer.write("((actualValue, expectedValue) => ").inlineBlock(() => {
                        this.writeTypeTest(structure, structureType.getArrayType()!, writer, `actualValue`, `expectedValue`);
                    }).write(`)(${actualName}[i], ${expectedName}[i]);`);
                }).write(");");
            });
        }
        else if (isTypeParameterType)
            writer.writeLine(`this.${structureType.getText()}TestRunner.runTest(${actualName}, ${expectedName});`);
        else if (hasValidDefinition) {
            const isSameClass = validDefinitions[0].getName() === structure.getName();
            const runTestMethodName = isSameClass ? "runTest" : `${validDefinitions[0].getName()}TestRunner.runTest`;

            writer.writeLine(`this.${runTestMethodName}(` +
                `${actualName} as any as ${validDefinitions[0].getName()}, ` +
                `${expectedName} as any as ${this.transformOptions
                .getNameToTestStructureName(validDefinitions[0].getName())});`);
        }
        else {
            writer.write(`this.assertions.it("should have the same value", () => `).inlineBlock(() => {
                writer.writeLine(`this.assertions.strictEqual(${actualName}, ${expectedName});`);
            }).write(");");
        }
    }
}
