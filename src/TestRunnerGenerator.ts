import * as typeInfo from "ts-type-info";
import CodeBlockWriter from "code-block-writer";
import {TestFunctionBodyWriter} from "./TestFunctionBodyWriter";
import {TestStructureGenerator} from "./TestStructureGenerator";
import {TypeTransformer} from "./TypeTransformer";
import {StructureWrapper, StructureTypeWrapper, StructureTypeParameterWrapper} from "./wrappers";

export class TestRunnerGenerator {
    private readonly testStructureGenerator = new TestStructureGenerator(new TypeTransformer());
    private readonly testFunctionBodyWriter = new TestFunctionBodyWriter();

    fillTestFile(testFile: typeInfo.FileDefinition, structures: StructureWrapper[]) {
        for (const structure of structures) {
            this.testStructureGenerator.fillTestFileFromDefinition(testFile, structure);

            const testRunnerClass = testFile.addClass({
                name: `${structure.getName()}TestRunner`,
                isExported: true,
                constructorDef: {
                    parameters: [{
                        name: "assertions",
                        type: "WrapperAssertions",
                        isReadonly: true,
                        scope: typeInfo.ClassConstructorParameterScope.Private
                    }]
                },
                methods: [{
                    name: "initialize"
                }]
            });

            // add initialize dependencies
            structure.getInitializeDependencies().forEach(dep => {
                if (dep instanceof StructureTypeParameterWrapper) {
                    this.addDependency(testRunnerClass, `${dep.getName()}TestRunner`, `TestRunner<${dep.getName()}, ${dep.getTestStructureName()}>`);
                }
                else if (dep instanceof StructureTypeWrapper) {
                    this.addDependency(testRunnerClass, `${dep.getImmediateValidDefinitions()[0].getName()}TestRunner`,
                        `TestRunner<${dep.getName()}, ${dep.getTestStructureNameForTestRunner()}>`);
                }
                else if (dep instanceof StructureWrapper) {
                    this.addDependency(testRunnerClass, `${dep.getName()}TestRunner`,
                        `TestRunner<${dep.getNameWithTypeParameters()}, ${dep.getTestStructureNameWithTypeParameters()}>`);
                }
            });

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

            const writer = new CodeBlockWriter();
            this.testFunctionBodyWriter.writeForStructure(structure, writer);

            testMethod.onWriteFunctionBody = methodBodyWriter => {
                methodBodyWriter.write(writer.toString());
            };

            const initializeMethod = testRunnerClass.getMethod("initialize")!;
            initializeMethod.onWriteFunctionBody = methodWriter => {
                initializeMethod.parameters.forEach(p => {
                    methodWriter.writeLine(`this.${p.name} = ${p.name};`);
                });
            };
            initializeMethod.parameters.forEach(p => {
                testRunnerClass.addProperty({
                    name: p.name!,
                    type: p.type.text,
                    scope: typeInfo.Scope.Private
                });
            });
        }
    }

    private addDependency(testRunnerClass: typeInfo.ClassDefinition, name: string, type: string) {
        const initializeMethod = testRunnerClass.getMethod("initialize");

        initializeMethod!.addParameter({
            name,
            type
        });
    }
}
