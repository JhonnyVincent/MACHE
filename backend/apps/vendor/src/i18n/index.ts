import en from "./en.json"
import fr from "./fr.json"

/*
  `fr` complète le français fourni par Mercur : seules les phrases qu'il
  laisse en anglais sont reprises ici (états vides, infobulles…). Pour en
  corriger une autre, ajouter sa clé dans fr.json.
*/
const i18nResources = {
  en: {
    translation: en,
  },
  fr: {
    translation: fr,
  },
}

export default i18nResources
