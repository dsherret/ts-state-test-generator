import {TypeTransform} from "./TypeTransform";

export class TransformOptions {
    private readonly testStructureSuffix: string;
    private readonly testStructurePrefix: string;
    private readonly typeTransforms: TypeTransform[] = [];

    constructor(opts: { testStructurePrefix?: string; testStructureSuffix?: string; }) {
        this.testStructurePrefix = opts.testStructurePrefix || "";
        this.testStructureSuffix = opts.testStructureSuffix || "TestStructure";
    }

    addTypeTransform(typeTransform: TypeTransform) {
        this.typeTransforms.push(typeTransform);
    }

    getTypeTransforms() {
        return this.typeTransforms;
    }

    getNameToTestStructureName(name: string) {
        return `${this.testStructurePrefix}${name}${this.testStructureSuffix}`;
    }
}
