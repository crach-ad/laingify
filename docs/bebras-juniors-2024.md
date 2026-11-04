# Bebras Juniors 2024

18 challenges captured from the UK Bebras anonymous practice/review session on 4 November 2026. Original question and explanation captures are in `/Users/crach./Desktop/NLG/bebras-juniors-2024-capture/`; each numbered JSON records the source URL, rendered text and screenshot coordinates. Source artwork is cropped into `public/games/bebras/juniors-2024`; explanations are private under `content/bebras/explanations`.

The sequence has nine placement tasks (Tube, Lighthouses, Oliver's rattle, Robot path, Ricca cards, Online class, Tree tour, Returning books, Sunny days), a sailboat-dot selector, two multiple-selection tasks, a numerical answer and five choice tasks. Placement supports HTML drag/drop, tap-to-place, keyboard selection, moving pieces and clearing. Robot path exposes all ten empty cells, with one Up and two Right pieces. The sailboat accepts either odd-degree start. Multi-selection is order-independent; arrangements preserve order.

Scores, visits, revisions, active time and elapsed time use the existing Bebras session system with set ID `juniors-2024`. There is no cutoff. Multiple assigned years have a sequence chooser and separate teacher reports/CSV exports. Explanations unlock only after finishing.

## Release

Deploy this code before assigning the new sequence. The additive assignment command previews by default:

```sh
node --env-file=/path/to/.env prisma/enable-bebras-kcsb.mjs --2024
node --env-file=/path/to/.env prisma/enable-bebras-kcsb.mjs --2024 --apply
```

Targets only KCSB-6 and KCSB-8, retaining their 2025 sequence and all existing work. The assignment preview must list exactly those two classes before applying.

## Checks

- `node --experimental-strip-types --test tests/bebras.test.mjs`
- `npx tsc --noEmit`
- `BEBRAS_TEST_BASE_URL=http://localhost:3112 BEBRAS_TEST_SET=juniors-2024 node --env-file=/path/to/.env --experimental-strip-types tests/bebras-api.mjs`

The API test creates and removes its own fixtures and checks all 18 saved answers, resume, concurrent completion, grading, protected explanations, teacher export and cross-sequence isolation. Browser preview checked repeated placement, robot cells, alternate sailboat start and final scoring; temporary development preview route was removed afterward.

The release preserves the standalone `/play/bebras` route and the cleaned 2025 diagrams. `/play/bebras?set=juniors-2024` opens the assigned 2024 sequence; legacy Mouse Meadow bookmarks forward the selected set.
