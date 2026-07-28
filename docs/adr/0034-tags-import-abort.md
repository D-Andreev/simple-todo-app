# ADR 0034: Malformed `tags` on import aborts, unlike other malformed fields

## Context

`handleImport` currently treats an entry with a malformed `dueDate` or `priority` as an "invalid entry" — skipped, counted separately, never aborting the whole import (see `workflow/PROJECT.md` `## Language` → *Invalid entry (import)*).

## Decision

For `tags`, the human explicitly chose the opposite: an entry whose `tags` field is present but malformed (not an array of non-empty strings) throws and aborts the entire `handleImport` call, rather than being skipped as an invalid entry.

## Consequence

`tags` validation in `handleImport` is not run through `isValidImportEntry`'s skip path. It has its own explicit check that throws before any todos are written, so a bad `tags` shape fails loudly instead of silently dropping the entry.
