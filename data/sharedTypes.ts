export type ObjectWithId = {id: string}
export type ObjectMap<T extends ObjectWithId> = {[key in string]: T};
