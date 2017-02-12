import * as typeInfo from "ts-type-info";
import {expect} from "chai";
import * as path from "path";
import * as fs from "fs";
import {TestGenerator} from "./../TestGenerator";

describe(nameof(TestGenerator), () => {
    const info = typeInfo.getInfoFromFiles([
        path.join(__dirname, "../../src/tests/testFiles/arrayFile.ts"),
        path.join(__dirname, "../../src/tests/testFiles/inheritanceFile.ts"),
        path.join(__dirname, "../../src/tests/testFiles/typeParameterFile.ts"),
        path.join(__dirname, "../../src/tests/testFiles/ignoreTypeTransformFile.ts"),
        path.join(__dirname, "../../src/tests/testFiles/ignorePropertyTransformFile.ts")
    ]);

    // todo: reduce code reuse here

    describe("array tests", () => {
        it("should write out the file", () => {
            const generator = new TestGenerator();
            const structuresFile = generator.getTestFile(info.getFile("arrayFile.ts")!.classes);
            structuresFile.onBeforeWrite = writer => writer.writeLine("/* tslint:disable */").newLine();
            structuresFile.addImport({
                moduleSpecifier: "./../testFiles/arrayFile",
                namedImports: [{ name: "MyClass" }]
            });
            // fs.writeFileSync(path.join(__dirname, "../../src/tests/expected/arrayFileTestMethods.ts"), structuresFile.write());
            const expectedFileText = fs.readFileSync(path.join(__dirname, "../../src/tests/expected/arrayFileTestMethods.ts"), "utf-8");
            expect(structuresFile.write()).to.equal(expectedFileText);
        });
    });

    describe("inheritance tests", () => {
        it("should write out the file", () => {
            const generator = new TestGenerator();
            const classes = info.getFile("inheritanceFile.ts")!.classes.filter(c => c.name !== "MyBaseClass"); // ignore the base class for testing purposes
            const structuresFile = generator.getTestFile(classes);
            structuresFile.onBeforeWrite = writer => writer.writeLine("/* tslint:disable */").newLine();
            structuresFile.addImport({
                moduleSpecifier: "./../testFiles/inheritanceFile",
                namedImports: [{ name: "MyBaseClass" }, { name: "MyExtendsClass" }, { name: "MyOtherExtendsClass" }]
            });
            // fs.writeFileSync(path.join(__dirname, "../../src/tests/expected/inheritanceTestMethods.ts"), structuresFile.write());
            const expectedFileText = fs.readFileSync(path.join(__dirname, "../../src/tests/expected/inheritanceTestMethods.ts"), "utf-8");
            expect(structuresFile.write()).to.equal(expectedFileText);
        });
    });

    describe("type parameter tests", () => {
        it("should write out the file", () => {
            const generator = new TestGenerator();
            const structuresFile = generator.getTestFile(info.getFile("typeParameterFile.ts")!.classes);
            structuresFile.onBeforeWrite = writer => writer.writeLine("/* tslint:disable */").newLine();
            structuresFile.addImport({
                moduleSpecifier: "./../testFiles/typeParameterFile",
                namedImports: [{ name: "MyClass" }, { name: "MyExtendsClass" }, { name: "MyTypeParameterClass" }]
            });
            // fs.writeFileSync(path.join(__dirname, "../../src/tests/expected/typeParameterTestMethods.ts"), structuresFile.write());
            const expectedFileText = fs.readFileSync(path.join(__dirname, "../../src/tests/expected/typeParameterTestMethods.ts"), "utf-8");
            expect(structuresFile.write()).to.equal(expectedFileText);
        });
    });

    describe("ignore type transform tests", () => {
        it("should write out the file", () => {
            const generator = new TestGenerator();
            generator.addIgnoreTypeTransform(t => t.text === "number");
            const structuresFile = generator.getTestFile(info.getFile("ignoreTypeTransformFile.ts")!.classes);
            structuresFile.onBeforeWrite = writer => writer.writeLine("/* tslint:disable */").newLine();
            structuresFile.addImport({
                moduleSpecifier: "./../testFiles/ignoreTypeTransformFile",
                namedImports: [{ name: "MyClass" }]
            });
            // fs.writeFileSync(path.join(__dirname, "../../src/tests/expected/ignoreTypeTransformTestMethods.ts"), structuresFile.write());
            const expectedFileText = fs.readFileSync(path.join(__dirname, "../../src/tests/expected/ignoreTypeTransformTestMethods.ts"), "utf-8");
            expect(structuresFile.write()).to.equal(expectedFileText);
        });
    });

    describe("ignore property transform tests", () => {
        it("should write out the file", () => {
            const generator = new TestGenerator();
            generator.addIgnorePropertyTransform(p => p.name === "prop1");
            generator.addIgnorePropertyTransform((p, c) => p.name === "prop2" && c!.name === "MyClass"); // todo: don't require saying this isn't null
            const structuresFile = generator.getTestFile(info.getFile("ignorePropertyTransformFile.ts")!.classes);
            structuresFile.onBeforeWrite = writer => writer.writeLine("/* tslint:disable */").newLine();
            structuresFile.addImport({
                moduleSpecifier: "./../testFiles/ignorePropertyTransformFile",
                namedImports: [{ name: "MyClass" }, { name: "MyOtherClass" }]
            });
            // fs.writeFileSync(path.join(__dirname, "../../src/tests/expected/ignorePropertyTransformTestMethods.ts"), structuresFile.write());
            const expectedFileText = fs.readFileSync(path.join(__dirname, "../../src/tests/expected/ignorePropertyTransformTestMethods.ts"), "utf-8");
            expect(structuresFile.write()).to.equal(expectedFileText);
        });
    });
});
