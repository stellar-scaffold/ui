# Contributing

This is a guide to contributing to `frontend-react` itself. Feel free
to delete or modify it for your own project.

## Prestart script

`scripts/prestart.mjs` runs on `npm start` for first-time users. It checks for
required CLIs, offers to install them, and runs `stellar scaffold setup`. Once
setup completes it removes itself from `package.json`.

### Testing

The test harness is contributor-only and is removed from user repos when setup
completes (along with the stubs directory).

**Run the tests:**

```bash
bash scripts/test-prestart.sh
```

No dependencies beyond Node.js and bash.

**How it works:**

- `scripts/test-stubs/` contains fake binaries placed at the front of `PATH`
- `stellar` stub reads `STUB_STELLAR_MISSING` / `STUB_SCAFFOLD_MISSING` env vars to simulate missing tools
- `cargo` stub always exits 0 (simulates a successful install)
- `cargo-binstall` stub always exits 1 (forces the `cargo install` path for determinism)
- `PRESTART_FORCE_TTY=1` overrides the TTY check so interactive paths can be tested without a real terminal

**Adding a test case:**

Call `run_test` in `test-prestart.sh` with:

```
run_test "<name>" <expected_exit> "<expected_output_substring>" "<stdin_input>" [ENV=val ...]
```

### What gets cleaned up on setup

When a user completes setup, `markSetupComplete()` in `prestart.mjs`:

1. Removes the `prestart` key from `package.json`
2. Deletes `scripts/test-stubs/`
3. Deletes `scripts/test-prestart.sh`

Contributors always have these files because they run from a branch where setup
has never been run.
