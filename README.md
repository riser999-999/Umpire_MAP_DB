# Umpire Map

Zeigt Baseball- und Softball-Spiele (alle Ligen, alle Klassen) auf einer
Karte an, inkl. Schiedsrichter-Zuteilungen. Daten stammen aus der
BSM-API (`bsm.baseball-softball.de`) und werden periodisch nach Supabase
synchronisiert; das Frontend liest ausschliesslich aus Supabase.

## Was ist neu in diesem Fork?

- **Alle Ligen & Klassen**: der Sync-Job filtert nicht mehr auf bestimmte
  Klassen (z.B. nur "1./2. Bundesliga"). Siehe `lib/config.ts` ->
  `RELEVANT_CLASSIFICATIONS` (leer = keine Einschraenkung).
- **Baseball UND Softball**: siehe `lib/config.ts` -> `INCLUDE_SPORTS`.
- **Sport-Filter im Frontend**: Umschalter "Alle / Baseball / Softball"
  oberhalb der Tagesauswahl (`components/SportFilter.tsx`).
- **Neues Supabase-Schema** unter `supabase/schema.sql` (inkl. `sport`-Spalte
  in `leagues` und `league_sport` in `matches`), da im Original-Repo keine
  Schema-Datei vorlag.

## 1) Neues Supabase-Projekt anlegen

1. Auf [supabase.com](https://supabase.com) einloggen -> **New project**.
2. Projektname, Datenbank-Passwort und Region waehlen (z.B. Frankfurt/EU) ->
   **Create new project** (dauert ca. 1-2 Minuten).
3. Im Dashboard: **SQL Editor** -> **New query** -> Inhalt von
   `supabase/schema.sql` einfuegen -> **Run**.
   Damit werden die Tabellen `leagues`, `venues`, `matches` inkl.
   RLS-Policies (Frontend darf nur lesen) angelegt.
4. Unter **Project Settings -> API** die folgenden Werte notieren:
   - `Project URL` -> wird zu `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_URL`
   - `anon public` Key -> wird zu `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` Key (unter "Reveal") -> wird zu
     `SUPABASE_SERVICE_ROLE_KEY` (**geheim halten!**, nur fuer den Sync-Job)

## 2) Repository & GitHub Actions Secrets

1. Dieses Repository in dein GitHub-Konto pushen (falls noch nicht
   geschehen).
2. Repository-Settings -> **Secrets and variables -> Actions -> New
   repository secret**, drei Secrets anlegen:
   - `BSM_API_KEY` (dein API-Key fuer bsm.baseball-softball.de)
   - `SUPABASE_URL` (Project URL aus Schritt 1)
   - `SUPABASE_SERVICE_ROLE_KEY` (service_role Key aus Schritt 1)
3. Der Workflow `.github/workflows/sync.yml` laeuft automatisch alle 30
   Minuten und kann zusaetzlich manuell ueber den Tab **Actions ->
   "Sync BSM data to Supabase" -> Run workflow** gestartet werden. Fuehr
   ihn einmal manuell aus, damit die Datenbank initial befuellt wird.

## 3) Neues Vercel-Hosting

1. Auf [vercel.com](https://vercel.com) einloggen -> **Add New -> Project**.
2. Das GitHub-Repository auswaehlen/importieren (ggf. Vercel-GitHub-App
   Zugriff auf das Repo gewaehren).
3. Framework wird automatisch als **Next.js** erkannt, keine weiteren
   Build-Einstellungen noetig.
4. Unter **Environment Variables** vor dem ersten Deploy eintragen:
   - `NEXT_PUBLIC_SUPABASE_URL` (Project URL aus Schritt 1)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (anon public Key aus Schritt 1)
   - `BSM_API_KEY` (nur fuer `/api/debug`, optional)
5. **Deploy** klicken. Nach ein paar Minuten ist die App unter der
   vergebenen `*.vercel.app`-Domain erreichbar.
6. Jeder Push auf den main-Branch loest danach automatisch ein neues
   Deployment aus.

## Lokale Entwicklung

```bash
npm install
cp .env.local.example .env.local   # BSM_API_KEY eintragen
# zusaetzlich in .env.local:
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
npm run dev

# Sync manuell lokal ausfuehren (braucht SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
# als Umgebungsvariablen, z.B. per .env oder export):
npm run sync
```

## Benoetigte Umgebungsvariablen im Ueberblick

**Lokal / Vercel** (`.env.local` bzw. Vercel-Projekteinstellungen):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**GitHub Actions Secrets** (Repository-Settings -> Secrets and variables -> Actions):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `BSM_API_KEY`

Der Service-Role-Key wird ausschliesslich im Sync-Job verwendet und darf
niemals im Frontend-Code oder in `NEXT_PUBLIC_*`-Variablen landen.
