import * as typeInfo from "ts-type-info";
import CodeBlockWriter from "code-block-writer";
import {TransformOptions} from "./TransformOptions";
import {TestFunctionBodyWriter} from "./TestFunctionBodyWriter";

type ClassOrInterfaceType = typeInfo.InterfaceDefinition | typeInfo.ClassDefinition;
type ClassOrInterfacePropertyType = typeInfo.InterfacePropertyDefinition | typeInfo.ClassPropertyDefinition;

export class StateTestRunnerGenerator {
    private readonly testFunctionBodyWriter: TestFunctionBodyWriter;

    constructor(private readonly transformOptions: TransformOptions) {
        this.testFunctionBodyWriter = new TestFunctionBodyWriter(transformOptions);
    }

    private getNameWithTypeParameters(name: string, structure: ClassOrInterfaceType) {
        if (structure.typeParameters.length === 0)
            return name;

        name += "<";
        structure.typeParameters.forEach(typeParam => {
            name += typeParam.name;
        });
        name += ">";
        return name;
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
            const testStructure = testFile.addInterface({ name: this.transformOptions.getNameToTestStructureName(structure.name), isExported: true });
            const structureProperties = structure.properties as ClassOrInterfacePropertyType[];
            const writer = new CodeBlockWriter();
            const testMethod = stateTestRunnerClass.addMethod({
                name: `run${structure.name}Test`,
                parameters: [{
                    name: "actual",
                    type: this.getNameWithTypeParameters(structure.name, structure)
                }, {
                    name: "expected",
                    type: this.getNameWithTypeParameters(this.transformOptions.getNameToTestStructureName(structure.name), structure)
                }]
            });

            structure.typeParameters.forEach(typeParam => {
                testMethod.addTypeParameter({
                    name: typeParam.name,
                    constraintType: typeParam.constraintType == null ? undefined : typeParam.constraintType.text
                });
                testStructure.addTypeParameter({
                    name: typeParam.name,
                    constraintType: typeParam.constraintType == null ? undefined : typeParam.constraintType.text
                });
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
                testStructure.addExtends(this.transformOptions.getNameToTestStructureName(validExtendsDefinitions[0].name));
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
            newProp.type = this.testFunctionBodyWriter.getNewType(prop, writer);
        }).write(");").newLine();
    }
}
