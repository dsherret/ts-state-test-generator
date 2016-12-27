﻿import * as typeInfo from "ts-type-info";
import CodeBlockWriter from "code-block-writer";
import {AssertionsClassGenerator} from "./AssertionsClassGenerator";
import {TransformOptions} from "./TransformOptions";
import {StateTestRunnerGenerator} from "./StateTestRunnerGenerator";
import {BaseTestInterfaceGenerator} from "./BaseTestInterfaceGenerator";
import {WrapperFactory} from "./wrappers";

export class TestGenerator {
    private readonly assertionsClassGenerator = new AssertionsClassGenerator();
    private readonly baseTestInterfaceGenerator = new BaseTestInterfaceGenerator();
    private readonly transformOptions: TransformOptions;
    private readonly stateTestRunnerGenerator: StateTestRunnerGenerator;
    private readonly wrapperFactory: WrapperFactory;

    constructor(opts: { testStructurePrefix?: string; testStructureSuffix?: string; }) {
        this.transformOptions = new TransformOptions(opts);
        this.stateTestRunnerGenerator = new StateTestRunnerGenerator(this.transformOptions);
        this.wrapperFactory = new WrapperFactory(this.transformOptions);
    }

    addTypeTransform(
        condition: (typeDef: typeInfo.TypeDefinition) => boolean,
        typeTransform: (newTypeDef: typeInfo.TypeDefinition) => void,
        testWrite: (writer: CodeBlockWriter) => void
    ) {
        this.transformOptions.addTypeTransform({ condition, typeTransform, testWrite });
    }

    getTestFile(structures: (typeInfo.InterfaceDefinition | typeInfo.ClassDefinition)[]) {
        const testFile = typeInfo.createFile();
        this.assertionsClassGenerator.fillFile(testFile);
        this.baseTestInterfaceGenerator.fillFile(testFile);
        this.stateTestRunnerGenerator.fillTestFile(testFile, structures.map(s => this.wrapperFactory.getStructure(s)));
        return testFile;
    }
}
