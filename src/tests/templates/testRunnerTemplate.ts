export function testRunnerStartTemplate(names: string[], types: string[]) {
    names = names.map(n => n + "TestRunner");
    let text = "private assertions: WrapperAssertions;\n";
    for (let i = 0; i < names.length; i++) {
        text += `    private ${names[i]}: ${types[i]};\n`;
    }

    text += "\n";

    text += "    initialize(assertions: WrapperAssertions";
    for (let i = 0; i < names.length; i++) {
        text += `, ${names[i]}: ${types[i]}`;
    }
    text += ") {\n";
    text += "        this.assertions = assertions;\n";
    for (let name of names) {
        text += `        this.${name} = ${name};\n`;
    }

    text += "    }";

    return text;
}
