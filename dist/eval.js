import {} from './gesture.js';
const surface    = document.getElementById('surface');
const output     = document.getElementById('output');
const statusEl   = document.getElementById('training-status');
const instructEl = document.getElementById('current-instruction');
const userInfoEl = document.getElementById('user-info');
const GESTURES = ['tap', 'swipe', 'scroll'];
let gesture = null;
let stepIndex = 0;
let repCount  = 0;
const REPS    = 10;
const records = [];
// Accumulate gesture rows for the current rep
let currentRepRows = [];
let active    = false;

// ── User info chip ──────────────────────────────────────────────
try {
    const raw = localStorage.getItem('user');
    if (raw && userInfoEl) {
        const u = JSON.parse(raw);
        userInfoEl.innerHTML = `<strong>${u.name}</strong> — ${u.age} years`;
    }
} catch { /* ignore */ }

function currentGesture() {
    return GESTURES[stepIndex % GESTURES.length] ?? 'tap';
}
function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function refreshUI() {
    if (!active) {
        if (statusEl)   statusEl.textContent  = 'Tap Start to begin evaluation';
        if (instructEl) instructEl.textContent = 'Ready';
        return;
    }
    if (statusEl)   statusEl.textContent  = `Rep ${repCount + 1} / ${REPS}  [${stepIndex + 1}/${GESTURES.length}]`;
    if (instructEl) instructEl.textContent = `Perform: ${capitalize(currentGesture())}`;
}

// ── Render a completed-rep card into #output ────────────────────
function renderRepCard(repNumber, rows) {
    if (!output) return;
    output.style.display = '';

    const card = document.createElement('div');
    card.style.cssText = [
        'border:1.5px solid var(--border,#e5e7eb)',
        'border-radius:12px',
        'overflow:hidden',
        'margin-bottom:10px',
    ].join(';');

    // Header
    const header = document.createElement('div');
    header.style.cssText = [
        'display:flex',
        'justify-content:space-between',
        'align-items:center',
        'padding:10px 14px',
        'background:var(--surface,#f9fafb)',
        'border-bottom:1px solid var(--border,#e5e7eb)',
    ].join(';');
    header.innerHTML = `
        <span style="font-size:0.82rem;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:var(--muted,#888)">Rep ${repNumber}</span>
        <span style="font-size:0.78rem;font-weight:600;color:#22c55e">✓ Complete</span>
    `;
    card.appendChild(header);

    // Gesture rows
    const body = document.createElement('div');
    body.style.cssText = 'padding:8px 14px;display:flex;flex-direction:column;gap:6px;';

    rows.forEach(({ type, points, duration }) => {
        const row = document.createElement('div');
        row.style.cssText = [
            'display:flex',
            'justify-content:space-between',
            'align-items:center',
            'padding:6px 10px',
            'background:var(--bg,#fff)',
            'border:1px solid var(--border,#e5e7eb)',
            'border-radius:8px',
            'font-size:0.82rem',
        ].join(';');
        row.innerHTML = `
            <span style="font-weight:600;text-transform:capitalize">${type}</span>
            <span style="color:var(--muted,#888)">${points} pts · ${duration}ms</span>
            <span style="color:#22c55e;font-weight:700">✓</span>
        `;
        body.appendChild(row);
    });

    card.appendChild(body);
    output.appendChild(card);
    output.scrollTop = output.scrollHeight;
}

// ── Render final summary card ───────────────────────────────────
function renderSummaryCard() {
    if (!output) return;
    output.style.display = '';
    const summary = document.createElement('div');
    summary.style.cssText = [
        'margin-top:4px',
        'padding:14px',
        'background:#dcfce7',
        'border:1.5px solid #86efac',
        'border-radius:12px',
        'text-align:center',
        'font-size:0.85rem',
        'font-weight:700',
        'color:#15803d',
    ].join(';');
    summary.textContent = `✓ Evaluation complete — ${records.length} gestures across ${repCount} reps`;
    output.appendChild(summary);
    output.scrollTop = output.scrollHeight;
}

