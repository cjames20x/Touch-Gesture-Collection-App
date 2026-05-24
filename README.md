# Touch Gesture Collection App

A browser-based research prototype for collecting and evaluating touch gesture data (tap, swipe, scroll). Built as a multi-page web app — no server required, everything runs locally in the browser.

---

## Pages & Flow

```
index.html
└── register.html         ← enter name, age, gender, participant ID
    └── [informed consent screens]
        └── home.html / selection.html   ← choose Training or Evaluation
            ├── sequence.html            ← pick gesture order (Training path)
            │   └── training.html        ← practice gestures (10 reps each)
            └── eval.html                ← evaluation (instructions → tasks → results)
```

---

## Getting Started

### Prerequisites

- A modern browser (Chrome, Safari, Firefox, Edge)
- Node.js + a bundler if you're editing TypeScript source (the `dist/` folder must exist)

### Running locally

```bash
# clone the repo
git clone https://github.com/your-username/touch-gesture-collection.git
cd touch-gesture-collection

# install dependencies (if using a bundler like Vite/esbuild)
npm install

# build the JS
npm run build

# serve locally — opening index.html directly may block localStorage on some browsers
npx serve .
# then open http://localhost:3000
```

> **No build needed?** If you're using the pre-built `dist/` files, just serve the folder with any static server (VS Code Live Server works fine).

---

## Page-by-Page Guide

### 1. `index.html` — Home
The entry point. Click **Register / Start** to begin.

### 2. `register.html` — Register
Fill in:
| Field | Notes |
|---|---|
| **Name** | Free text |
| **Age** | Number, 1–150 |
| **Gender** | Male / Female selector |
| **Participant ID** | e.g. `P001` |

Click **Next** to proceed. Data is saved to `localStorage` under the key `user`.

### 3. `selection.html` — Choose Activity
After registering, pick either:
- **Training** → goes to `sequence.html` then `training.html`
- **Evaluation** → goes to `eval.html`

### 4. `sequence.html` — Instruction Sequence *(Training path only)*
Choose the order gestures will be presented:

| Option | Order |
|---|---|
| Tap → Swipe → Scroll | default |
| Swipe → Zoom → Scroll | |
| Pinch → Swipe → Tap | |
| Scroll → Swipe → Scroll | |

The chosen sequence is saved to `localStorage` under the key `sequence` and used by both `training.html` and `eval.html`.

### 5. `training.html` — Training
Practice mode. Performs 10 reps of each gesture in the selected sequence. Use this before the evaluation session to get familiar with gesture detection thresholds.

### 6. `eval.html` — Evaluation

**Step 1 — Instructions screen**
Explains the three gesture tasks, the 10-rep target, and feedback colours before you begin.

**Step 2 — Gesture tasks**
Three tabs — **TAP**, **SWIPE**, **SCROLL** — are completed in sequence order. For each:

| Gesture | How to perform |
|---|---|
| **TAP** | Press and lift one finger quickly (< 300 ms). Keep finger still — no sliding. |
| **SWIPE** | Slide one finger horizontally (left or right) at least ~35 px, then lift. |
| **SCROLL** | Slide one finger vertically (up or down) at least ~35 px, then lift. |

The zone flashes **green** on a valid gesture and **red** on an invalid one. Complete 10 valid reps per gesture to advance.

**Step 3 — Results**
Shows per-gesture averages (distance, duration), a template distance score, and a log-likelihood value. Results are saved to `localStorage` under `eval_results`.

---

## Data Storage

All data is stored client-side in `localStorage`. Nothing is sent to a server.

| Key | Contents |
|---|---|
| `user` | `{ name, age, gender, participantId }` |
| `sequence` | Comma-separated gesture order, e.g. `"tap,swipe,scroll"` |
| `eval_results` | Array of result objects with timestamp, metrics, and raw sequence |

To inspect or export saved data, open the browser console and run:
```js
JSON.parse(localStorage.getItem('eval_results'))
```

To clear all data:
```js
localStorage.clear()
```

---

## Project Structure

```
├── index.html
├── register.html
├── selection.html
├── sequence.html
├── training.html
├── eval.html
├── user.html           ← debug view of saved user info
├── index.css           ← shared styles
└── dist/
    ├── register.js
    ├── selection.js
    ├── sequence.js
    └── training.js
```

---

## Browser & Device Notes

- **Touch devices** (phones/tablets) are the intended target. Gestures are captured via the Touch Events API.
- **Desktop** is supported as a fallback using mouse events — useful for development and testing.
- `touch-action: none` is set on the gesture zone to prevent the browser from intercepting swipes/scrolls.
- Tested on Chrome (Android), Safari (iOS), and Chrome/Firefox (desktop).

---

## License

MIT
