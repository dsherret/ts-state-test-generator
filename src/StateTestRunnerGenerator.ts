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
        this.testStructureGenerator = new TestStructureGenerator(new TypeTransformer());
        this.testFunctionBodyWriter = new TestFunctionBodyWriter(transformOptions);
    }

    fillTestFile(testFile: typeInfo.FileDefinition, structures: StructureWrapper[]) {
        for (let i = 0; i < structures.length; i++) {
            const structure = structures[i];
            const writer = new CodeBlockWriter();

            this.testStructureGenerator.fillTestFileFromDefinition(testFile, structure);

            const testRunnerClass = testFile.addClass({
                name: `${structure.getName()}TestRunner`,
                isExported: true
            });
            this.addConstructorToClass(testRunnerClass);

            this.testFunctionBodyWriter.writeForStructure(structure, writer);

            const testMethod = testRunnerClass.addMethod({
                name: `runTest`,
                parameters: [{
                    name: "actual",
                    type: structure.getNameWithTypeParameters()
                }, {
                    name: "expected",
                    type: structure.getTestStructureNameWithTypeParameters()
                }]
            });

            testRunnerClass.addImplements(`TestRunner<${structure.getNameWithTypeParameters()}, ${structure.getTestStructureNameWithTypeParameters()}>`);

            const typeParameters = structure.getTypeParameters();
            // add type parameters for actual
            typeParameters.forEach(typeParam => {
                const constraintType = typeParam.getConstraintType();
                testRunnerClass.addTypeParameter({
                    name: typeParam.getName(),
                    constraintType: constraintType == null ? undefined : constraintType.getText()
                });
            });
            // add type parameters for expected
            typeParameters.forEach(typeParam => {
                const constraintType = typeParam.getConstraintType();
                testRunnerClass.addTypeParameter({
                    name: typeParam.getTestStructureName(),
                    constraintType: constraintType == null ? undefined : constraintType.getTestStructureName()
                });
            });
            // add constructor parameters for type parameters
            typeParameters.forEach(typeParam => {
                testRunnerClass.constructorDef.addParameter({
                    name: typeParam.getName() + "TestRunner",
                    type: `TestRunner<${typeParam.getName()}, ${typeParam.getTestStructureName()}>`,
                    isReadonly: true,
                    scope: typeInfo.ClassConstructorParameterScope.Private
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
        testClass.setConstructor({
            parameters: [{
                name: "assertions",
                type: "WrapperAssertions",
                isReadonly: true,
                scope: typeInfo.ClassConstructorParameterScope.Private
            }]
        });
    }
}
