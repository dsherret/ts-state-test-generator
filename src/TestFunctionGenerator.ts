import * as typeInfo from "ts-type-info";
import {StructureWrapper} from "./wrappers";

export class TestFunctionGenerator {
    fillTestFile(testFile: typeInfo.FileDefinition, structures: StructureWrapper[]) {
        for (const structure of structures) {
            // todo: support structures with type parameters
            if (structure.getTypeParameters().length > 0)
                break;

            testFile.addFunction({
                name: `run${structure.getName()}Tests`,
                isExported: true,
                parameters: [{
                    name: "actual",
                    type: structure.getNameWithTypeParameters()
                }, {
                    name: "expected",
                    type: structure.getTestStructureNameWithTypeParameters()
                }],
                onWriteFunctionBody: writer => {
                    writer.writeLine(`new TestRunnerFactory().get${structure.getName()}TestRunner().runTest(actual, expected);`);
                }
            });
        }
    }
}
