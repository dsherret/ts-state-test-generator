import {assertionsTemplate} from "./assertionsTemplate";
import {testRunnerInterfaceTemplate} from "./testRunnerInterfaceTemplate";

export const fileHeaderTemplate =
`import * as assert from "assert";

${assertionsTemplate}

${testRunnerInterfaceTemplate}`;
