import {fileHeaderTemplate} from "./fileHeaderTemplate";

export function fileTemplate(bodyText: string) {
    const fileText =
`${fileHeaderTemplate}

${bodyText}
`;

    return fileText;
}
