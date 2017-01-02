export function strictEqual(propName: string) {
    return `this.assertions.strictEqual(actual.${propName}, expected.${propName});`;
}

export const itAssertion = "this.assertions.it";
export const itMessage = `"should have the same value"`;
export const describeAssertion = "this.assertions.describe";
