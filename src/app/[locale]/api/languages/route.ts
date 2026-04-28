import { db } from '@/lib/db';
import { gthLanguage } from '@/lib/db/schema';

const PROGRAMMING_LANGUAGES = [
  'Assembly',
  'awk',
  'bash',
  'BlitzMax',
  'Boo',
  'C',
  'C#',
  'C++',
  'C++/CLI',
  'Caml',
  'Ceylon',
  'ChucK',
  'Clojure',
  'CoffeeScript',
  'Crystal',
  'D',
  'Dart',
  'Delphi',
  'Eiffel',
  'Elm',
  'Emacs Lisp',
  'Erlang',
  'Euphoria',
  'F#',
  'Fantom',
  'Factor',
  'Forth',
  'Fortran',
  'GameMaker Language',
  'Gambas',
  'GAP',
  'Go',
  'Groovy',
  'Haskell',
  'Haxe',
  'Idris',
  'Io',
  'J',
  'JavaScript',
  'Julia',
  'Kotlin',
  'Lisp',
  'Logo',
  'Lua',
  'M4',
  'Make',
  'MATLAB',
  'Max',
  'Mercury',
  'MetaPost',
  'ML',
  'Modula-2',
  'Nemerle',
  'NewLISP',
  'Nim',
  'OCaml',
  'Oberon',
  'Oxygene',
  'Pascal',
  'Pike',
  'PostScript',
  'Prolog',
  'Pure',
  'Python',
  'QML',
  'R',
  'Racket',
  'Rebol',
  'REXX',
  'Rouge',
  'Ruby',
  'Rust',
  'SAS',
  'Scala',
  'Scheme',
  'Scratch',
  'Self',
  'Shell',
  'Slate',
  'Smalltalk',
  'SML',
  'Solidity',
  'SQL',
  'Swift',
  'Tcl',
  'TeX',
  'TSQL',
  'TypeScript',
  'Vala',
  'Verilog',
  'VHDL',
  'VimL',
  'Wolfram',
  'X10',
  'XSLT',
  'Yacc',
].filter(lang => lang.trim());

// Group by first letter
const GROUPED_LANGUAGES: Record<string, string[]> = PROGRAMMING_LANGUAGES.reduce(
  (acc, lang) => {
    const firstLetter = lang.charAt(0).toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(lang);
    return acc;
  },
  {} as Record<string, string[]>
);

export async function GET() {
  const dbLanguages = await db.select({ name: gthLanguage.name }).from(gthLanguage);

  // If database doesn't have all languages, add the missing ones
  const dbNames = new Set(dbLanguages.map(l => l.name));
  const missingLanguages = PROGRAMMING_LANGUAGES.filter(l => !dbNames.has(l));

  if (missingLanguages.length > 0) {
    await db
      .insert(gthLanguage)
      .values(missingLanguages.map(name => ({ name })))
      .onConflictDoNothing();
  }

  return Response.json({
    grouped: GROUPED_LANGUAGES,
    total: PROGRAMMING_LANGUAGES.length,
  });
}
