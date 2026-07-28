# ADR 0032: Fix interactive-mode `--priority`/`--json` gap alongside date-range filters

## Context

Interactive mode (`src/interactive.ts`) has its own hand-rolled regex arg parser for `filter` (`parseFilterArgs`), separate from the commander-based one-shot CLI. By the time issue #32 (date-range filters) reached implement, `--priority` was already wired into interactive's `filter` handler (landed as part of issue #30/#31). The remaining pre-existing gap was `--json` support: not on `filter`, not on `list`, anywhere in interactive mode.

Clarify (issue #32) initially scoped this out as pre-existing and unrelated, then revised the decision: also fix the `--json` gap while adding the three new date-range flags, since the human wants full CLI/interactive parity.

## Decision

Wire `--json` into interactive's `filter` and `list` handlers (and their regex parsers), and add `--due-before`/`--due-after`/`--due-today` to interactive's `filter` parsing, alongside the one-shot CLI changes. Update interactive `help` text to reflect all of it.
