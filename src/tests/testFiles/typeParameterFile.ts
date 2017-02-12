export class MyClass<T> {
    prop: T;
}

export class MyTypeParameterClass<T, U extends MyClass<string>> {
    prop: T;
    prop2: U;
}

export class MyExtendsClass extends MyClass<string> {
}
