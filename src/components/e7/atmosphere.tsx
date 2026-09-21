import { Breeze } from "./breeze";
import { Starfield } from "./starfield";
import { useTheme } from "@/lib/e7/theme";

export function Atmosphere() {
  const theme = useTheme((s) => s.theme);
  return theme === "light" ? <Breeze /> : <Starfield />;
}
