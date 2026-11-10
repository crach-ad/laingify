// Standalone games do not use the app layout. Embedded games use the parent's bar.
(async () => {
  if (window.self !== window.top) return;
  try {
    const response = await fetch('/api/session-status', { cache: 'no-store' });
    if (!response.ok) return;
    const sessions = await response.json();
    if (!sessions.learner && !sessions.instructor) return;
    const instructor = !sessions.learner && sessions.instructor;
    const bar = document.createElement('aside');
    bar.className = 'session-bar'; bar.setAttribute('aria-label', 'Account');
    const label = document.createElement('span');
    label.textContent = instructor ? 'Instructor account' : 'Student account';
    const error = document.createElement('span'); error.setAttribute('role', 'alert');
    const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Sign out →';
    button.onclick = async () => {
      button.disabled = true; button.textContent = 'Signing out…'; error.textContent = '';
      try {
        const result = await fetch(instructor ? '/api/instruct/logout' : '/api/logout', { method: 'POST' });
        if (!result.ok) throw Error();
        window.location.assign(instructor ? '/instruct/login' : '/join');
      } catch {
        error.textContent = 'Could not sign out. Please try again.';
        button.disabled = false; button.textContent = 'Sign out →';
      }
    };
    bar.append(label, error, button); document.body.prepend(bar);
  } catch { /* Public play remains available when session lookup is offline. */ }
})();
