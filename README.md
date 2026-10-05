# ES-Interviu

Romanian for the residence interview. The whole five-day course, speaking, listening and writing practice, and the final exam with its strict marking — on your phone.

Plain files, no build step. Everything you write and every score stays on your device.

## Files

| File | What it does |
|---|---|
| `index.html` | The shell, the royal theme and the icons |
| `app.js` | The app: course reader, drills, simulator, exam, marking |
| `content-ref.js` | Pronunciation, grammar, survival phrases, the 18 questions, the exam |
| `content-course.js` | All ten sessions: officer questions, answer bank, notes, homework and keys |
| `manifest.json`, `sw.js` | Installable and offline |
| icon files | App icons |

## Publish and install

1. Create a public repo named `ES-Interviu` and upload these files (the files, not the folder).
2. Settings → Pages → Deploy from a branch → `main` → `/ (root)` → Save.
3. Open `https://esthyu.github.io/ES-Interviu/` in Safari, then Share → Add to Home Screen.

## The Romanian voice

iPhones speak Romanian properly only if a Romanian voice is installed: **Settings → Accessibility → Spoken Content → Voices → Romanian**, and download one.

Without it the app no longer stays silent. It falls back to the closest voice your phone has, in this order: Romanian, Italian, Spanish, Portuguese, Catalan, French, then anything. The words are correct, the accent is not, so install the Romanian voice before you trust the pronunciation.

Under Settings on the Home tab there is a **Test the audio** button and a line naming the voice in use. If you hear nothing at all: check the silent switch on the side of the phone, turn the volume up, and tap any play button once (iPhone only allows sound after a tap).

## What's inside

- **Course.** Five days, ten sessions. Each one gives the officer's questions, the answer bank in several forms with pronunciation and translation, the teaching notes, and both homeworks with their keys. Mark a session done and it shows on your progress.
- **Speak.** The interview simulator runs all 18 questions: the officer asks, you answer out loud within three seconds, the app records you, and you score it 0, 1 or 2 like the marking guide. Shadowing plays a phrase, records your repeat and plays both back. Answer cards deal a random question with a countdown.
- **Listen.** Four drills: hear a phrase and choose the meaning, dictation, numbers, and officer questions.
- **Write.** Seven drills, all marked automatically by the exam's zero rules: de/din/acum, place/plac, gender endings, age sentences, past tense, strict translation, and every session homework.
- **Despre mine.** A builder for your own ten sentences, checked against the exam grid for topic coverage, signature structures and length.
- **Exam.** All six sections, 100 points. Sections A to D are marked automatically, Despre mine is checked against the grid, and the oral section is scored 0/1/2 per question plus four conduct points. At the end you get the band, the advice, and a feedback sheet naming what to re-drill and which day it came from.
- **Phrases.** Every phrase in the course, searchable, plus the pronunciation table and the grammar kit.

## How the marking works

The zero rules from the marking guide are applied exactly:

- An age sentence without **de** (20 and over) or with **de** (under 20) scores zero.
- **place** or **plac** for the wrong number scores zero.
- A reflexive past without **m-** scores zero.
- The wrong choice of **de**, **din** or **acum** scores zero.

Missing diacritics, small spelling slips and word-order wobbles are forgiven, as the guide says.

Set whether you speak as a woman or a man in Settings. That decides which endings count as correct.

## Updating

Upload the changed files, then bump `VERSION` in `sw.js`. Your answers and scores aren't touched.
