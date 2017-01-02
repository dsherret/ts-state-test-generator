import * as typeInfo from "ts-type-info";
import {TransformOptions} from "./TransformOptions";
import {StructureWrapper, StructureTypeWrapper, StructureTypeParameterWrapper} from "./wrappers";

export class TestRunnerFactoryGenerator {
    constructor(private readonly transformOptions: TransformOptions) {
    }

    fillTestFile(testFile: typeInfo.FileDefinition, structures: StructureWrapper[]) {
        const testRunnerFactory = testFile.addClass({
            name: "TestRunnerFactory",
            isExported: true,
            constructorDef: {
                parameters: [{
                    name: "assertions",
                    type: "Assertions",
                    isOptional: true
                }],
                onWriteFunctionBody: writer => {
                    writer.writeLine("this.assertions = new WrapperAssertions(assertions || new DefaultAssertions());");
                }
            },
            properties: [{
                name: "assertions",
                type: "WrapperAssertions",
                scope: typeInfo.Scope.Private,
                isReadonly: true
            }]
        });

        testRunnerFactory.addMethod({
            name: "getStrictEqualTestRunner",
            onWriteFunctionBody: writer => {
                writer.writeLine("return new StrictEqualTestRunner(this.assertions);");
            }
        });

        for (const structure of structures) {
            const typeParameters = structure.getTypeParameters();
            const method = testRunnerFactory.addMethod({
                name: `get${structure.getName()}TestRunner`,
                onWriteFunctionBody: methodWriter => {
                    methodWriter.write(`return new ${structure.getName()}TestRunner(this.assertions`);

                    function writeType(typeDef: StructureTypeWrapper) {
                        const validExtendsDefs = typeDef.getImmediateValidDefinitions();
                        if (validExtendsDefs.length === 0)
                            methodWriter.write(`this.getStrictEqualTestRunner()`);
                        else {
                            const typeArgs = typeDef.getTypeArguments();
                            const testRunnerName = `${validExtendsDefs[0].getName()}TestRunner`;
                            methodWriter.write(`this.get${testRunnerName}(`);
                            typeArgs.forEach((typeArg, i) => {
                                methodWriter.conditionalWrite(i !== 0, ", ");
                                writeType(typeArg);
                            });
                            methodWriter.write(`)`);
                        }
                    }

                    structure.getConstructorDependencies().forEach(dep => {
                        methodWriter.write(", ");

                        if (dep instanceof StructureTypeParameterWrapper) {
                            const testRunnerName = `${dep.getName()}TestRunner`;
                            methodWriter.write(`${testRunnerName}`);
                        }
                        else if (dep instanceof StructureTypeWrapper) {
                            writeType(dep);
                        }
                        else if (dep instanceof StructureWrapper) {
                            // todo: handle type parameters... currently this is a bug
                            methodWriter.write(`this.get${dep.getName()}TestRunner()`);
                        }
                    });

                    methodWriter.write(");");
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
            // add type parameters as method parameters
            typeParameters.forEach(typeParam => {
                method.addParameter({
                    name: `${typeParam.getName()}TestRunner`,
                    type: `TestRunner<${typeParam.getName()}, ${typeParam.getTestStructureName()}>`
                });
            });
        }
    }
}
