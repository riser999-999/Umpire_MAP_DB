import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Anon-Key, read-only dank RLS-Policy
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Supabase/PostgREST liefert standardmaessig maximal 1000 Zeilen pro
  // Request zurueck. Bei "alle Ligen/Klassen" gibt es deutlich mehr Spiele,
  // daher wird hier seitenweise (in 1000er-Bloecken) alles zusammengeholt.
  const PAGE_SIZE = 1000;
  const allRows: any[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("matches")
      .select(`
        id,
        match_id,
        time,
        state,
        human_state,
        home_runs,
        away_runs,
        home_team_name,
        away_team_name,
        umpire_assignments,
        leagueId:league_id,
        leagueName:league_name,
        leagueSport:league_sport,
        leagueInfo:leagues(name, acronym, classification, sport),
        field:venues(name, street, postal_code, city, lat, lng)
      `)
      .order("time", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error(error);
      return res.status(500).json({ error: "Fehler beim Laden der Spiele" });
    }

    allRows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  // Supabase liefert 1:1-Relationen als Array zurueck - hier normalisieren,
  // damit die Struktur exakt dem urspruenglichen Match-Interface entspricht
  // (match.league.acronym, match.field.lat, etc.), so bleibt MatchPopup.tsx
  // unveraendert kompatibel.
  const normalized = allRows.map((m: any) => {
    const leagueInfo = Array.isArray(m.leagueInfo) ? m.leagueInfo[0] : m.leagueInfo;
    const field = Array.isArray(m.field) ? m.field[0] ?? null : m.field;
    const { leagueInfo: _drop, ...rest } = m;
    return {
      ...rest,
      field,
      league: {
        name: leagueInfo?.name ?? m.leagueName,
        acronym: leagueInfo?.acronym ?? "",
        classification: leagueInfo?.classification ?? "",
        sport: leagueInfo?.sport ?? m.leagueSport ?? "",
      },
    };
  });

  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
  res.status(200).json(normalized);
}
