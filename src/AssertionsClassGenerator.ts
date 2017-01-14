import * as typeInfo from "ts-type-info";

export class AssertionsClassGenerator {
    fillFile(file: typeInfo.FileDefinition) {
        this.addImportsToFile(file);
        this.addInterfaceToFile(file);
        this.addDefaultClassToFile(file);
        this.addWrapperAssertionClassToFile(file);
    }

    private addImportsToFile(file: typeInfo.FileDefinition) {
        file.addImport({
            starImportName: "assert",
            moduleSpecifier: "assert"
        });
    }

    private addInterfaceToFile(file: typeInfo.FileDefinition) {
        const interfaceDef = file.addInterface({
            name: "Assertions",
            isExported: true
        });

        interfaceDef.addMethod({
            name: "describe",
            parameters: [{ name: "description", type: "string" }, { name: "spec", type: "() => void" }]
        });
        interfaceDef.addMethod({
            name: "it",
            parameters: [{ name: "expectation", type: "string" }, { name: "assertion", type: "() => void" }]
        });
        interfaceDef.addMethod({
            name: "strictEqual",
            parameters: [{ name: "actual" }, { name: "expected" }]
        });
    }

    private addWrapperAssertionClassToFile(file: typeInfo.FileDefinition) {
        const classDef = file.addClass({
            name: "WrapperAssertions",
            isExported: true,
            properties: [{
                name: "assertAnyCount",
                scope: typeInfo.Scope.Private,
                defaultExpression: "0"
            }],
            methods: [{
                name: "describe",
                parameters: [{ name: "description", type: "string" }, { name: "spec", type: "() => void" }],
                onWriteFunctionBody: writer => {
                    writer.writeLine("this.assertions.describe(description, spec);");
                }
            }, {
                name: "it",
                parameters: [{ name: "expectation", type: "string" }, { name: "assertion", type: "() => void" }],
                onWriteFunctionBody: writer => {
                    writer.write("if (this.assertAnyCount > 0)").block(() => {
                        writer.writeLine("assertion();");
                    });
                    writer.write("else").block(() => {
                        writer.writeLine("this.assertions.it(expectation, assertion);");
                    });
                }
            }, {
                name: "strictEqual",
                parameters: [{ name: "actual" }, { name: "expected" }],
                onWriteFunctionBody: writer => {
                    writer.writeLine("this.assertions.strictEqual(actual, expected);");
                }
            }, {
                name: "assertAny",
                parameters: [{ name: "checks", isRestParameter: true, type: "(() => void)[]" }],
                onWriteFunctionBody: writer => {
                    writer.writeLine("this.assertAnyCount++;");
                    writer.write("try ").inlineBlock(() => {
                        writer.writeLine("let didOverallPass = false");
                        writer.write("for (const check of checks)").block(() => {
                            writer.writeLine("let didPass = true;");
                            writer.write("try ").inlineBlock(() => {
                                writer.writeLine("check();");
                            }).write(" catch (err)").block(() => {
                                writer.writeLine("didPass = false;");
                            });
                            writer.write("if (didPass)").block(() => {
                                writer.writeLine("didOverallPass = true;");
                                writer.writeLine("break;");
                            });
                        });
                        writer.write("if (!didOverallPass)").block(() => {
                            writer.writeLine(`throw new Error("Did not equal any of the union types.");`);
                        });
                    }).write(" finally ").inlineBlock(() => {
                        writer.writeLine("this.assertAnyCount--;");
                    });
                }
            }, {
                name: "isNull",
                parameters: [{ name: "actual", type: "any" }, { name: "expected", type: "any" }],
                onWriteFunctionBody: writer => {
                    writer.write("if (actual != null || expected == null)").block(() => {
                        writer.writeLine("return false;");
                    });
                    writer.write(`this.it("should not be null", () => `).inlineBlock(() => {
                        writer.writeLine(`throw new Error("It's null");`);
                    }).write(");");
                    writer.writeLine("return true;");
                }
            }]
        });

        classDef.setConstructor({
            parameters: [{
                scope: typeInfo.ClassConstructorParameterScope.Private,
                isReadonly: true,
                name: "assertions",
                type: "Assertions"
            }]
        });
    }

    private addDefaultClassToFile(file: typeInfo.FileDefinition) {
        const classDef = file.addClass({
            name: "DefaultAssertions",
            isExported: false
        });
        classDef.addImplements("Assertions");
        classDef.addMethod({
            name: "describe",
            parameters: [{ name: "description", type: "string" }, { name: "spec", type: "() => void" }],
            onWriteFunctionBody: writer => {
                writer.writeLine("describe(description, spec);");
            }
        });
        classDef.addMethod({
            name: "it",
            parameters: [{ name: "expectation", type: "string" }, { name: "assertion", type: "() => void" }],
            onWriteFunctionBody: writer => {
                writer.writeLine("it(expectation, assertion);");
            }
        });
        classDef.addMethod({
            name: "strictEqual",
            parameters: [{ name: "actual" }, { name: "expected" }],
            onWriteFunctionBody: writer => {
                writer.writeLine(`assert.strictEqual(actual, expected);`);
            }
        });
    }
}
