import "server-only"

// Import dictionaries statically to avoid dynamic imports
import enDict from "./dictionaries/en.json"
import zhDict from "./dictionaries/zh.json"

// Define dictionary type
export type Locale = "en" | "zh"

// Create a static dictionary map
const dictionaries = {
  en: enDict,
  zh: zhDict,
}

// This function is only called on the server
export const getDictionary = async (locale: Locale) => {
  return dictionaries[locale]
}
