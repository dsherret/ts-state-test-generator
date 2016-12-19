import * as typeInfo from "ts-type-info";

type ClassOrInterfaceType = typeInfo.InterfaceDefinition | typeInfo.ClassDefinition;
type ClassOrInterfacePropertyType = typeInfo.InterfacePropertyDefinition | typeInfo.ClassPropertyDefinition;

export class TestGenerator {
    private readonly testStructureSuffix: string;
    private readonly testStructurePrefix: string;

    constructor(opts: { testStructurePrefix?: string; testStructureSuffix?: string; }) {
        this.testStructurePrefix = opts.testStructurePrefix || "";
        this.testStructureSuffix = opts.testStructureSuffix || "TestStructure";
    }

    getTestStructures(structures: ClassOrInterfaceType[]) {
        const testFile = typeInfo.createFile();
        structures = [...structures];

        for (let i = 0; i < structures.length; i++) {
            const structure = structures[i];
            const testStructure = testFile.addInterface({ name: this.getChangedName(structure.name) });
            const structureProperties = structure.properties as ClassOrInterfacePropertyType[];

            structureProperties.forEach(prop => {
                const validTypeDefinitions = prop.type.getAllDefinitions().filter(propTypeDefinition =>
                    propTypeDefinition instanceof typeInfo.ClassDefinition ||
                    propTypeDefinition instanceof typeInfo.InterfaceDefinition) as ClassOrInterfaceType[];

                validTypeDefinitions.forEach(validTypeDef => {
                    if (structures.indexOf(validTypeDef) === -1)
                        structures.push(validTypeDef);
                });

                testStructure.addProperty({
                    name: prop.name,
                    isOptional: prop.isOptional,
                    type: this.getTypeText(prop.type, validTypeDefinitions)
                });
            });
        }

        return testFile;
    }

    private getTypeText(typeDef: typeInfo.TypeDefinition, validTypeDefinitions: ClassOrInterfaceType[]) {
        if (validTypeDefinitions.length === 0)
            return typeDef.text;

        return this.getChangedName(typeDef.text);
    }

    private getChangedName(name: string) {
        return `${this.testStructurePrefix}${name}${this.testStructureSuffix}`;
    }
}
