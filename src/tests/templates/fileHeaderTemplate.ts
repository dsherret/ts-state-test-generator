import {assertionsTemplate} from "./assertionsTemplate";
import {testInterfaceTemplate} from "./testInterfaceTemplate";

export const fileHeaderTemplate =
`import * as assert from "assert";

${assertionsTemplate}

${testInterfaceTemplate}`;
