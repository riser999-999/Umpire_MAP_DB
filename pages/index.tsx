import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Head from "next/head";
import type { Match } from "../lib/bsm";
import { parseDate, dayKey } from "../lib/bsm";
import DaySelector from "../components/DaySelector";
import SportFilter, { SportOption } from "../components/SportFilter";

const MapView = dynamic(() => import("../components/MapView"), { ssr: false });

type MatchWithLeague = Match & { leagueName: string; leagueId: string };

function getDayKey(dateStr: string): string {
  return dayKey(parseDate(dateStr));
}

function selectDefaultDay(days: string[]): string | null {
  if (!days.length) return null;
  
  // Get current date in Europe/Berlin timezone
  const nowBerlin = new Date().toLocaleDateString("de-DE", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  
  // Find today's matches
  const todayMatches = days.filter((d) => getDayKey(d) === nowBerlin);
  if (todayMatches.length) return todayMatches[0];
  
  // If no today, find future matches
  const now = new Date();
  const future = days.filter((d) => parseDate(d) >= now);
  if (future.length) return future[0];
  
  // Otherwise return the last day
  return days[days.length - 1];
}

export default function HomePage() {
  const [matches, setMatches] = useState<MatchWithLeague[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [sportFilter, setSportFilter] = useState<SportOption>("all");

  useEffect(() => {
    fetch("/api/matches")
      .then((r) => {
        if (!r.ok) throw new Error("API error");
        return r.json();
      })
      .then((data: MatchWithLeague[]) => {
        setMatches(data);
        setLoading(false);

        // Build sorted unique days
        const dayMap = new Map<string, string>();
        for (const m of data) {
          const key = getDayKey(m.time);
          if (!dayMap.has(key)) dayMap.set(key, m.time);
        }
        const sortedDays = Array.from(dayMap.entries())
          .sort(([, a], [, b]) => parseDate(a).getTime() - parseDate(b).getTime())
          .map(([, time]) => time);

        const defaultDay = selectDefaultDay(sortedDays);
        setSelectedDay(defaultDay);
      })
      .catch((err) => {
        console.error(err);
        setError("Fehler beim Laden der Spieldaten. Bitte später erneut versuchen.");
        setLoading(false);
      });
  }, []);

  // Nach Sportart gefilterte Spiele (Baseball/Softball/Alle). Wird ueberall
  // als Basis verwendet, damit Tagesliste, Zaehler und Karte konsistent sind.
  const filteredMatches = useMemo(() => {
    if (sportFilter === "all") return matches;
    return matches.filter((m) => (m.league?.sport || "").toLowerCase().includes(sportFilter));
  }, [matches, sportFilter]);

  // Sorted unique days (representative time per day key) and match counts,
  // computed in a single pass over `filteredMatches` and only recomputed when
  // the (gefilterte) match list selbst sich aendert (nicht bei jedem Tageswechsel).
  const { sortedDays, matchCountByDay } = useMemo(() => {
    const dayRepByKey = new Map<string, string>();
    const countByKey = new Map<string, number>();
    for (const m of filteredMatches) {
      const key = getDayKey(m.time);
      if (!dayRepByKey.has(key)) dayRepByKey.set(key, m.time);
      countByKey.set(key, (countByKey.get(key) ?? 0) + 1);
    }
    const sortedDays = Array.from(dayRepByKey.entries())
      .sort(([, a], [, b]) => parseDate(a).getTime() - parseDate(b).getTime())
      .map(([, time]) => time);
    const matchCountByDay: Record<string, number> = {};
    dayRepByKey.forEach((rep, key) => {
      matchCountByDay[rep] = countByKey.get(key) ?? 0;
    });
    return { sortedDays, matchCountByDay };
  }, [filteredMatches]);

  // Wenn sich der Sportfilter aendert und der bisher gewaehlte Tag darin
  // keine Spiele mehr hat, automatisch auf einen sinnvollen Tag springen.
  useEffect(() => {
    if (!selectedDay) return;
    if (!sortedDays.some((d) => getDayKey(d) === getDayKey(selectedDay))) {
      setSelectedDay(selectDefaultDay(sortedDays));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sportFilter, sortedDays]);

  return (
    <>
      <Head>
        <title>Umpire Map – Spielorte Übersicht</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        backgroundColor: "#0f172a",
      }}>
        {/* Header */}
        <header style={{
          padding: "16px 20px 12px",
          backgroundColor: "#0f172a",
          borderBottom: "1px solid #1e293b",
          flexShrink: 0,
        }}>
          <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.5px" }}>
            ⚾ UMPIRE MAP
          </h1>
          <p style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
            Spielorte Saison 2026
          </p>
        </header>

        {/* Sport Filter */}
        {!loading && !error && (
          <SportFilter value={sportFilter} onChange={setSportFilter} />
        )}

        {/* Day Selector */}
        {!loading && !error && sortedDays.length > 0 && (
          <DaySelector
            days={sortedDays}
            selectedDay={selectedDay}
            matchCountByDay={matchCountByDay}
            onSelect={setSelectedDay}
          />
        )}

        {/* Main content */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {loading && (
            <div style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#64748b",
              fontSize: "15px",
            }}>
              Lade Spiele...
            </div>
          )}

          {error && (
            <div style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              textAlign: "center",
              color: "#ef4444",
              fontSize: "14px",
            }}>
              {error}
            </div>
          )}

          {!loading && !error && !selectedDay && (
            <div style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#64748b",
              fontSize: "14px",
            }}>
              Keine Spiele für diesen Tag gefunden.
            </div>
          )}

          {!loading && !error && selectedDay && (
            <MapView matches={filteredMatches} selectedDay={selectedDay} />
          )}
        </main>
      </div>
    </>
  );
}
