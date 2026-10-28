import type { Translations } from "./en";

const translations: Translations = {
  common: {
    appName: "Larppi-ilmoittautuminen",
    actions: {
      save: "Tallenna",
      cancel: "Peruuta",
      close: "Sulje",
    },
  },
  AppBar: {
    toggleNavigation: "Näytä tai piilota valikko",
    signUp: "Ilmoittautuminen",
    flagging: "Liputus",
    practical: "Käytännön asiat",
    privacy: "Tietosuoja",
    structure: "Rakenne",
    players: "Pelaajat",
    profile: "Profiili",
    changePassword: "Vaihda salasana",
    signOut: "Kirjaudu ulos",
    theme: {
      dark: "Tumma",
      light: "Vaalea",
      system: "Järjestelmän mukaan",
    },
  },
  Theme: {
    title: "Teema",
  },
  Errors: {
    notFound: "Sivua ei löytynyt.",
    generic: "Jokin meni pieleen.",
  },
  HomePage: {
    redirecting: "Ohjataan eteenpäin…",
  },
};

export default translations;
