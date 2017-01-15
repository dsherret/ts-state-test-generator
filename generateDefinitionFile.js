var path = require("path");
var fs = require("fs");
var getInfoFromFiles = require("ts-type-info").getInfoFromFiles;

// using ts-type-info still seems like the best way to generate definition files... haven't found anything else
// that gives me this kind of control...

const result = getInfoFromFiles([
    path.join(__dirname, "src/main.ts")
], {
    showDebugMessages: false,
    compilerOptions: {
        strictNullChecks: true
    }
});
const fileInfo = result.getFile("main.ts");

const definitionFileText = fileInfo.writeExportsAsDefinitionFile({
    imports: [{
        starImportName: "typeInfo",
        moduleSpecifier: "ts-type-info"
    }, {
        defaultImportName: "CodeBlockWriter",
        moduleSpecifier: "code-block-writer"
    }]
});

fs.writeFile(path.join(__dirname, "ts-state-test-generator.d.ts"), definitionFileText);
