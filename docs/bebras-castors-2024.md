# Bebras Castors 2024

Fifteen puzzles captured from the anonymous UK Bebras 2024 Castors practice group (27831). Captures, source URLs, explanations, and original diagram export manifest are in `/Users/crach./Desktop/NLG/bebras-castors-2024-capture`.

Five Castors-specific tasks precede ten tasks verified against Juniors 2024 (identical question and explanation text). Ricca cards is a different, multiple-choice version and is not reused from Juniors. Shared tasks retain their original interactions but have distinct Castors IDs, session data and outcomes.

New interactions:
- BBQ party: drag connecting lines or select a beaver and skewer; enforce one-to-one matching and allow reassignment.
- Spinning shamrocks: four independently rotatable images with keyboard-accessible 0–360° sliders, plus answer selection.
- Lost: selectable paths on the original forest map.

Original vector diagrams for the five new tasks are bundled locally. Question markup is sanitized at import with an explicit tag/attribute allowlist; no source scripts or external URLs are shipped in question markup. Answer keys and explanations remain server-side until completion.

Release after the code deploys:

```sh
node --env-file=/path/to/.env prisma/enable-bebras-kcsb.mjs --2024 --castors --class KCSB-5 --apply
```

This adds Castors 2024 to KCSB-5, retains Castors 2025, and preserves all student work. Completion time is recorded without a cutoff. Learners open `/play/bebras?set=castors-2024` or choose the year from their Bebras area.

Validation: pure scoring/supply/sequence-isolation tests; browser drag-to-connect, slider rotation, map selection and final scoring; full API integration covering all 15 answers, persistence, completion, explanations, retakes and teacher report isolation; production webpack build.
