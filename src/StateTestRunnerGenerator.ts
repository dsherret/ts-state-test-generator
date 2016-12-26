import * as typeInfo from "ts-type-info";
import CodeBlockWriter from "code-block-writer";
import {TypeTransform} from "./TypeTransform";

type ClassOrInterfaceType = typeInfo.InterfaceDefinition | typeInfo.ClassDefinition;
type ClassOrInterfacePropertyType = typeInfo.InterfacePropertyDefinition | typeInfo.ClassPropertyDefinition;

export class StateTestRunnerGenerator {
    private readonly typeTransforms: TypeTransform[] = [];
    private readonly testStructureSuffix: string;
    private readonly testStructurePrefix: string;

    constructor(opts: { testStructurePrefix?: string; testStructureSuffix?: string; }) {
        this.testStructurePrefix = opts.testStructurePrefix || "";
        this.testStructureSuffix = opts.testStructureSuffix || "TestStructure";
    }

    addTypeTransform(typeTransform: TypeTransform) {
        this.typeTransforms.push(typeTransform);
    }

    fillTestFile(testFile: typeInfo.FileDefinition, structures: ClassOrInterfaceType[]) {
        structures = [...structures];
        const stateTestRunnerClass = testFile.addClass({
            name: "StateTestRunner",
            isExported: true
        });

        this.addConstructorToFile(stateTestRunnerClass);

        for (let i = 0; i < structures.length; i++) {
            const structure = structures[i];
            const testStructure = testFile.addInterface({ name: this.getChangedName(structure.name), isExported: true });
            const structureProperties = structure.properties as ClassOrInterfacePropertyType[];
            const writer = new CodeBlockWriter();
            const testMethod = stateTestRunnerClass.addMethod({
                name: `run${structure.name}Test`,
                parameters: [{
                    name: "actual",
                    type: structure.name
                }, {
                    name: "expected",
                    type: this.getChangedName(structure.name)
                }]
            });

            structureProperties.forEach(prop => {
                const validTypeDefinitions = prop.type.getAllDefinitions().filter(propTypeDefinition =>
                    propTypeDefinition instanceof typeInfo.ClassDefinition ||
                    propTypeDefinition instanceof typeInfo.InterfaceDefinition) as ClassOrInterfaceType[];

                validTypeDefinitions.forEach(validTypeDef => {
                    if (structures.indexOf(validTypeDef) === -1)
                        structures.push(validTypeDef);
                });

                this.createProperty(testStructure, prop, writer);
            });

            const validExtendsDefinitions: typeInfo.ClassDefinition[] = [];
            structure.extendsTypes.forEach(extendsType => {
                validExtendsDefinitions.push(...extendsType.definitions.filter(extendsTypeDefinition =>
                    extendsTypeDefinition instanceof typeInfo.ClassDefinition) as typeInfo.ClassDefinition[]);
            });
            if (validExtendsDefinitions.length > 0)
                testStructure.addExtends(this.getChangedName(validExtendsDefinitions[0].name));
            validExtendsDefinitions.forEach(validExtendsDef => {
                if (structures.indexOf(validExtendsDef) === -1)
                    structures.push(validExtendsDef);
            });

            testMethod.onWriteFunctionBody = methodBodyWriter => {
                methodBodyWriter.write(`this.assertions.describe("${structure.name}", () => `).inlineBlock(() => {
                    validExtendsDefinitions.forEach(validExtendsDef => {
                        methodBodyWriter.writeLine(`this.run${validExtendsDef.name}Test(` +
                            `actual as any as ${validExtendsDef.name}, ` +
                            `expected);`);
                    });
                    methodBodyWriter.write(writer.toString());
                }).write(");").newLine();
            };
        }

        return testFile;
    }

    private addConstructorToFile(stateTestRunnerClass: typeInfo.ClassDefinition) {
        // workaround until ts-code-generator/issues/#4 is changed
        stateTestRunnerClass.addProperty({
            name: "assertions",
            scope: typeInfo.Scope.Private,
            isReadonly: true,
            type: "WrapperAssertions"
        });
        stateTestRunnerClass.setConstructor({
            parameters: [{
                name: "assertions",
                type: "Assertions"
            }],
            onWriteFunctionBody: writer => {
                writer.writeLine("this.assertions = new WrapperAssertions(assertions || new DefaultAssertions());");
            }
        });
    }

    private createProperty(testStructure: typeInfo.InterfaceDefinition, prop: ClassOrInterfacePropertyType, writer: CodeBlockWriter) {
        writer.write(`this.assertions.it("should have the correct '${prop.name}' property", () => `).inlineBlock(() => {
            const newProp = testStructure.addProperty({
                name: prop.name,
                isOptional: prop.isOptional
            });
            newProp.type = this.getNewType(prop, writer);
        }).write(");").newLine();
    }

    private getNewType(prop: ClassOrInterfacePropertyType, writer: CodeBlockWriter) {
        const getNewTypeInternal = (typeDef: typeInfo.TypeDefinition) => {
            const newTypeDef = new typeInfo.TypeDefinition();
            const matchedTypeTransforms = this.typeTransforms.filter(t => t.condition(typeDef));

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

                newTypeDef.text = hasValidDefinition ? this.getChangedName(typeDef.text) : typeDef.text;

                if (hasValidDefinition)
                    writer.writeLine(`this.run${typeDef.definitions[0].name}Test(` +
                        `actual.${prop.name} as any as ${typeDef.definitions[0].name}, ` +
                        `expected.${prop.name} as any as ${this.getChangedName(typeDef.definitions[0].name)});`);
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

    private getChangedName(name: string) {
        return `${this.testStructurePrefix}${name}${this.testStructureSuffix}`;
    }
}
