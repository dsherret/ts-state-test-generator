import {assertionsTemplate} from "./assertionsTemplate";
import {testRunnerInterfaceTemplate} from "./testRunnerInterfaceTemplate";
import {testRunnerArgsCacheTemplate} from "./testRunnerArgsCacheTemplate";

export const fileHeaderTemplate =
`import * as assert from "assert";

${assertionsTemplate}

${testRunnerInterfaceTemplate}

${testRunnerArgsCacheTemplate}`;
