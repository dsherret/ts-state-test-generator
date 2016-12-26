import * as typeInfo from "ts-type-info";
import {TestGenerator} from "../TestGenerator";
import {expect} from "chai";
import {fileHeaderTemplate} from "./templates/fileHeaderTemplate";

describe(nameof(TestGenerator), () => {
    describe("type parameter tests", () => {
        const myTypeParameterClass = typeInfo.createClass({
            name: "MyTypeParameterClass",
            typeParameters: [{
                name: "T"
            }],
            properties: [{ name: "prop", type: "T" }]
        });

        const generator = new TestGenerator({});
        const structuresFile = generator.getTestFile([myTypeParameterClass]);

        it("should write out the file", () => {
            const expectedCode =
`${fileHeaderTemplate}

export class StateTestRunner {
    private readonly assertions: WrapperAssertions;

    constructor(assertions: Assertions) {
        this.assertions = new WrapperAssertions(assertions || new DefaultAssertions());
    }

    runMyTypeParameterClassTest<T>(actual: MyTypeParameterClass<T>, expected: MyTypeParameterClassTestStructure<T>) {
        this.assertions.describe("MyTypeParameterClass", () => {
            this.assertions.it("should have the correct 'prop' property", () => {
                this.assertions.strictEqual(actual.prop, expected.prop);
            });
        });
    }
}

export interface MyTypeParameterClassTestStructure<T> {
    prop: T;
}
`;
            expect(structuresFile.write()).to.equal(expectedCode);
        });
    });
});
