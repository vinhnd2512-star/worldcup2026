export const teamFlags: Record<string, string> = {
  ARG: "🇦🇷",
  AUS: "🇦🇺",
  BEL: "🇧🇪",
  BRA: "🇧🇷",
  CAN: "🇨🇦",
  DEN: "🇩🇰",
  ESP: "🇪🇸",
  FRA: "🇫🇷",
  GER: "🇩🇪",
  JPN: "🇯🇵",
  KOR: "🇰🇷",
  MAR: "🇲🇦",
  MEX: "🇲🇽",
  NED: "🇳🇱",
  POR: "🇵🇹",
  SRB: "🇷🇸",
  URU: "🇺🇾",
  USA: "🇺🇸"
};

export function flagFor(code: string): string {
  return teamFlags[code] ?? "⚽";
}
