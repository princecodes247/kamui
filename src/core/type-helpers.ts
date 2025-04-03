/**
 * Creates an object type from two tuples where the first tuple provides the keys
 * and the second tuple provides the corresponding values.
 * 
 * @example
 * type Keys = ['name', 'age'] as const;
 * type Values = [string, number] as const;
 * type Person = TupleToObject<Keys, Values>; // { name: string; age: number; }
 */
export type TupleToObject<K extends readonly PropertyKey[], V extends readonly any[]> = K extends []
  ? {}
  : K extends [infer First extends PropertyKey, ...infer Rest extends PropertyKey[]]
    ? V extends [infer FirstValue, ...infer RestValues]
      ? { [P in First]: FirstValue } & TupleToObject<Rest, RestValues>
      : never
    : never;

/**
 * Extracts parameter types from a function type.
 * 
 * @example
 * type Fn = (name: string, age: number) => void;
 * type Params = ExtractParameters<Fn>; // [string, number]
 */
export type ExtractParameters<T> = T extends (...args: infer P) => any ? P : never;

/**
 * Merges parameter types from multiple function declarations into a single object type.
 * 
 * @example
 * type Fn1 = (name: string) => void;
 * type Fn2 = (age: number) => void;
 * type Merged = MergeFunctionParameters<[Fn1, Fn2]>; // { name: string; age: number; }
 */
export type MergeFunctionParameters<T extends any[]> = T extends [infer First, ...infer Rest]
  ? First extends (...args: any[]) => any
    ? Parameters<First>[0] & (Rest extends [] ? {} : MergeFunctionParameters<Rest>)
    : never
  : {};

export type ArrayToSet<T> = T extends Array<infer U> ? Set<U> : never;

export type ExtractFromSet<T> = T extends Set<infer U> ? U : never;
