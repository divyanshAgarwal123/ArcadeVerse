# Arcade token dispenser browser evidence

Source: `abe16dc43f96060a0f45969d7374d79de012e502`, based on upstream `ef4a3a7d428d91042835fa2d92b4ec53874b92ba`. Issue #1077 was assigned before implementation.

Current browser checks cover two-tab Web Lock serialization (one daily grant), a native claim click and disabled repeat-claim button, reload, purchase/equip, insufficient balance, failed writes, a real game launch and close at zero balance, Hall of Fame wallet, reduced-motion no-charge, unsupported locking, corrupt-state preservation, keyboard Escape/focus and 320–1280px containment. Served JS/CSS bytes match the committed files; no page errors. Screenshots show the native token drawer.

Full npm suite including eight token-ledger cases passed. Branch-aware strict asset validation passed for 123 games with zero errors and 128 inherited warnings; registry dry-run passed. Generated registry was restored and excluded from the source diff. Final GitHub CI/review state is recorded in the PR, not inferred from these local results.

Evidence is on this separate fork-only branch and is not part of the source PR.
