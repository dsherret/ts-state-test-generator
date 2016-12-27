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
        this.testStructureGenerator = new TestStructureGenerator(new TypeTransformer(transformOptions));
    }

    fillTestFile(testFile: typeInfo.FileDefinition, structures: StructureWrapper[]) {
        for (let i = 0; i < structures.length; i++) {
            const structure = structures[i];
            const writer = new CodeBlockWriter();
            const stateTestRunnerClass = testFile.addClass({
                name: `${structure.getName()}TestRunner`,
                isExported: true
            });

            this.testStructureGenerator.fillTestFileFromDefinition(testFile, structure);
            this.testFunctionBodyWriter.writeForStructure(structure, writer);

            this.addConstructorToClass(stateTestRunnerClass);

            const testMethod = stateTestRunnerClass.addMethod({
                name: `runTest`,
                parameters: [{
                    name: "actual",
                    type: this.getNameWithTypeParameters(structure.getName(), structure)
                }, {
                    name: "expected",
                    type: this.getNameWithTypeParameters(this.transformOptions.getNameToTestStructureName(structure.getName()), structure)
                }]
            });

            structure.getTypeParameters().forEach(typeParam => {
                const constraintType = typeParam.getConstraintType();
                testMethod.addTypeParameter({
                    name: typeParam.getName(),
                    constraintType: constraintType == null ? undefined : constraintType.text
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
                scope: typeInfo.ClassConstructorParameterScope.Private,
                isReadonly: true
            }]
        });
    }

    private getNameWithTypeParameters(name: string, structure: StructureWrapper) {
        const typeParams = structure.getTypeParameters();
        if (typeParams.length === 0)
            return name;

        name += "<";
        typeParams.forEach((typeParam, i) => {
            if (i > 0)
                name += ", ";
            name += typeParam.getName();
        });
        name += ">";
        return name;
    }
}
