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
import {TestFunctionGenerator} from "./TestFunctionGenerator";
import {WrapperFactory} from "./wrappers";

export class TestGenerator {
    private readonly assertionsClassGenerator = new AssertionsClassGenerator();
    private readonly testRunnerInterfaceGenerator = new TestRunnerInterfaceGenerator();
    private readonly testRunnerArgsCacheGenerator = new TestRunnerArgsCacheGenerator();
    private readonly structureDependencyGetter = new StructureDependencyGetter();
    private readonly testRunnerGenerator = new TestRunnerGenerator();
    private readonly stateTestRunnerGenerator = new StateTestRunnerGenerator();
    private readonly testRunnerFactoryGenerator = new TestRunnerFactoryGenerator();
    private readonly testFunctionGenerator = new TestFunctionGenerator();
    private readonly transformOptions: TransformOptions;
    private readonly wrapperFactory: WrapperFactory;

    constructor() {
        const opts: { testStructurePrefix?: string; testStructureSuffix?: string; } = {};
        this.transformOptions = new TransformOptions(opts);
        this.wrapperFactory = new WrapperFactory(this.transformOptions);
    }

    addCustomTestTransform(
        condition: (definition: typeInfo.ClassDefinition | typeInfo.InterfaceDefinition) => boolean,
        testWrite: (writer: CodeBlockWriter) => void
    ) {
        this.transformOptions.addCustomTestTransform({ condition, testWrite });
    }

    addDefaultValue(
        condition: (
            propertyDef: typeInfo.ClassPropertyDefinition | typeInfo.InterfacePropertyDefinition,
            parent?: typeInfo.ClassDefinition | typeInfo.InterfaceDefinition
        ) => boolean,
        value: string
    ) {
        this.transformOptions.addDefaultValueTransform({ condition, value });
    }

    addIgnorePropertyTransform(condition: (
            propertyDef: typeInfo.ClassPropertyDefinition | typeInfo.InterfacePropertyDefinition,
            parent?: typeInfo.ClassDefinition | typeInfo.InterfaceDefinition
        ) => boolean
    ) {
        this.transformOptions.addIgnorePropertyTransform({ condition });
    }

    addIgnoreTypeTransform(condition: (typeDef: typeInfo.TypeDefinition) => boolean) {
        this.transformOptions.addIgnoreTypeTransform({ condition });
    }

    addOptInPropertyTransform(
        condition: (
            propertyDef: typeInfo.ClassPropertyDefinition | typeInfo.InterfacePropertyDefinition,
            parent?: typeInfo.ClassDefinition | typeInfo.InterfaceDefinition
        ) => boolean
    ) {
        this.transformOptions.addOptInPropertyTransform({ condition });
    }

    // todo: separate transforms from tests
    // todo: have ability to add "it" message when writing test
    addPropertyTransform(
        condition: (
            propertyDef: typeInfo.ClassPropertyDefinition | typeInfo.InterfacePropertyDefinition,
            parent?: typeInfo.ClassDefinition | typeInfo.InterfaceDefinition
        ) => boolean,
        propertyTransform: (newProperty: typeInfo.InterfacePropertyDefinition) => void,
        testWrite: (writer: CodeBlockWriter) => void
    ) {
        this.transformOptions.addPropertyTransform({ condition, propertyTransform, testWrite });
    }

    addTestStructureTransform(
        condition: (definition: typeInfo.ClassDefinition | typeInfo.InterfaceDefinition) => boolean,
        transform: (testStructure: typeInfo.InterfaceDefinition) => void
    ) {
        this.transformOptions.addTestStructureTransform({ condition, transform });
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
        this.testRunnerInterfaceGenerator.fillFile(testFile);
        this.testRunnerArgsCacheGenerator.fillFile(testFile);
        const structureWrappers = this.structureDependencyGetter.getAllStructures(structures.map(s => this.wrapperFactory.getStructure(s)));
        this.testRunnerFactoryGenerator.fillTestFile(testFile, structureWrappers);
        this.stateTestRunnerGenerator.fillTestFile(testFile, structureWrappers);
        this.testRunnerGenerator.fillTestFile(testFile, structureWrappers);
        this.testFunctionGenerator.fillTestFile(testFile, structureWrappers);
        return testFile;
    }
}
