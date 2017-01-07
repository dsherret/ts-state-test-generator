import * as typeInfo from "ts-type-info";
import CodeBlockWriter from "code-block-writer";
import {AssertionsClassGenerator} from "./AssertionsClassGenerator";
import {TransformOptions} from "./TransformOptions";
import {TestRunnerGenerator} from "./TestRunnerGenerator";
import {TestRunnerInterfaceGenerator} from "./TestRunnerInterfaceGenerator";
import {TestRunnerArgsCacheGenerator} from "./TestRunnerArgsCacheGenerator";
import {StructureDependencyGetter} from "./StructureDependencyGetter";
import {StateTestRunnerGenerator} from "./StateTestRunnerGenerator";
import {TestRunnerFactoryGenerator} from "./TestRunnerFactoryGenerator";
import {WrapperFactory} from "./wrappers";

export class TestGenerator {
    private readonly assertionsClassGenerator = new AssertionsClassGenerator();
    private readonly testRunnerInterfaceGenerator = new TestRunnerInterfaceGenerator();
    private readonly testRunnerArgsCacheGenerator = new TestRunnerArgsCacheGenerator();
    private readonly structureDependencyGetter = new StructureDependencyGetter();
    private readonly transformOptions: TransformOptions;
    private readonly testRunnerGenerator: TestRunnerGenerator;
    private readonly stateTestRunnerGenerator: StateTestRunnerGenerator;
    private readonly testRunnerFactoryGenerator: TestRunnerFactoryGenerator;
    private readonly wrapperFactory: WrapperFactory;

    constructor(opts: { testStructurePrefix?: string; testStructureSuffix?: string; }) {
        this.transformOptions = new TransformOptions(opts);
        this.testRunnerGenerator = new TestRunnerGenerator(this.transformOptions);
        this.stateTestRunnerGenerator = new StateTestRunnerGenerator(this.transformOptions);
        this.testRunnerFactoryGenerator = new TestRunnerFactoryGenerator(this.transformOptions);
        this.wrapperFactory = new WrapperFactory(this.transformOptions);
    }

    addTypeTransform(
        condition: (typeDef: typeInfo.TypeDefinition) => boolean,
        typeTransform: (newTypeDef: typeInfo.TypeDefinition) => void,
        testWrite: (writer: CodeBlockWriter) => void
    ) {
        this.transformOptions.addTypeTransform({ condition, typeTransform, testWrite });
    }

    addDefaultValue(
        condition: (
            propertyDef: typeInfo.ClassPropertyDefinition | typeInfo.InterfacePropertyDefinition,
            parent?: typeInfo.ClassDefinition | typeInfo.InterfaceDefinition
        ) => boolean,
        value: string
    ) {
        this.transformOptions.addDefaultValue({ condition, value });
    }

    getTestFile(structures: (typeInfo.InterfaceDefinition | typeInfo.ClassDefinition)[]) {
        const testFile = typeInfo.createFile();
        this.assertionsClassGenerator.fillFile(testFile);
        this.testRunnerInterfaceGenerator.fillFile(testFile);
        this.testRunnerArgsCacheGenerator.fillFile(testFile);
        const structureWrappers = this.structureDependencyGetter.getAllStructures(structures.map(s => this.wrapperFactory.getStructure(s)));
        this.testRunnerFactoryGenerator.fillTestFile(testFile, structureWrappers);
        this.stateTestRunnerGenerator.fillTestFile(testFile, structureWrappers);
        this.testRunnerGenerator.fillTestFile(testFile, structureWrappers);
        return testFile;
    }
}
