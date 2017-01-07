export function testRunnerFactoryStartTemplate(types: string[], initializeArgs: string[]) {
    types = types.map(t => t + "TestRunner");
    let text = `private readonly assertions: WrapperAssertions;\n`;

    for (let type of types) {
        text += `    private ${type}: ${type};\n`;
    }

    text += `\n`;
    text += `    constructor(assertions?: Assertions) {\n`;
    text += `        this.assertions = new WrapperAssertions(assertions || new DefaultAssertions());\n`;

    for (let type of types) {
        text += `        this.${type} = new ${type}();\n`;
    }

    for (let i = 0; i < types.length; i++) {
        text += `        this.${types[i]}.initialize(this.assertions${initializeArgs[i]});\n`;
    }

    text += `    }

    getStrictEqualTestRunner() {
        return new StrictEqualTestRunner(this.assertions);
    }`;

    for (let type of types) {
        text += "\n\n";
        text += `    get${type}() {\n`;
        text += `        return this.${type};\n`;
        text += `    }`;
    }

    return text;
}
