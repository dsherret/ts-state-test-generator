import * as typeInfo from "ts-type-info";
import {TestGenerator} from "../TestGenerator";
import {expect} from "chai";
import {fileTemplate, itMessage, itAssertion, describeAssertion, strictEqual} from "./templates";

describe(nameof(TestGenerator), () => {
    describe("type parameter tests", () => {
        const myTypeParameterClass = typeInfo.createClass({
            name: "MyTypeParameterClass",
            typeParameters: [{
                name: "T"
            }, {
                name: "U",
                constraintType: "MyClass<string>"
            }],
            properties: [
                { name: "prop", type: "T" },
                { name: "prop2", type: "U" }
            ]
        });
        const myClass = typeInfo.createClass({
            name: "MyClass",
            typeParameters: [{ name: "T" }],
            properties: [{ name: "prop", type: "T" }]
        });
        const constraintType = myTypeParameterClass.typeParameters[1].constraintType!;
        constraintType.definitions.push(myClass);
        const constraintTypeArgumentType = new typeInfo.TypeDefinition();
        constraintTypeArgumentType.text = "string";
        constraintType.typeArguments.push(constraintTypeArgumentType);

        const generator = new TestGenerator({});
        const structuresFile = generator.getTestFile([myTypeParameterClass]);

        it("should write out the file", () => {
            const expectedCode =
`export class StateTestRunner {
    private readonly assertions: WrapperAssertions;

    constructor(assertions: Assertions) {
        this.assertions = new WrapperAssertions(assertions || new DefaultAssertions());
    }

    runMyTypeParameterClassTest<T, U extends MyClass<string>>(actual: MyTypeParameterClass<T, U>, expected: MyTypeParameterClassTestStructure<T, U>) {
        ${describeAssertion}("MyTypeParameterClass", () => {
            ${itAssertion}(${itMessage("prop")}, () => {
                ${strictEqual("prop")}
            });
            ${itAssertion}(${itMessage("prop2")}, () => {
                ${strictEqual("prop2")}
            });
        });
    }

    runMyClassTest<T>(actual: MyClass<T>, expected: MyClassTestStructure<T>) {
        ${describeAssertion}("MyClass", () => {
            ${itAssertion}(${itMessage("prop")}, () => {
                ${strictEqual("prop")}
            });
        });
    }
}

export interface MyTypeParameterClassTestStructure<T, U extends MyClassTestStructure<string>> {
    prop: T;
    prop2: U;
}

export interface MyClassTestStructure<T> {
    prop: T;
}`;
            expect(structuresFile.write()).to.equal(fileTemplate(expectedCode));
        });
    });
});
