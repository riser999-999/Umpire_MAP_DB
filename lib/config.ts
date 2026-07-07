export const API_KEY = process.env.BSM_API_KEY!;
export const DBV_ORG_ID = 1;

// Sportarten, die beim Sync beruecksichtigt werden. Leer lassen bedeutet
// "keine Einschraenkung" - hier bewusst Baseball UND Softball aktiv.
export const INCLUDE_SPORTS = ["baseball", "softball"];

// Leer = keine Klassen-Einschraenkung -> es werden WIRKLICH ALLE Ligen
// (Kreisliga, Jugend, Regionalliga, Bundesliga, Playoffs, ...) geladen.
// Falls spaeter doch wieder eingeschraenkt werden soll, hier z.B.
// ["1. Bundesliga", "2. Bundesliga"] eintragen.
export const RELEVANT_CLASSIFICATIONS: string[] = [];

export const MANUAL_LEAGUES: { id: string; name: string; url: string }[] = [];
export const CACHE_SECONDS = 3600;
