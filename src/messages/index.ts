import de from "./de.json";
import en from "./en.json";
import es from "./es.json";
import fr from "./fr.json";
import ja from "./ja.json";
import ko from "./ko.json";
import th from "./th.json";
import vi from "./vi.json";
import zh from "./zh.json";

type Messages = Record<string, string>;
export const messages: Record<string, Messages> = { de, en, es, fr, ja, ko, th, vi, zh };