// ── Unified pointer helpers (works for both mouse and touch) ────
function getPoint(e) {
    if (e.touches) {
        const t = e.touches[0] || e.changedTouches[0];
        return t ? { x: t.clientX / window.innerWidth, y: t.clientY / window.innerHeight, pressure: t.force || 0 } : null;
    }
    return { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight, pressure: 0 };
}

function onStart(e) {
    if (!active) return;
    e.preventDefault();
    const p = getPoint(e);
    if (!p) return;
    gesture = { type: currentGesture(), points: [] };
    gesture.points.push({ time: performance.now(), ...p });
}

function onMove(e) {
    if (!active || !gesture) return;
    e.preventDefault();
    const p = getPoint(e);
    if (!p) return;
    gesture.points.push({ time: performance.now(), ...p });
}

function onEnd(e) {
    if (!active || !gesture) return;
    e.preventDefault();

    if (gesture.points.length === 0) { gesture = null; return; }

    const data = {
        timestamp: new Date().toISOString(),
        type: gesture.type,
        touch_position: gesture.points,
    };
    records.push(data);
    console.debug('Eval gesture captured:', data);

    // Accumulate for the current rep card
    const duration = data.touch_position.length > 1
        ? Math.round(data.touch_position[data.touch_position.length - 1].time - data.touch_position[0].time)
        : 0;
    currentRepRows.push({ type: data.type, points: data.touch_position.length, duration });

    stepIndex++;
    const repJustFinished = stepIndex >= GESTURES.length;
    if (repJustFinished) {
        stepIndex = 0;
        repCount++;
        // Render the completed rep card
        renderRepCard(repCount, currentRepRows);
        currentRepRows = [];
    }
    gesture = null;

    if (repCount >= REPS) {
        active = false;
        if (statusEl)   statusEl.textContent  = 'Evaluation complete ✓';
        if (instructEl) instructEl.textContent = 'All gestures recorded!';
        renderSummaryCard();
        try {
            const session  = localStorage.getItem('session') ?? '1';
            const user     = JSON.parse(localStorage.getItem('user') || 'null');
            const payload  = { user, session, records, meta: { completedAt: new Date().toISOString(), reps: repCount } };
            const existing = JSON.parse(localStorage.getItem('evalRecords') || '[]');
            existing.push(payload);
            localStorage.setItem('evalRecords', JSON.stringify(existing));
            console.log('Eval payload:', payload);
        } catch (err) { console.error('Failed to save eval records', err); }
        const doneBtn = document.getElementById('done-btn');
        if (doneBtn) doneBtn.style.display = '';
        const stopBtn = document.getElementById('stop-eval');
        if (stopBtn) stopBtn.style.display = 'none';
        return;
    }
    refreshUI();
}

// ── Attach both mouse AND touch events ──────────────────────────
surface?.addEventListener('mousedown',  onStart, { passive: false });
surface?.addEventListener('mousemove',  onMove,  { passive: false });
surface?.addEventListener('mouseup',    onEnd,   { passive: false });
surface?.addEventListener('touchstart', onStart, { passive: false });
surface?.addEventListener('touchmove',  onMove,  { passive: false });
surface?.addEventListener('touchend',   onEnd,   { passive: false });

// ── Start / Stop buttons ────────────────────────────────────────
const startBtn = document.getElementById('start-eval');
const stopBtn  = document.getElementById('stop-eval');

startBtn?.addEventListener('click', () => {
    stepIndex = 0; repCount = 0; gesture = null; records.length = 0; currentRepRows = [];
    active = true;
    if (output) { output.innerHTML = ''; output.style.display = 'none'; }
    if (startBtn) startBtn.style.display = 'none';
    if (stopBtn)  stopBtn.style.display  = '';
    const doneBtn = document.getElementById('done-btn');
    if (doneBtn) doneBtn.style.display = 'none';
    refreshUI();
});

stopBtn?.addEventListener('click', () => {
    active = false;
    if (stopBtn)  stopBtn.style.display  = 'none';
    if (startBtn) startBtn.style.display = '';
    if (statusEl) statusEl.textContent   = 'Stopped';
    if (instructEl) instructEl.textContent = 'Ready';
});

refreshUI();
//# sourceMappingURL=eval.js.map