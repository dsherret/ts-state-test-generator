import * as typeInfo from "ts-type-info";
import CodeBlockWriter from "code-block-writer";
import {AssertionsClassGenerator} from "./AssertionsClassGenerator";
import {TypeTransform} from "./TypeTransform";
import {StateTestRunnerGenerator} from "./StateTestRunnerGenerator";

export class TestGenerator {
    private readonly assertionsClassGenerator = new AssertionsClassGenerator();
    private readonly stateTestRunnerGenerator: StateTestRunnerGenerator;

    constructor(opts: { testStructurePrefix?: string; testStructureSuffix?: string; }) {
        this.stateTestRunnerGenerator = new StateTestRunnerGenerator(opts);
    }

    addTypeTransform(
        condition: (typeDef: typeInfo.TypeDefinition) => boolean,
        typeTransform: (newTypeDef: typeInfo.TypeDefinition) => void,
        testWrite: (writer: CodeBlockWriter) => void
    ) {
        this.stateTestRunnerGenerator.addTypeTransform({ condition, typeTransform, testWrite });
    }

    getTestFile(structures: (typeInfo.InterfaceDefinition | typeInfo.ClassDefinition)[]) {
        const testFile = typeInfo.createFile();
        this.assertionsClassGenerator.fillFile(testFile);
        this.stateTestRunnerGenerator.fillTestFile(testFile, structures);
        return testFile;
    }
}
