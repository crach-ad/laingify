export const PITCH_ANALYSIS_TITLE = 'Elevator Pitch Analysis';
export function elevatorPitchAnalysisData() {
  return {
    title: PITCH_ANALYSIS_TITLE, topic: 'Empowerment Series',
    summary: 'Upload your elevator pitch video, watch yourself present, and reflect on how to make your message stronger.',
    badgeName: 'Reflective Presenter', badgeIcon: '🎬',
    badgeDescription: 'Reviewed her elevator pitch and identified specific strengths and improvements.',
    contentJson: JSON.stringify([
      { type: 'heading', text: 'See your pitch through your audience’s eyes' },
      { type: 'text', kind: 'learn', text: 'Choose a video of your elevator pitch, or record a new one with your phone or computer camera. Aim for 45–90 seconds: introduce the problem, your solution, who it helps, and what you want your audience to do next. Upload it here, watch it all the way through, then write your reflection.', tip: 'Use MP4 if possible. Keep the video under 50 MB; export at a lower resolution if necessary. You can keep earlier takes and upload another to show your progress.' },
      { type: 'heading', text: 'Step 1 — Upload and watch your pitch' },
      { type: 'checkpoint', capture: 'video', criterionLabel: 'Elevator pitch video', text: 'Upload your pitch video. Once it saves, press Play to watch yourself. Notice your opening, how clearly you explain the idea, your pace, voice, eye contact, and closing request. Replay any moment you want to examine before continuing.' },
      { type: 'heading', text: 'Step 2 — Write your pitch analysis' },
      { type: 'checkpoint', capture: 'fields', criterionLabel: 'Written pitch analysis', text: 'After watching your video, write an honest, specific reflection. You do not need to sound perfect. Use moments from your recording as evidence.', fields: [
        { label: 'My message', placeholder: 'Was the problem, solution, and intended audience clear? What might a listener still wonder?' },
        { label: 'What worked', placeholder: 'Describe one strong moment. Include an approximate timestamp or a phrase you said.' },
        { label: 'My delivery', placeholder: 'What did you notice about your pace, volume, eye contact, or body language?' },
        { label: 'What I would change', placeholder: 'Name one specific improvement and explain why it would help your audience.' },
        { label: 'My next attempt', placeholder: 'Write a stronger opening or closing line, or explain what you will practise before recording again.' },
      ] },
    ]),
    criteria: { create: [
      { label: 'Elevator pitch video', description: 'Uploaded a playable recording of her elevator pitch for review.', checkType: 'AUTO', required: true, order: 0, requiresEvidenceType: 'VIDEO' },
      { label: 'Written pitch analysis', description: 'Reflected on message, strengths, delivery, improvements, and a concrete next attempt after watching the pitch.', checkType: 'AUTO', required: true, order: 1, requiresEvidenceType: 'TEXT' },
    ] },
  };
}
