import * as typeInfo from "ts-type-info";
import CodeBlockWriter from "code-block-writer";

type ClassOrInterfaceType = typeInfo.InterfaceDefinition | typeInfo.ClassDefinition;
type ClassOrInterfacePropertyType = typeInfo.InterfacePropertyDefinition | typeInfo.ClassPropertyDefinition;

interface Data {
    structures: ClassOrInterfaceType[];
    testFile: typeInfo.FileDefinition;
}

interface TypeTransform {
    condition: (typeDef: typeInfo.TypeDefinition) => boolean;
    typeTransform: (newTypeDef: typeInfo.TypeDefinition) => void;
    testWrite: (CodeBlockWriter: CodeBlockWriter) => void;
}

export class TestGenerator {
    private readonly typeTransforms: TypeTransform[] = [];
    private readonly testStructureSuffix: string;
    private readonly testStructurePrefix: string;

    constructor(opts: { testStructurePrefix?: string; testStructureSuffix?: string; }) {
        this.testStructurePrefix = opts.testStructurePrefix || "";
        this.testStructureSuffix = opts.testStructureSuffix || "TestStructure";
    }

    addTypeTransform(
        condition: (typeDef: typeInfo.TypeDefinition) => boolean,
        typeTransform: (newTypeDef: typeInfo.TypeDefinition) => void,
        testWrite: (writer: CodeBlockWriter) => void
    ) {
        this.typeTransforms.push({ condition, typeTransform, testWrite });
    }

    getTestStructures(structures: ClassOrInterfaceType[]) {
        const data: Data = {
            structures: [...structures],
            testFile: typeInfo.createFile()
        };
        const stateTestRunnerClass = data.testFile.addClass({
            name: "StateTestRunner"
        });

        for (let i = 0; i < data.structures.length; i++) {
            const structure = data.structures[i];
            const testStructure = data.testFile.addInterface({ name: this.getChangedName(structure.name) });
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
                    if (data.structures.indexOf(validTypeDef) === -1)
                        data.structures.push(validTypeDef);
                });

                const newProp = testStructure.addProperty({
                    name: prop.name,
                    isOptional: prop.isOptional
                });
                newProp.type = this.getNewType(prop, writer);
            });

            const methodText = writer.toString();
            testMethod.onWriteFunctionBody = methodBodyWriter => {
                methodBodyWriter.write(methodText);
            };
        }

        return data.testFile;
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
                }).write(`)(actual.${prop.name}, expected.${prop.name});`);
                return newTypeDef;
            }

            if (typeDef.unionTypes.length > 0) {
                writer.write("assertAny(");
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
                writer.write("assertAll(");
                typeDef.intersectionTypes.forEach((subType, i) => {
                    writer.conditionalWrite(i !== 0, ", ");
                    writer.write("() => ").inlineBlock(() => {
                        const newSubType = getNewTypeInternal(subType);
                        newTypeDef.intersectionTypes.push(newSubType);
                    });
                });
                writer.write(");").newLine();

                newTypeDef.text = `(${newTypeDef.intersectionTypes.map(t => t.text).join(" & ")})`;
            }
            else {
                const hasValidDefinition = typeDef.definitions.some(typeDefinitionDefinition =>
                    typeDefinitionDefinition instanceof typeInfo.ClassDefinition ||
                    typeDefinitionDefinition instanceof typeInfo.InterfaceDefinition);

                newTypeDef.text = hasValidDefinition ? this.getChangedName(typeDef.text) : typeDef.text;

                if (hasValidDefinition)
                    writer.writeLine(`this.run${typeDef.definitions[0].name}Test(actual.${prop.name} as ${typeDef.definitions[0].name}, expected.${prop.name});`);
                else
                    writer.writeLine(`assert.strictEqual(actual.${prop.name}, expected.${prop.name});`);
            }

            return newTypeDef;
        };

        return getNewTypeInternal(prop.type);
    }

    private getChangedName(name: string) {
        return `${this.testStructurePrefix}${name}${this.testStructureSuffix}`;
    }
}
