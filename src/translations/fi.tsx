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
    unnamed: "Nimetön",
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
  SignIn: {
    title: "Kirjaudu sisään",
    password: "Salasana",
    submit: "Kirjaudu",
    errors: {
      invalid: "Väärä salasana, tai kutsulinkki ei ole voimassa.",
      locked:
        "Liian monta epäonnistunutta yritystä. Yritä hetken kuluttua uudelleen tai ota yhteyttä pelinjohtoon Discordissa.",
      revoked:
        "Kutsusi on peruttu. Jos uskot tämän olevan virhe, ota yhteyttä pelinjohtoon Discordissa.",
      generic: "Kirjautuminen epäonnistui. Yritä uudelleen.",
    },
  },
  AcceptInvitation: {
    title: "Hyväksy kutsu",
    invitedAs: "Sinut on kutsuttu nimellä",
    resetNotice:
      "Pelinjohto on nollannut salasanasi. Aseta uusi salasana jatkaaksesi. Vastauksesi ovat tallessa.",
    notSignUpNotice:
      "Kutsun hyväksyminen ei vielä tarkoita, että olisit ilmoittautunut tapahtumaan tai tullut valituksi pelaajaksi. Hyväksymisen jälkeen täytä ilmoittautumislomake.",
    bookmarkNotice:
      "Tallenna tämä sivu kirjanmerkiksi. Kutsulinkki on henkilökohtainen: kirjaudut sen ja tässä asettamasi salasanan avulla järjestelmään myöhemminkin.",
    privacyPrefix: "Ennen hyväksymistä voit lukea",
    privacyLink: "tietosuojaselosteen",
    name: "Nimi",
    nameHelp:
      "Näkyy muille kutsutuille ja pelinjohdolle. Voit muuttaa sitä myöhemmin ilmoittautumislomakkeella.",
    newPassword: "Uusi salasana",
    confirmPassword: "Vahvista salasana",
    submit: "Hyväksy kutsu",
    errors: {
      passwordsDiffer: "Salasanat eivät täsmää.",
      passwordRequired: "Anna salasana.",
      generic: "Kutsun hyväksyminen epäonnistui. Yritä uudelleen.",
    },
  },
  ChangePassword: {
    title: "Vaihda salasana",
    currentPassword: "Nykyinen salasana",
    newPassword: "Uusi salasana",
    confirmPassword: "Vahvista uusi salasana",
    submit: "Vaihda salasana",
    success: "Salasanasi on vaihdettu.",
    errors: {
      wrongPassword: "Nykyinen salasana on väärin.",
      passwordsDiffer: "Uudet salasanat eivät täsmää.",
      passwordRequired: "Anna uusi salasana.",
      generic: "Salasanan vaihtaminen epäonnistui. Yritä uudelleen.",
    },
  },
  PasswordStrength: {
    labels: ["Hyvin heikko", "Heikko", "Kohtalainen", "Vahva", "Hyvin vahva"],
  },
  Privacy: {
    title: "Tietosuoja",
    empty: "Pelinjohto ei ole vielä kirjoittanut tietosuojaselostetta.",
  },
  SignUp: {
    title: "Ilmoittautuminen",
    placeholder: "Ilmoittautumisnäkymä toteutetaan myöhemmässä vaiheessa.",
    notAccepted:
      "Hyväksy ensin kutsusi avaamalla henkilökohtainen kutsulinkkisi.",
  },
  Players: {
    title: "Pelaajat",
    columns: {
      status: "Tila",
      isGm: "Pelinjohto",
      createdAt: "Kutsuttu",
      actions: "Toiminnot",
    },
    gm: "Pelinjohto",
    copyInviteLink: {
      title: "Kopioi kutsulinkki",
      success: "Kutsulinkki on kopioitu leikepöydälle.",
    },
    total: (total: number) =>
      total === 1 ? "1 kutsuttu" : `${total} kutsuttua`,
  },
  VettingSurvey: {
    name: "Nimi",
    discordHandle: "Discord-käyttäjänimi",
  },
  UserStatus: {
    INVITED: "Kutsuttu",
    REVOKED: "Peruttu",
    ENTERED: "Mukana",
    SELECTED: "Valittu",
    NOT_SELECTED: "Ei valittu",
    WITHDRAWN: "Vetäytynyt",
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
