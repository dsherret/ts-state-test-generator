TsStateTestGenerator
====================

[![Build Status](https://travis-ci.org/dsherret/ts-state-test-generator.svg)](https://travis-ci.org/dsherret/ts-state-test-generator)
[![Coverage Status](https://coveralls.io/repos/dsherret/ts-state-test-generator/badge.svg?branch=master&service=github)](https://coveralls.io/github/dsherret/ts-state-test-generator?branch=master)
[![experimental](http://badges.github.io/stability-badges/dist/experimental.svg)](http://github.com/badges/stability-badges)

```
npm install --save-dev ts-type-info
npm install --save-dev ts-state-tests-generator
```

This tool code generates test helper functions that test the state of an object based on its type information. It's currently experimental and subject to change.

## Benefits

* Write and maintain less code. I replaced 2500 lines of code with 250 in one of my projects and discovered a few bugs in my previous test methods.
* When your class or interface properties change, simply re-run the code generation process for updated code.
* Get static typing in the expected object.
* Expected object can be different than actual object.
* Add default values for properties so they don't need to be provided in the expected object.
* Mark properties as being "opt-in" so those properties will only be tested when you provide an expected value.
* Provides the ability to manipulate the process along the way.

## Supports

* Union types.
* Intersection types.
* Array types.
* Type parameters.

## Example

### TypeScript classes/interfaces to test

```typescript
// src/models.ts
export * from "./models/Person";
export * from "./models/Note";

// src/models/Person.ts
import {Note} from "./Note";

export class Person {
    name: "MyName";
    notes: Note[];
}

// src/models/Note.ts
export class Note {
    creationDate: Date;
    text: string;
    isPinned: boolean;
}
```


### Code generate the test helpers

This will code generate a test helper file for the model classes.

```javascript
// generateTestHelpers.js
// i usually just do this in a javascript file so I don't need to compile it (it's just a build script)
var path = require("path");
var fs = require("fs");
var getInfoFromFiles = require("ts-type-info").getInfoFromFiles;
var TestGenerator = require("ts-state-test-generator").TestGenerator;

// get the info from the files using ts-type-info
const typeInfo = getInfoFromFiles([
    path.join(__dirname, "src/models.ts") // or provide each file individually in an array
], {
    compilerOptions: {
        strictNullChecks: true
    }
});

// potentially modify the values in typeInfo here
// ex: removing public properties whose name matches a certain pattern
// see the ts-type-info project for how to manipulate it

// get the classes you want from typeInfo
const classes = [];
typeInfo.files.filter(f => f.fileName.indexOf("/Models/") >= 0).forEach(f => {
    classes.push.apply(classes, f.classes); // or use spread
});

// create the test generator
const generator = new TestGenerator();
// add any transforms
generator.addDefaultValue((prop, classDef) => classDef.name === "Note" && prop.name === "isPinned", "false"); // adds a default test value
generator.addDefaultValue(prop => prop.type.isArrayType(), "[]");
generator.addOptInPropertyTransform((prop, classDef) => classDef.name === "Note" && prop.name === "creationDate"); // makes this property so its only tested for when provided
// - there is also: addPropertyTransform, addTestStructureTransform, addCustomTestTransform. I need to work on how exactly I want those to work so those are subject to change
// - if you have any ideas about some other transform let me know

// get the test file
const testFile = generator.getTestFile(classes);

// add necessary imports to the file based on where you are going to place it
const modelNamedImports = classes.map(c => c.name);
// modelNamedImports.push("SomeOtherType"); // you could add additional imports here
testFile.addImport({
    namedImports: modelNamedImports.map(name => ({ name })),
    moduleSpecifier: "./../models"
});

// add a statement to remind people not to edit this file
testFile.onBeforeWrite = writer => writer.writeLine("/* tslint:disable */").writeLine("// AUTO GENERATED CODE - DO NOT EDIT!").newLine();

// write out the file
fs.writeFile(path.join(__dirname, "src/tests/testHelpers.ts"), testFile.write());
```

### Using generated code

It's best to look at the generated code so you can get an idea about how to use it (there are more advanced ways to use it than shown here).

Here's an example:

```typescript
// src/tests/someTest.ts
import {runPersonTests} from "./testHelpers";

let person = functionThatReturnsAPersonWithNoNotes();

// tests for:
// * name to be "David"
// * notes to be [] (default value specified in code generation)
runPersonTests(person, { name: "David" });

person = functionThatReturnsAPersonWithOneNote();

// tests for:
// * name to be "David"
// * notes to have text "Hello there!"
// * isPinned to be false (default value specified in code generation)
// * does not test `creationDate` because that's an opt in property (would only test if provided in the expected object)
runPersonTests(person, {
    name: "David",
    notes: [{
        text: "Hello there!"
    }]
});
```

## Todo

* Object type support.
* Interface implements support (but only for interfaces)
* A union type with null or undefined as a possibility should make the structure optional then it should check for either null or undefined.
* Fix tests.
