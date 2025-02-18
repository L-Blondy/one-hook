export type KeyOf<O> = O extends unknown ? keyof O : never;

export type KeysOf<O> = O extends unknown
  ? {
      [Key in KeyOf<O>]: Key;
    }[KeyOf<O>][]
  : never;

export type EntryOf<O> = EntriesOf<O>[number];

export type EntriesOf<O> = O extends unknown
  ? {
      [Key in KeyOf<O>]: [Key, O[Key]];
    }[KeyOf<O>][]
  : never;

export type ValueOf<O> = O extends unknown ? O[KeyOf<O>] : never;

export type ValuesOf<O> = O extends unknown
  ? {
      [Key in KeyOf<O>]: O[Key];
    }[KeyOf<O>][]
  : never;
