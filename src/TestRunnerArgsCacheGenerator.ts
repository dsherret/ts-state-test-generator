import * as typeInfo from "ts-type-info";

export class TestRunnerArgsCacheGenerator {
    fillFile(file: typeInfo.FileDefinition) {
        file.addClass({
            name: "TestRunnerArgsCache",
            isExported: true,
            typeParameters: [{ name: "T", constraintType: "TestRunner<any, any>" }],
            constructorDef: {
                onWriteFunctionBody: writer => {
                    writer.writeLine("this.items = [];");
                }
            },
            properties: [{
                name: "items",
                scope: typeInfo.Scope.Private,
                isReadonly: true,
                type: "{ args: any[]; value: T; }[]"
            }],
            methods: [{
                name: "getIndex",
                parameters: [{ name: "args", type: "any[]" }],
                onWriteFunctionBody: writer => {
                    writer.write("for (let i = 0; i < this.items.length; i++)").block(() => {
                        writer.writeLine("const item = this.items[i];");
                        writer.write("if (args.length !== item.args.length)").block(() => {
                            writer.writeLine("continue;");
                        });
                        writer.newLine();
                        writer.writeLine("let isMatch = true;");
                        writer.write("for (let j = 0; j < args.length; j++)").block(() => {
                            writer.write("if (args[j] !== item.args[j])").block(() => {
                                writer.writeLine("isMatch = false;");
                                writer.writeLine("break;");
                            });
                        });
                        writer.write("if (isMatch)").block(() => {
                            writer.writeLine("return i;");
                        });
                    });
                    writer.newLine();
                    writer.writeLine("return -1;");
                }
            }, {
                name: "addItem",
                parameters: [{ name: "value", type: "T" }, { name: "args", type: "any[]" }],
                onWriteFunctionBody: writer => {
                    writer.writeLine("this.items.push({ value, args });");
                }
            }, {
                name: "getItemAtIndex",
                parameters: [{ name: "index", type: "number" }],
                onWriteFunctionBody: writer => {
                    writer.writeLine("return this.items[index].value;");
                }
            }]
        });
    }
}
