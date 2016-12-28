import * as typeInfo from "ts-type-info";

export class TestRunnerInterfaceGenerator {
    fillFile(file: typeInfo.FileDefinition) {
        file.addInterface({
            name: "TestRunner",
            isExported: true,
            typeParameters: [{ name: "TActual" }, { name: "TExpected" }],
            methods: [{
                name: "runTest",
                returnType: "void",
                parameters: [{ name: "actual", type: "TActual" }, { name: "expected", type: "TExpected" }]
            }]
        });
    }
}
