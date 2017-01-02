import * as typeInfo from "ts-type-info";
import {TransformOptions} from "./TransformOptions";
import {StructureWrapper} from "./wrappers";

export class StateTestRunnerGenerator {
    constructor(private readonly transformOptions: TransformOptions) {
    }

    fillTestFile(testFile: typeInfo.FileDefinition, structures: StructureWrapper[]) {
        const stateTestRunner = testFile.addClass({
            name: "StateTestRunner",
            isExported: true,
            constructorDef: {
                parameters: [{
                    name: "factory",
                    type: "TestRunnerFactory",
                    isReadonly: true,
                    scope: typeInfo.ClassConstructorParameterScope.Private
                }]
            }
        });

        for (const structure of structures) {
            const typeParameters = structure.getTypeParameters();
            const method = stateTestRunner.addMethod({
                name: `run${structure.getName()}Test`,
                parameters: [{
                    name: "actual",
                    type: structure.getNameWithTypeParameters()
                }, {
                    name: "expected",
                    type: structure.getTestStructureNameWithTypeParameters()
                }],
                onWriteFunctionBody: methodWriter => {
                    methodWriter.write(`const testRunner = this.factory.get${structure.getName()}TestRunner(`);
                    typeParameters.forEach((typeParam, i) => {
                        methodWriter.conditionalWrite(i !== 0, ", ");
                        methodWriter.write(`${typeParam.getName()}TestRunner`);
                    });
                    methodWriter.write(");").newLine();
                    methodWriter.writeLine("testRunner.runTest(actual, expected);");
                }
            });

            // add type parameters for actual
            typeParameters.forEach(typeParam => {
                const constraintType = typeParam.getConstraintType();
                method.addTypeParameter({
                    name: typeParam.getName(),
                    constraintType: constraintType == null ? undefined : constraintType.getText()
                });
            });
            // add type parameters for expected
            typeParameters.forEach(typeParam => {
                const constraintType = typeParam.getConstraintType();
                method.addTypeParameter({
                    name: typeParam.getTestStructureName(),
                    constraintType: constraintType == null ? undefined : constraintType.getTestStructureName()
                });
            });
            // add type parameters to method
            typeParameters.forEach(typeParam => {
                method.addParameter({
                    name: `${typeParam.getName()}TestRunner`,
                    type: `TestRunner<${typeParam.getName()}, ${typeParam.getTestStructureName()}>`
                });
            });
        }
    }
}
