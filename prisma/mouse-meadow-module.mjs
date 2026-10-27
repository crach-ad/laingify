export const MOUSE_MEADOW_TITLE = 'Mouse Meadow';

export function createMouseMeadowModule(projectModule) {
  return projectModule({
    topic: 'Mouse Skills',
    title: MOUSE_MEADOW_TITLE,
    summary: 'Grow mouse confidence through 75 playful levels of pointing, clicking, double-clicking, right-clicking, and drag-and-drop puzzles.',
    badgeName: 'Meadow Explorer',
    badgeIcon: '🌻',
    badgeDescription: 'Practised mouse control, captured session progress, and reflected on a skill to improve.',
    blocks: [
      { type: 'heading', text: 'Grow your mouse skills' },
      { type: 'text', kind: 'learn', minutes: 1, text: 'Use a mouse or trackpad. Pick a skill and follow the picture instructions. Accuracy matters more than speed.' },
      { type: 'link', url: '/play/mouse/class', text: '🌻 Play Mouse Meadow' },
      { type: 'text', kind: 'build', minutes: 15, text: 'Play the skills your teacher chooses. Press Finish when you are ready to stop. Your attempts and score save to your class. You do not need to finish all 75 levels today.', tip: 'Use the home button in the game to return to this module. Keep the game open if a save needs retrying.' },
      { type: 'checkpoint', capture: 'photo', criterionLabel: 'Mouse skills progress', text: 'Upload a screenshot of your finished session showing your score and levels grown.' },
      { type: 'prompt', text: 'What worked? What was tricky? What will you practise next? You can ask your teacher to help write your answer.' },
    ],
    criteria: [
      { label: 'Mouse skills progress', description: 'Captured a Mouse Meadow session result showing practice and progress.', checkType: 'AUTO', requiresEvidenceType: 'PHOTO', required: true, order: 0 },
      { label: 'Written wrap-up', description: 'Names a mouse skill practised and a next step for improving control or accuracy.', checkType: 'AUTO', required: true, order: 1 },
    ],
  });
}
