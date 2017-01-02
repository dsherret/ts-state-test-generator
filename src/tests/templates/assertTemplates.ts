export function strictEqual(propName: string) {
    return `this.assertions.strictEqual(actual.${propName}, expected.${propName});`;
}

export const itAssertion = "this.assertions.it";
export const itMessage = `"should have the same value"`;
export const describeAssertion = "this.assertions.describe";

export function nullAssertion(indentLevel: number) {
    const text =
`if (actual == null && expected != null) {
    ${itAssertion}("should not be null", () => {
        throw new Error("It's null");
    });
    return;
}`;
    const lines = text.split(/\n/);

    for (let i = 1; i < lines.length; i++) {
        let indents = "";

        for (let j = 0; j < indentLevel; j++)
            indents += "    ";

        lines[i] = indents + lines[i];
    }

    return lines.join("\n");
}
