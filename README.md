# fsp – Überblick & Arbeitsbasis

Dieses Repository enthält eine **statische Lern-App für die medizinische Fachsprachprüfung (FSP)** mit:

- Karteikarten-/Spaced-Repetition-Training (`data/cards.json`, Logik in `src/app.js`)
- Login via Supabase (Client in `src/app.js`)
- Sprachmodus „Patiens ex machina“ über Cloudflare Workers AI (`functions/api/voice-turn.js`, `functions/api/voice-evaluate.js`)
- statischem Frontend (`index.html`, `src/styles.css`)

## Projektstruktur

- `index.html` – gesamte UI-Struktur inkl. Auth, Trainings- und Voice-Bereich.
- `src/app.js` – zentrale App-Logik (State, Rendering, Spaced Repetition, Voice-Flows, Supabase/Auth).
- `src/styles.css` – Styling.
- `data/cards.json` – Hauptlerndaten (Deck + Begriffe + Karten).
- `data/patientengespraeche_ai_cases_de.txt` – Fallbibliothek für den Voice-Simulator.
- `data/patientengespraeche_case_resolutions_de.json` – Auflösungen/Feedback-Hilfen zu Fällen.
- `functions/api/voice-turn.js` – Endpoint für Anamnese-Turns (STT + LLM-Patient + optional TTS).
- `functions/api/voice-evaluate.js` – Endpoint zur Diagnosenbewertung (STT + LLM-Evaluation + optional TTS).
- `supabase/voice_exam_results.sql` – optionale SQL-Struktur zum Speichern von Voice-Prüfungsergebnissen.
- `supabase/prompt_feedback.sql` – SQL-Struktur für Prompt-Vorschläge + globale Prompt-Profile (Testphase).
- `_headers` – Cache-Header für statische Auslieferung.

## Wie die App grob funktioniert

1. **Login/Session** läuft über Supabase im Frontend.
2. **Kartenmodus** lädt `data/cards.json`, baut daraus Kategorien/Ordner und steuert Wiederholungen lokal (LocalStorage + optional Sync).
3. **Voice-Modus** sendet Audio/Text an Pages Functions:
   - `voice-turn`: simulierte Patientenantwort inkl. kurzem Coach-Hinweis
   - `voice-evaluate`: Bewertung der finalen Diagnose (Scores + Textfeedback)
4. **Persistenz**:
   - lokal über mehrere LocalStorage-Keys
   - optional serverseitig über Supabase-Tabelle `voice_exam_results` (SQL-Skript vorhanden)

## Lokal arbeiten (auf deinem Computer)

Wenn du wie bisher lokal entwickelst und von dort pushst:

1. Repo klonen/öffnen.
2. Änderungen an `index.html`, `src/*`, `functions/api/*`, `data/*` vornehmen.
3. Schnellcheck vor Commit:
   - `node --check src/app.js`
   - `node --check functions/api/voice-turn.js`
   - `node --check functions/api/voice-evaluate.js`
4. Commit & Push:
   - `git add -A`
   - `git commit -m "<deine Änderung>"`
   - `git push`

## Deployment-Hinweis

Die Struktur mit `functions/api/*.js` ist auf **Cloudflare Pages Functions** ausgelegt. Für den Voice-Teil braucht das Projekt die Workers-AI-Binding `AI` (siehe Fehlermeldungstexte in den Function-Dateien).

## Nächste sinnvolle Verbesserungen (optional)

- `README` um echte lokale Start-/Deploy-Befehle ergänzen (z. B. `wrangler pages dev`), falls im Zielsystem genutzt.
- Umgebungswerte (z. B. Supabase URL/Key) mittelfristig aus `src/app.js` in Konfiguration/Env verlagern.
- Kleine Smoke-Tests für Datenintegrität (`data/cards.json`) ergänzen.
