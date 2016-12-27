import * as typeInfo from "ts-type-info";
import CodeBlockWriter from "code-block-writer";
import {TransformOptions} from "./TransformOptions";
import {TestFunctionBodyWriter} from "./TestFunctionBodyWriter";
import {TestStructureGenerator} from "./TestStructureGenerator";
import {TypeTransformer} from "./TypeTransformer";
import {StructureWrapper} from "./wrappers";

export class StateTestRunnerGenerator {
    private readonly testStructureGenerator: TestStructureGenerator;
    private readonly testFunctionBodyWriter: TestFunctionBodyWriter;

    constructor(private readonly transformOptions: TransformOptions) {
        this.testFunctionBodyWriter = new TestFunctionBodyWriter(transformOptions);
        this.testStructureGenerator = new TestStructureGenerator(new TypeTransformer());
    }

    fillTestFile(testFile: typeInfo.FileDefinition, structures: StructureWrapper[]) {
        const stateTestRunnerClass = testFile.addClass({
            name: `StateTestRunner`,
            isExported: true
        });
        this.addConstructorToClass(stateTestRunnerClass);

        for (let i = 0; i < structures.length; i++) {
            const structure = structures[i];
            const writer = new CodeBlockWriter();

            this.testStructureGenerator.fillTestFileFromDefinition(testFile, structure);
            this.testFunctionBodyWriter.writeForStructure(structure, writer);

            const testMethod = stateTestRunnerClass.addMethod({
                name: `run${structure.getName()}Test`,
                parameters: [{
                    name: "actual",
                    type: structure.getNameWithTypeParameters()
                }, {
                    name: "expected",
                    type: structure.getTestStructureNameWithTypeParameters()
                }]
            });

            structure.getTypeParameters().forEach(typeParam => {
                const constraintType = typeParam.getConstraintType();
                testMethod.addTypeParameter({
                    name: typeParam.getName(),
                    constraintType: constraintType == null ? undefined : constraintType.getText()
                });
            });

            structure.getProperties().forEach(prop => {
                const validTypeDefinitions = prop.getAllValidTypeStructures();

                validTypeDefinitions.forEach(validTypeDef => {
                    if (structures.indexOf(validTypeDef) === -1)
                        structures.push(validTypeDef);
                });
            });

            const validExtendsStructures = structure.getValidExtendsStructures();
            validExtendsStructures.forEach(extendsStructure => {
                if (structures.indexOf(extendsStructure) === -1)
                    structures.push(extendsStructure);
            });

            structure.getTypeParameters().forEach(typeParam => {
                const constraintType = typeParam.getConstraintType();
                if (constraintType == null)
                    return;

                constraintType.getAllValidDefinitions().forEach(constraintTypeStructure => {
                    if (structures.indexOf(constraintTypeStructure) === -1)
                        structures.push(constraintTypeStructure);
                });
            });

            testMethod.onWriteFunctionBody = methodBodyWriter => {
                methodBodyWriter.write(writer.toString());
            };
        }

        return testFile;
    }

    private addConstructorToClass(testClass: typeInfo.ClassDefinition) {
        testClass.addProperty({
            name: "assertions",
            isReadonly: true,
            scope: typeInfo.Scope.Private,
            type: "WrapperAssertions"
        });
        testClass.setConstructor({
            parameters: [{
                name: "assertions",
                type: "Assertions"
            }],
            onWriteFunctionBody: writer => {
                writer.writeLine("this.assertions = new WrapperAssertions(assertions || new DefaultAssertions());");
            }
        });
    }
}
