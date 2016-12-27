import * as typeInfo from "ts-type-info";
import {WrapperFactory} from "./WrapperFactory";

export class StructureTypeParameterWrapper {
    constructor(
        private readonly wrapperFactory: WrapperFactory,
        private readonly typeParam: typeInfo.TypeParameterDefinition
    ) {
    }

    getName() {
        return this.typeParam.name;
    }

    getConstraintType() {
        return (this.typeParam.constraintType == null) ? null : this.wrapperFactory.getStructureType(this.typeParam.constraintType!);
    }
}
