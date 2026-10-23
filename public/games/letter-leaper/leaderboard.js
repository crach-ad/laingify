'use strict';
const gameBasePath = '/api/letter-leaper';
let pendingScore = null, savingScore = false, boardRequests = {board:0, "home-board":0};
async function api(path, data) {
  const response = await fetch(gameBasePath+path, {credentials:'same-origin', ...(data ? {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)} : {}),signal:AbortSignal.timeout(12000)});
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Please try again.');
  return result;
}
function errorMessage(error) { return error.name === 'TimeoutError' || error instanceof TypeError ? 'Connection interrupted. Please try again.' : error.message; }
let profileEdited = false;
$('username').addEventListener('input',()=>{profileEdited=true;$('profile-status').textContent='';});
api('/profile').then(profile=>{if(!profileEdited && profile.username)$('username').value=profile.username;}).catch(()=>{$('profile-status').textContent='Connect to save your username and join the leaderboard.';});
$('player-form').addEventListener('submit',async event=>{
  event.preventDefault();
  if ($('start').disabled) return;
  $('start').disabled=true;
  $('profile-status').textContent='Saving your username…';
  try {
    if(pendingScore){await saveScore();if(pendingScore)throw new Error('Your previous climb is still unsaved. Press Let’s leap to retry saving it.');}
    const profile=await api('/profile',{username:$('username').value.trim()});
    $('username').value=profile.username;
    $('profile-status').textContent='';
    loadBoard('home-board');
    start();
  } catch(error) { $('profile-status').textContent=errorMessage(error); }
  finally { $('start').disabled=false; }
});
async function saveScore() {
  if (!pendingScore || savingScore) return;
  savingScore=true;
  $('retry-score').hidden=true;
  $('score-status').textContent='Saving your climb…';
  try {
    await api('/scores',pendingScore);
    pendingScore=null;
    $('score-status').textContent='Climb saved! Your best result is on the leaderboard.';
    $('profile-status').textContent='';
    loadBoard('home-board');
    if($('leaderboard-dialog').open)loadBoard();
  } catch(error) {
    $('score-status').textContent=errorMessage(error)+' Your result is kept here until you retry.';
    $('retry-score').hidden=false;
  } finally { savingScore=false; }
}
window.addEventListener('climb-complete',event=>{pendingScore=event.detail;saveScore();});
$('retry-score').onclick=saveScore;
function climbTime(ms) { const s=Math.floor(ms/1000);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); }
async function loadBoard(prefix='board') {
  const sequence=++boardRequests[prefix];
  const boardElement=suffix=>$(prefix+'-'+suffix);
  boardElement('status').textContent='Loading climbers…';
  boardElement('table').hidden=true;
  try {
    const result=await api('/leaderboard?'+new URLSearchParams({practice:(prefix==='home-board'?$('letter-set'):boardElement('practice')).value,pace:(prefix==='home-board'?$('pace'):boardElement('pace')).value}));
    if(sequence!==boardRequests[prefix])return;
    boardElement('entries').replaceChildren();
    const entries=prefix==='home-board'?result.entries.slice(0,5):result.entries;
    for(const row of entries) {
      if(prefix==='home-board'){
        const card=document.createElement('li');
        if(row.you)card.className='your-score';
        const name=document.createElement('strong');name.textContent=row.rank+'. '+row.username+(row.you?' (you)':'');
        const detail=document.createElement('span');detail.textContent=row.accuracy.toFixed(2)+'% · '+row.streak+' streak · '+climbTime(row.elapsed);
        card.append(name,detail);boardElement('entries').append(card);continue;
      }
      const tr=document.createElement('tr');
      if(row.you)tr.className='your-score';
      for(const value of [row.rank+'. '+row.username+(row.you?' (you)':''),row.accuracy.toFixed(2)+'%',row.streak,climbTime(row.elapsed)]) {
        const td=document.createElement('td');td.textContent=value;tr.append(td);
      }
      boardElement('entries').append(tr);
    }
    boardElement('table').hidden=!result.entries.length;
    boardElement('status').textContent=result.entries.length?'':'No climbs yet for this mode. Reach the stars to claim the first spot!';
  } catch(error) { if(sequence===boardRequests[prefix])boardElement('status').textContent=errorMessage(error); }
}
function openBoard() {
  if(state==='playing')requestPause();
  $('board-practice').value=state==='intro'?$('letter-set').value:set;
  $('board-pace').value=state==='intro'?$('pace').value:pace;
  $('leaderboard-dialog').showModal();
  loadBoard();
}
$('leaderboard').onclick=$('finish-leaderboard').onclick=openBoard;
$('close-leaderboard').onclick=()=>$('leaderboard-dialog').close();
$('board-practice').onchange=$('board-pace').onchange=()=>loadBoard();
$('refresh-board').onclick=()=>loadBoard();
$('letter-set').addEventListener('change',()=>loadBoard('home-board'));
$('pace').addEventListener('change',()=>loadBoard('home-board'));
$('refresh-home-board').onclick=()=>loadBoard('home-board');
loadBoard('home-board');
