import type { Gesture, GestureDataRaw, Vector2 } from './gesture';

let surface: HTMLElement | null = null;
let startBtn: HTMLButtonElement | null = null;
let stopBtn: HTMLButtonElement | null = null;
let currentInstruction: HTMLElement | null = null;
let trainingStatus: HTMLElement | null = null;
let userInfo: HTMLElement | null = null;
let backBtn: HTMLElement | null = null;

let gesture: Gesture | null = null;
let mode: 'idle' | 'training' = 'idle';

let trainingInstructionSet: string[] = [];
let trainingStepIndex = 0;
let trainingRepsTarget = 10;
let trainingCurrentRep = 0;
let trainingRecords: GestureDataRaw[] = [];

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function getCurrentInstruction(): string {
    return trainingInstructionSet[trainingStepIndex] ?? 'tap';
}

function normalizePoint(x: number, y: number): Vector2 {
    return {
        x: x / window.innerWidth,
        y: y / window.innerHeight
    };
}

function updateInstructionDisplay() {
    if (!currentInstruction) return;

    if (mode === 'training') {
        currentInstruction.textContent =
            `Training: ${capitalize(getCurrentInstruction())} ` +
            `(rep ${trainingCurrentRep + 1}/${trainingRepsTarget})`;

        if (trainingStatus) {
            trainingStatus.textContent =
                `Step ${trainingStepIndex + 1} / ${trainingInstructionSet.length}`;
        }
    } else {
        currentInstruction.textContent =
            `Next: ${capitalize(getCurrentInstruction())}`;
    }
}

function readTrainingSelection(): string[] {
    try {
        const raw = localStorage.getItem('selectedSequence');
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch { /* ignore */ }

    return ['tap', 'swipe', 'scroll'];
}

function addPoint(x: number, y: number, pressure = 0) {
    if (!gesture) return;

    const p = normalizePoint(x, y);
    gesture.points.push({
        time: performance.now(),
        x: p.x,
        y: p.y,
        pressure
    });
}

function finalizeGesture() {
    if (!gesture) return;

    trainingRecords.push({
        timestamp: new Date().toISOString(),
        type: gesture.type,
        touch_position: gesture.points
    });

    gesture = null;
    trainingStepIndex++;

    if (trainingStepIndex < trainingInstructionSet.length) {
        updateInstructionDisplay();
        return;
    }

    trainingStepIndex = 0;
    trainingCurrentRep++;

    if (trainingCurrentRep >= trainingRepsTarget) {
        mode = 'idle';

        if (trainingStatus) trainingStatus.textContent = 'Training complete ✓';
        if (currentInstruction) currentInstruction.textContent = 'All gestures recorded!';
        if (stopBtn) stopBtn.style.display = 'none';
        if (startBtn) startBtn.style.display = '';

        const continueBtn = document.getElementById('continue-btn');
        if (continueBtn) continueBtn.style.display = '';

        try {
            const existing = JSON.parse(localStorage.getItem('trainingRecords') || '[]');
            existing.push({
                user: JSON.parse(localStorage.getItem('user') || 'null'),
                records: trainingRecords
            });
            localStorage.setItem('trainingRecords', JSON.stringify(existing));
        } catch (err) {
            console.error('Failed to save training records', err);
        }

        return;
    }

    updateInstructionDisplay();
}

function onTouchStart(e: TouchEvent) {
    if (mode !== 'training') return;
    e.preventDefault();

    const t = e.touches[0];
    gesture = { type: getCurrentInstruction(), points: [] };
    addPoint(t.clientX, t.clientY, t.force || 0);
}

function onTouchMove(e: TouchEvent) {
    if (!gesture) return;
    e.preventDefault();

    const t = e.touches[0];
    addPoint(t.clientX, t.clientY, t.force || 0);
}

function onTouchEnd(e: TouchEvent) {
    if (!gesture) return;
    e.preventDefault();
    finalizeGesture();
}

function onMouseDown(e: MouseEvent) {
    if (mode !== 'training') return;
    e.preventDefault();

    gesture = { type: getCurrentInstruction(), points: [] };
    addPoint(e.clientX, e.clientY);
}

function onMouseMove(e: MouseEvent) {
    if (!gesture) return;
    e.preventDefault();
    addPoint(e.clientX, e.clientY);
}

function onMouseUp(e: MouseEvent) {
    if (!gesture) return;
    e.preventDefault();
    finalizeGesture();
}

document.addEventListener('DOMContentLoaded', () => {
    surface = document.getElementById('surface');
    startBtn = document.getElementById('start-training') as HTMLButtonElement;
    stopBtn = document.getElementById('stop-training') as HTMLButtonElement;
    currentInstruction = document.getElementById('current-instruction');
    trainingStatus = document.getElementById('training-status');
    userInfo = document.getElementById('user-info');
    backBtn = document.getElementById('back-button');

    if (!surface) {
        console.error('Surface not found');
        return;
    }

    // Touch events stay on surface; touch-action:none on the element handles containment
    surface.addEventListener('touchstart', onTouchStart, { passive: false });
    surface.addEventListener('touchmove', onTouchMove, { passive: false });
    surface.addEventListener('touchend', onTouchEnd, { passive: false });

    // mousedown stays on surface so gestures only start inside the gesture area
    surface.addEventListener('mousedown', onMouseDown);

    // mousemove and mouseup are on document so a gesture isn't broken
    // if the pointer briefly leaves the surface div mid-drag
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    startBtn?.addEventListener('click', () => {
        if (!startBtn || !stopBtn) return;

        trainingInstructionSet = readTrainingSelection();
        trainingStepIndex = 0;
        trainingCurrentRep = 0;
        trainingRecords = [];
        mode = 'training';

        startBtn.style.display = 'none';
        stopBtn.style.display = '';

        const continueBtn = document.getElementById('continue-btn');
        if (continueBtn) continueBtn.style.display = 'none';

        updateInstructionDisplay();
    });

    stopBtn?.addEventListener('click', () => {
        if (!startBtn || !stopBtn) return;

        mode = 'idle';
        gesture = null;

        stopBtn.style.display = 'none';
        startBtn.style.display = '';

        if (trainingStatus) trainingStatus.textContent = 'Stopped';
    });

    try {
        const raw = localStorage.getItem('user');
        if (raw && userInfo) {
            const u = JSON.parse(raw) as { name: string; age: number };
            userInfo.innerHTML = `<strong>${u.name}</strong> — ${u.age} years`;
        }
    } catch {
        if (userInfo) userInfo.textContent = 'User load error';
    }

    backBtn?.addEventListener('click', () => {
        window.location.href = 'selection.html';
    });

    updateInstructionDisplay();
});