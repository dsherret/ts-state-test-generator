import * as typeInfo from "ts-type-info";
import CodeBlockWriter from "code-block-writer";
import {TransformOptions} from "./TransformOptions";
import {TestFunctionBodyWriter} from "./TestFunctionBodyWriter";
import {TestStructureGenerator} from "./TestStructureGenerator";
import {TypeTransformer} from "./TypeTransformer";
import {StructureWrapper} from "./wrappers";

export class TestRunnerGenerator {
    private readonly testStructureGenerator: TestStructureGenerator;
    private readonly testFunctionBodyWriter: TestFunctionBodyWriter;

    constructor(private readonly transformOptions: TransformOptions) {
        this.testStructureGenerator = new TestStructureGenerator(new TypeTransformer());
        this.testFunctionBodyWriter = new TestFunctionBodyWriter(transformOptions);
    }

    fillTestFile(testFile: typeInfo.FileDefinition, structures: StructureWrapper[]) {
        for (const structure of structures) {
            const writer = new CodeBlockWriter();

            this.testStructureGenerator.fillTestFileFromDefinition(testFile, structure);

            const testRunnerClass = testFile.addClass({
                name: `${structure.getName()}TestRunner`,
                isExported: true
            });
            this.addConstructorDependency(testRunnerClass, "assertions", "WrapperAssertions");

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
                this.addConstructorDependency(testRunnerClass, `${typeParam.getName()}TestRunner`, `TestRunner<${typeParam.getName()}, ${typeParam.getTestStructureName()}>`);
            });
            // add constructor parameters for extends type
            const validExtendsTypes = structure.getValidExtendsTypes();
            validExtendsTypes.forEach(extendsType => {
                this.addConstructorDependency(testRunnerClass, `${extendsType.getImmediateValidDefinitions()[0].getName()}TestRunner`,
                    `TestRunner<${extendsType.getName()}, ${extendsType.getTestStructureName()}>`);
            });

            testMethod.onWriteFunctionBody = methodBodyWriter => {
                methodBodyWriter.write(writer.toString());
            };
        }

        return testFile;
    }

    private addConstructorDependency(testRunnerClass: typeInfo.ClassDefinition, name: string, type: string) {
        if (testRunnerClass.constructorDef == null)
            testRunnerClass.setConstructor({});

        const dependencyExists = testRunnerClass.constructorDef.parameters.some(p => p.name === name);
        if (dependencyExists)
            return;

        testRunnerClass.constructorDef.addParameter({
            name,
            type,
            isReadonly: true,
            scope: typeInfo.ClassConstructorParameterScope.Private
        });
    }
}
