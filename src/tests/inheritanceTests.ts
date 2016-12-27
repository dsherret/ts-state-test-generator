import * as typeInfo from "ts-type-info";
import {TestGenerator} from "../TestGenerator";
import {expect} from "chai";
import {fileTemplate} from "./templates";

describe(nameof(TestGenerator), () => {
    describe("inheritance tests", () => {
        const myBaseClass = typeInfo.createClass({
            name: "MyBaseClass",
            properties: [{ name: "prop", type: "Date" }]
        });
        const myExtendsClass = typeInfo.createClass({
            name: "MyExtendsClass",
            properties: [{ name: "extendsProp", type: "string" }]
        });
        const myOtherExtendsClass = typeInfo.createClass({
            name: "MyOtherExtendsClass"
        });
        myExtendsClass.addExtends(myBaseClass);
        myExtendsClass.extendsTypes[0].definitions.push(myBaseClass);
        myOtherExtendsClass.addExtends(myBaseClass);
        myOtherExtendsClass.extendsTypes[0].definitions.push(myBaseClass);

        const generator = new TestGenerator({});
        const structuresFile = generator.getTestFile([myExtendsClass, myOtherExtendsClass]); // do not pass in the base class (for testing purposes)

        it("should write out the file", () => {
            const expectedCode =
`export class StateTestRunner {
    private readonly assertions: WrapperAssertions;

    constructor(assertions: Assertions) {
        this.assertions = new WrapperAssertions(assertions || new DefaultAssertions());
    }

    runMyExtendsClassTest(actual: MyExtendsClass, expected: MyExtendsClassTestStructure) {
        this.assertions.describe("MyExtendsClass", () => {
            this.runMyBaseClassTest(actual as any as MyBaseClass, expected);
            this.assertions.it("should have the correct 'extendsProp' property", () => {
                this.assertions.strictEqual(actual.extendsProp, expected.extendsProp);
            });
        });
    }

    runMyOtherExtendsClassTest(actual: MyOtherExtendsClass, expected: MyOtherExtendsClassTestStructure) {
        this.assertions.describe("MyOtherExtendsClass", () => {
            this.runMyBaseClassTest(actual as any as MyBaseClass, expected);
        });
    }

    runMyBaseClassTest(actual: MyBaseClass, expected: MyBaseClassTestStructure) {
        this.assertions.describe("MyBaseClass", () => {
            this.assertions.it("should have the correct 'prop' property", () => {
                this.assertions.strictEqual(actual.prop, expected.prop);
            });
        });
    }
}

export interface MyExtendsClassTestStructure extends MyBaseClassTestStructure {
    extendsProp: string;
}

export interface MyOtherExtendsClassTestStructure extends MyBaseClassTestStructure {
}

export interface MyBaseClassTestStructure {
    prop: Date;
}`;
            expect(structuresFile.write()).to.equal(fileTemplate(expectedCode));
        });
    });
});
