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

        file.addClass({
            name: "StrictEqualTestRunner",
            implementsTypes: ["TestRunner<any, any>"],
            isExported: true,
            constructorDef: {
                parameters: [{
                    name: "assertions",
                    type: "WrapperAssertions",
                    isReadonly: true,
                    scope: typeInfo.ClassConstructorParameterScope.Private
                }]
            },
            methods: [{
                name: "runTest",
                returnType: "void",
                parameters: [{ name: "actual", type: "any" }, { name: "expected", type: "any" }],
                onWriteFunctionBody: writer => {
                    writer.write(`this.assertions.it("should have the same value", () => `).inlineBlock(() => {
                        writer.writeLine("this.assertions.strictEqual(actual, expected);");
                    }).write(");");
                }
            }]
        });
    }
}
