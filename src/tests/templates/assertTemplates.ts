export function itMessage(propName: string) {
    return `"should have the correct '${propName}' property"`;
}

export function strictEqual(propName: string) {
    return `this.assertions.strictEqual(actual.${propName}, expected.${propName});`;
}

export const itAssertion = "this.assertions.it";
export const describeAssertion = "this.assertions.describe";
