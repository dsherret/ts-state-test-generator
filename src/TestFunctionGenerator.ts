import * as typeInfo from "ts-type-info";
import {StructureWrapper} from "./wrappers";

export class TestFunctionGenerator {
    fillTestFile(testFile: typeInfo.FileDefinition, structures: StructureWrapper[]) {
        for (const structure of structures) {
            testFile.addFunction({
                name: `run${structure.getName()}Tests`,
                parameters: [{
                    name: "actual",
                    type: structure.getNameWithTypeParameters()
                }, {
                    name: "expected",
                    type: structure.getTestStructureNameWithTypeParameters()
                }],
                onWriteFunctionBody: writer => {
                    writer.writeLine("const factory = new TestRunnerFactory();");
                    writer.writeLine(`factory.get${structure.getName()}TestRunner().runTest(actual, expected);`);
                }
            });
        }

        return testFile;
    }
}
