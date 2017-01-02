import {TypeTransform, DefaultValueTransform} from "./transforms";

export class TransformOptions {
    private readonly testStructureSuffix: string;
    private readonly testStructurePrefix: string;
    private readonly typeTransforms: TypeTransform[] = [];
    private readonly defaultValueTransforms: DefaultValueTransform[] = [];

    constructor(opts: { testStructurePrefix?: string; testStructureSuffix?: string; }) {
        this.testStructurePrefix = opts.testStructurePrefix || "";
        this.testStructureSuffix = opts.testStructureSuffix || "TestStructure";
    }

    addDefaultValue(defaultValueTransform: DefaultValueTransform) {
        this.defaultValueTransforms.push(defaultValueTransform);
    }

    addTypeTransform(typeTransform: TypeTransform) {
        this.typeTransforms.push(typeTransform);
    }

    getDefaultValueTransforms() {
        return this.defaultValueTransforms;
    }

    getTypeTransforms() {
        return this.typeTransforms;
    }

    getNameToTestStructureName(name: string) {
        return `${this.testStructurePrefix}${name}${this.testStructureSuffix}`;
    }
}
