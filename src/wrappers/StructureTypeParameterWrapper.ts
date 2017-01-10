import * as typeInfo from "ts-type-info";
import {StructureWrapper} from "./StructureWrapper";
import {WrapperFactory} from "./WrapperFactory";

export class StructureTypeParameterWrapper {
    constructor(
        private readonly wrapperFactory: WrapperFactory,
        private readonly structure: StructureWrapper,
        private readonly typeParam: typeInfo.TypeParameterDefinition
    ) {
    }

    getName() {
        return this.typeParam.name;
    }

    getTestStructureName() {
        return this.getName() + "Expected";
    }

    getConstraintType() {
        return (this.typeParam.constraintType == null) ? null : this.wrapperFactory.getStructureType(this.structure, this.typeParam.constraintType!);
    }
}
