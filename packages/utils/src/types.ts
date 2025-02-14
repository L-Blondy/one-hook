export type KeyOf<O> = O extends unknown ? keyof O : never;

export type EntriesOf<O> = O extends unknown
  ? {
      [Key in KeyOf<O>]: [Key, O[Key]];
    }[KeyOf<O>][]
  : never;

export type EntryOf<O> = EntriesOf<O>[number];
