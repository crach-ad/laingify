# IgniteHer showcase rollout

Two cards in Empowerment Series, in this order:
1. **Elevator Pitch Analysis**: video upload and playback, then five written reflection prompts.
2. **Inspire Her Showcase**: outline; sketch; voice check-in; design flow; voice reflection; architecture; voice reflection; published project link and description.

The script `prisma/enable-inspire-her-showcase.mjs` previews by default. `--apply` upserts only these two modules and appends their assignments to existing IgniteHer classes. It does not run the full seed or remove assignments, rosters, or student work. The main IgniteHer seed includes the modules for future content updates.

## Video setup (required before assigning the pitch card)

Configure server-only `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the application's deployment environment. Do not put the service key in any NEXT_PUBLIC variable or commit it.

Create a **private** Supabase Storage bucket named `student-pitch-videos`, with a 52,428,800-byte file limit and allowed MIME types `video/mp4`, `video/webm`, `video/quicktime`. Do not add public read/write policies. Signed upload URLs send bytes directly to storage, avoiding application request-body limits. Signed playback URLs expire after ten minutes and are issued only after checking the owner’s current class access or a teacher's organization access.

No database migration is needed: Evidence.type is a string; these endpoints create VIDEO evidence and the criteria use VIDEO. The existing generic evidence endpoint does not accept VIDEO, so it cannot bypass upload finalization. Finalization checks the uploaded object's size and MIME type and is idempotent by upload ID. Earlier takes remain in the portfolio.

Videos require an online, signed-in session. Exported HTML portfolios describe the video but do not embed private footage. Browser support depends on the encoding; recommend MP4 with H.264/AAC. MOV is accepted but some browsers cannot play all MOV encodings. Watching is prompted, not automatically certified or graded. Reflection completion checks evidence presence, not the quality of the answer.

Storage retention: deleted evidence or an abandoned upload may leave an object in the private bucket. Do not enable automatic deletion without deciding the retention period; cleanup must compare object paths with evidence IDs and protect in-flight uploads (signed tickets last two hours).

## Rollout order

1. Review this isolated branch; test uploads and playback with local fixtures and a test storage bucket.
2. Provision the private production bucket and server-only environment variables.
3. Deploy the video-capable app.
4. Run the additive script with `--apply` against the explicitly selected production database.
5. Verify card order and each checkpoint. Test a video and reflection using disposable accounts, then remove test evidence and storage objects.

Do not assign the pitch card before step 3: the previous tutorial renderer does not understand video checkpoints.
