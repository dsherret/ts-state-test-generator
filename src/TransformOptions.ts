import {TypeTransform, DefaultValueTransform, PropertyTransform, OptInPropertyTransform, TestStructureTransform, CustomTestTransform,
    IgnorePropertyTransform, IgnoreTypeTransform} from "./transforms";

export class TransformOptions {
    private readonly testStructureSuffix: string;
    private readonly testStructurePrefix: string;
    private readonly customTestTransforms: CustomTestTransform[] = [];
    private readonly defaultValueTransforms: DefaultValueTransform[] = [];
    private readonly ignorePropertyTransforms: IgnorePropertyTransform[] = [];
    private readonly ignoreTypeTransforms: IgnoreTypeTransform[] = [];
    private readonly optInPropertyTransforms: OptInPropertyTransform[] = [];
    private readonly propertyTransforms: PropertyTransform[] = [];
    private readonly testStructureTransforms: TestStructureTransform[] = [];
    private readonly typeTransforms: TypeTransform[] = [];

    constructor(opts: { testStructurePrefix?: string; testStructureSuffix?: string; }) {
        this.testStructurePrefix = opts.testStructurePrefix || "";
        this.testStructureSuffix = opts.testStructureSuffix || "TestStructure";
    }

    addCustomTestTransform(customTestTransform: CustomTestTransform) {
        this.customTestTransforms.push(customTestTransform);
    }

    addDefaultValueTransform(defaultValueTransform: DefaultValueTransform) {
        this.defaultValueTransforms.push(defaultValueTransform);
    }

    addIgnorePropertyTransform(ignorePropertyTransform: IgnorePropertyTransform) {
        this.ignorePropertyTransforms.push(ignorePropertyTransform);
    }

    addIgnoreTypeTransform(ignoreTypeTransform: IgnoreTypeTransform) {
        this.ignoreTypeTransforms.push(ignoreTypeTransform);
    }

    addOptInPropertyTransform(optInPropertyTransform: OptInPropertyTransform) {
        this.optInPropertyTransforms.push(optInPropertyTransform);
    }

    addPropertyTransform(propertyTransform: PropertyTransform) {
        this.propertyTransforms.push(propertyTransform);
    }

    addTypeTransform(typeTransform: TypeTransform) {
        this.typeTransforms.push(typeTransform);
    }

    addTestStructureTransform(testStructureTransform: TestStructureTransform) {
        this.testStructureTransforms.push(testStructureTransform);
    }

    getCustomTestTransforms() {
        return this.customTestTransforms;
    }

    getDefaultValueTransforms() {
        return this.defaultValueTransforms;
    }

    getIgnorePropertyTransforms() {
        return this.ignorePropertyTransforms;
    }

    getIgnoreTypeTransforms() {
        return this.ignoreTypeTransforms;
    }

    getOptInPropertyTransforms() {
        return this.optInPropertyTransforms;
    }

    getPropertyTransforms() {
        return this.propertyTransforms;
    }

    getTestStructureTransforms() {
        return this.testStructureTransforms;
    }

    getTypeTransforms() {
        return this.typeTransforms;
    }

    getNameToTestStructureName(name: string) {
        return `${this.testStructurePrefix}${name}${this.testStructureSuffix}`;
    }
}
