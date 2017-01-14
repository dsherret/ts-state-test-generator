import {TypeTransform, DefaultValueTransform, PropertyTransform, OptInPropertyTransform, TestStructureTransform, CustomTestTransform} from "./transforms";

export class TransformOptions {
    private readonly testStructureSuffix: string;
    private readonly testStructurePrefix: string;
    private readonly customTestTransforms: CustomTestTransform[] = [];
    private readonly defaultValueTransforms: DefaultValueTransform[] = [];
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
