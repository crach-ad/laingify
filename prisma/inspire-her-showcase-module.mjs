export const INSPIRE_HER_TITLE = 'Inspire Her Showcase';

export function inspireHerShowcaseData() {
  const blocks = [];
  const criteria = [];
  const step = (heading, label, capture, text, extra = {}) => {
    blocks.push({ type: 'heading', text: heading }, { type: 'checkpoint', criterionLabel: label, capture, text, ...extra });
    criteria.push({ label, description: text, checkType: 'AUTO', required: true, order: criteria.length, requiresEvidenceType: capture === 'photo' ? 'PHOTO' : capture === 'audio' ? 'AUDIO' : 'TEXT' });
  };
  blocks.push(
    { type: 'heading', text: 'Your idea, your process, your showcase' },
    { type: 'text', kind: 'learn', text: 'Build a record of how your project grows: outline → sketches → voice check-in → design flows → voice reflection → platform architecture → voice reflection → published project. Save each stage before moving on. You can return to continue or revisit your work.', tip: 'For visual uploads, use a clear photo or a PNG/JPG screenshot. Combine several pages into one readable image if needed. Your final submission is a published project link, not a ZIP file.' },
  );
  step('Start — Outline your project', 'Project outline', 'fields', 'Introduce the project you want to bring to the Inspire Her Showcase.', {
    fields: [
      { label: 'Project name', placeholder: 'Give your project a working title.' },
      { label: 'Who it helps', placeholder: 'Who will use it, and what problem do they face?' },
      { label: 'Your idea', placeholder: 'What will your platform let someone do?' },
      { label: 'First version', placeholder: 'Name the most important features you plan to build.' },
    ],
  });
  step('Stage 1 — Upload your sketches', 'Project sketches', 'photo', 'Upload a clear photo or screenshot of your sketches. Label the main screens, buttons, and ideas. Show enough detail for someone else to understand your first design.');
  step('Stage 1 — Verbal check-in', 'Voice check-in: sketches', 'audio', 'Record a short check-in after your sketch. What are you building and who is it for? Walk us through your sketch. Explain one design choice and one question you still need to answer. Aim for about 1–2 minutes.');
  step('Stage 2 — Upload your design flows', 'Design flows', 'photo', 'Upload a photo or screenshot of your design flow. Use arrows to show how a person moves through the platform: where they start, what they choose, which screen comes next, and how they finish their main task. Include an important decision or error path.');
  step('Stage 2 — Verbal reflection', 'Voice reflection: design flows', 'audio', 'Record a reflection on your design flows. Talk us through one complete user journey. What changed from your sketches? Where could a user get confused, and what will you improve? Aim for about 1–2 minutes.');
  step('Stage 3 — Upload your platform architecture', 'Platform architecture', 'photo', 'Upload a photo or screenshot of your platform architecture diagram. Show how the actual parts fit together: screens, application logic, stored data, and any outside services. Connect the parts with arrows showing what information moves between them. If your platform is simpler, show only the parts it really uses; label anything still planned.');
  step('Stage 3 — Architecture reflection', 'Voice reflection: architecture', 'audio', 'Record a reflection explaining how your platform works behind the scenes. Follow one user action through your diagram. Explain where information is stored, one technical choice you made, and what remains to be built or improved. Do not include passwords or secret keys. Aim for about 1–2 minutes.');
  step('Stage 4 — Publish and submit your project', 'Published project', 'fields', 'Publish your project using the tool you built it with, then submit its viewer link below. Open the link in a signed-out or private browser window to check that your teacher can view it. Submit the project itself, not its editing dashboard. This step records your link in Laingify; it does not publish the project for you.', {
    fields: [
      { label: 'Published project URL', placeholder: 'https://… — paste the working viewer link.' },
      { label: 'Showcase description', placeholder: 'What did you build, who is it for, and what should visitors try first?' },
      { label: 'Current state', placeholder: 'What works now? Clearly name anything that is a prototype or still unfinished.' },
    ],
    tip: 'Use sample data in your public project. Keep passwords, personal contact details, and secret keys out of the project and your submission. Ask your teacher before changing access permissions if you are unsure.',
  });
  return {
    title: INSPIRE_HER_TITLE,
    topic: 'Empowerment Series',
    summary: 'Outline, document, and share your project through sketches, design flows, platform architecture, voice reflections, and a published project link.',
    badgeName: 'Inspire Her Creator',
    badgeIcon: '🌟',
    badgeDescription: 'Documented a project from its first sketch to a published showcase, explaining design and architecture decisions along the way.',
    contentJson: JSON.stringify(blocks),
    criteria: { create: criteria },
  };
}
