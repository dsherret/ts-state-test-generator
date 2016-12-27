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
`export interface MyTypeParameterClassTestStructure<T, U extends MyClassTestStructure<string>> {
    prop: T;
    prop2: U;
}

export class MyTypeParameterClassTestRunner<T, U extends MyClass<string>, TExpected, UExpected extends MyClassTestStructure<string>> \
implements Test<MyTypeParameterClass<T, U>, MyTypeParameterClassTestStructure<TExpected, UExpected>> {
    constructor(private readonly assertions: WrapperAssertions, private readonly TTestRunner: Test<T, TExpected>, \
private readonly UTestRunner: Test<U, UExpected>) {
    }

    runTest(actual: MyTypeParameterClass<T, U>, expected: MyTypeParameterClassTestStructure<TExpected, UExpected>) {
        ${describeAssertion}("MyTypeParameterClass", () => {
            ${itAssertion}(${itMessage("prop")}, () => {
                ${strictEqual("prop")}
            });
            ${itAssertion}(${itMessage("prop2")}, () => {
                ${strictEqual("prop2")}
            });
        });
    }
}

export interface MyClassTestStructure<T> {
    prop: T;
}

export class MyClassTestRunner<T, TExpected> implements Test<MyClass<T>, MyClassTestStructure<TExpected>> {
    constructor(private readonly assertions: WrapperAssertions, private readonly TTestRunner: Test<T, TExpected>) {
    }

    runTest(actual: MyClass<T>, expected: MyClassTestStructure<TExpected>) {
        ${describeAssertion}("MyClass", () => {
            ${itAssertion}(${itMessage("prop")}, () => {
                ${strictEqual("prop")}
            });
        });
    }
}`;
            expect(structuresFile.write()).to.equal(fileTemplate(expectedCode));
        });
    });
});
