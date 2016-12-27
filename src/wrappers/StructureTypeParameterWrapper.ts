import * as typeInfo from "ts-type-info";

export class StructureTypeParameterWrapper {
    constructor(private readonly typeParam: typeInfo.TypeParameterDefinition) {
    }

    getName() {
        return this.typeParam.name;
    }

    getConstraintType() {
        return this.typeParam.constraintType;
    }
}
