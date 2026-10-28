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
  SchemaForm: {
    submit: "Lähetä",
    noAnswer: "Ei vastausta",
  },
  FormEditor: {
    editField: "Muokkaa kenttää",
    moveUp: "Siirrä ylös",
    moveDown: "Siirrä alas",
    removeField: "Poista kenttä",
    addFieldAbove: "Lisää kenttä ylle",
    addField: "Lisää kenttä",
    saveStatus: {
      idle: "Muutokset tallentuvat automaattisesti.",
      saving: "Tallennetaan…",
      saved: "Kaikki muutokset on tallennettu.",
      error:
        "Tallentaminen epäonnistui. Tarkista viimeisin muutos ja yritä uudelleen, tai lataa sivu uudelleen.",
    },
    errors: {
      invalidSlug:
        "Teknisessä nimessä saa olla vain pieniä kirjaimia a–z, numeroita 0–9 ja alaviivoja _.",
      duplicateSlug: "Toisella kentällä on jo tämä tekninen nimi.",
      invalidChoices:
        "Tarkista vaihtoehdot: jokaisella rivillä on oltava tekninen nimi (a–z, 0–9, -, _) ja teksti, eikä kahdella vaihtoehdolla saa olla samaa teknistä nimeä. Vaihtoehtoja on oltava ainakin yksi.",
      invalidField: "Tarkista kentän tiedot.",
    },

    editFieldForm: {
      slug: {
        title: "Tekninen nimi",
        helpText:
          "Kentän tekninen nimi. Ei näytetä loppukäyttäjälle. Sallitut merkit: pienet kirjaimet a-z (ei ääkköset åäö), numerot 0-9 ja alaviiva _.",
      },
      title: {
        title: "Otsikko",
        helpText:
          "Ihmisluettava otsikko. Näytetään loppukäyttäjälle. Mikäli otsikkoa ei ole asetettu, sen tilalla näytetään kentän tekninen nimi.",
      },
      helpText: {
        title: "Ohjeteksti",
        helpText: "Näytetään kentän alla.",
      },
      required: {
        title: "Pakollinen",
        choice: "Tähän kenttään on vastattava",
      },
      choices: {
        title: "Vaihtoehdot",
        helpText:
          "Yksi vaihtoehto riviä kohden: `tekninen-nimi: Käyttäjälle näytettävä teksti`. Jokaisella vaihtoehdolla on oltava oma tekninen nimi (a-z, 0-9, -). Esimerkki:\n\n```\nyes: Kyllä\nno: Ei\n```\n\nÄlä muuta teknisiä nimiä, kun vastauksia on jo tullut.",
      },
      questions: {
        title: "Kysymykset",
        helpText:
          "Yksi kysymys riviä kohden: `tekninen-nimi: Käyttäjälle näytettävä teksti`. Jokaisella kysymyksellä on oltava oma tekninen nimi (a-z, 0-9, -). Esimerkki:\n\n```\nfood: Millaista ruoka oli?\nmusic: Millaista musiikki oli?\n```\n\nÄlä muuta teknisiä nimiä, kun vastauksia on jo tullut.",
      },
      presentation: {
        title: "Esitystapa",
        radio: "Valintanapit",
        dropdown: "Pudotusvalikko",
      },
      maxLength: {
        title: "Enimmäispituus",
        helpText:
          "Vastaajan syöttämän tekstin enimmäispituus merkkeinä. Jätä tyhjäksi, jos rajaa ei ole.",
      },
      minValue: {
        title: "Pienin sallittu arvo",
        helpText: "Jätä tyhjäksi, jos alarajaa ei ole.",
      },
      maxValue: {
        title: "Suurin sallittu arvo",
        helpText: "Jätä tyhjäksi, jos ylärajaa ei ole.",
      },
    },

    fieldTypes: {
      SingleLineText: "Yksirivinen tekstikenttä",
      MultiLineText: "Monirivinen tekstikenttä",
      MarkdownText: "Monirivinen tekstikenttä (Markdown)",
      StaticText: "Kiinteä teksti",
      SingleSelect: "Valinta",
      MultiSelect: "Monivalinta",
      RadioMatrix: "Valintamatriisi",
      NumberField: "Numero",
    },

    removeFieldModal: {
      title: "Vahvista kentän poisto",
      message: "Poistetaanko kenttä?",
      actions: {
        submit: "Poista",
        cancel: "Peruuta",
      },
    },

    editFieldModal: {
      title: "Muokkaa kenttää",
      actions: {
        submit: "Tallenna",
        cancel: "Peruuta",
      },
    },
  },
  Structure: {
    title: "Rakenne",
    tabs: {
      vetting: "Ilmoittautumislomake",
      practical: "Käytännön asiat -lomake",
      choices: "Vaihtoehdot",
      timeline: "Aikataulu",
      privacyPolicy: "Tietosuojaseloste",
    },
    saved: "Muutokset on tallennettu.",
    errors: {
      invalid: "Tarkista tiedot ja yritä uudelleen.",
      generic: "Tallentaminen epäonnistui. Yritä uudelleen.",
    },
    vetting: {
      intro:
        "Kutsutut ilmoittautuvat täyttämällä tämän lomakkeen. Valmiiksi merkityt vastaukset näkyvät esikatselun alettua niille kutsutuille, jotka ovat itse merkinneet vastauksensa valmiiksi. Kenttiä voi muuttaa, vaikka vastauksia olisi jo tullut: poistettujen kenttien vastaukset säilyvät mutta eivät näy, ja uudet kentät näkyvät vastaamattomina.",
      magicFieldsTitle: "Erityismerkityksiset kentät",
      magicFields:
        "Kenttä, jonka tekninen nimi on `name`, on kutsutun nimi: se täytetään valmiiksi kutsua hyväksyttäessä annetulla nimellä, ja se näkyy kaikkialla järjestelmässä. Kenttä `discord_handle` täytetään valmiiksi sillä Discord-käyttäjänimellä, jolle kutsu on luotu. Molemmat näkyvät sarakkeina Pelaajat-näkymässä.",
      missingMagicFields:
        "Ilmoittautumislomakkeelta puuttuu näitä erityismerkityksisiä kenttiä. Lisää ne takaisin täsmälleen näillä teknisillä nimillä:",
    },
    practical: {
      intro:
        "Käytännön asiat -lomakkeella kysytään valituilta pelaajilta käytännön tietoja. Vastaukset näkyvät vain pelinjohdolle ja vastaajalle itselleen.",
    },
    choices: {
      intro:
        "Pelaajien ominaisuuksien vaihtoehdot, joita pelinjohto asettaa Pelaajat-näkymässä. Yksi vaihtoehto riviä kohden: `tekninen-nimi: Näytettävä teksti`. Älä muuta teknisiä nimiä, kun ne ovat jo käytössä.",
      characterGroups: {
        title: "Hahmoryhmät",
        helpText: "Esimerkiksi `opettajat: Opettajat`.",
      },
      feeCategories: {
        title: "Pelimaksuluokat",
        helpText: "Esimerkiksi `normaali: Normaali pelimaksu (100 €)`.",
      },
      invalid:
        "Tarkista vaihtoehdot: jokaisella rivillä on oltava tekninen nimi (a–z, 0–9, -, _) ja teksti, eikä kahdella vaihtoehdolla saa olla samaa teknistä nimeä.",
    },
    timeline: {
      intro:
        "Tapahtuman vaiheet etenevät näiden aikojen mukaan. Voit muuttaa niitä milloin tahansa, myös avataksesi jo päättyneen jakson uudelleen. Jätä aika tyhjäksi, jos sitä ei ole vielä päätetty: jakso, jolta puuttuu alkamis- tai päättymisaika, on suljettu.",
      timezone: "Ajat ovat aikavyöhykkeellä",
      fields: {
        signupStartsAt: {
          title: "Ilmoittautuminen alkaa",
          helpText:
            "Tästä alkaen kutsutut voivat täyttää ja muokata ilmoittautumislomaketta.",
        },
        previewStartsAt: {
          title: "Esikatselu alkaa",
          helpText:
            "Tästä alkaen vastauksensa valmiiksi merkinneet kutsutut näkevät muiden valmiit vastaukset.",
        },
        signupEndsAt: {
          title: "Ilmoittautuminen päättyy",
          helpText:
            "Ilmoittautumislomaketta ei voi enää muokata. Valinnoissa huomioidaan vain valmiiksi merkityt vastaukset.",
        },
        flaggingStartsAt: {
          title: "Liputus alkaa",
          helpText:
            "Tästä alkaen kutsutut voivat liputtaa toisiaan. Yleensä sama kuin ilmoittautumisen päättyminen.",
        },
        flaggingEndsAt: {
          title: "Liputus päättyy",
          helpText: "Lippuja ei voi enää muuttaa.",
        },
        practicalStartsAt: {
          title: "Käytännön asiat -lomake avautuu",
          helpText:
            "Tästä alkaen pelaajat voivat täyttää ja muokata käytännön asiat -lomaketta.",
        },
        practicalEndsAt: {
          title: "Käytännön asiat -lomake sulkeutuu",
          helpText: "Käytännön asiat -lomaketta ei voi enää muokata.",
        },
      },
    },
    privacyPolicy: {
      intro:
        "Tietosuojaseloste näytetään kaikille kirjautuneille, myös kutsutuille, jotka eivät ole vielä hyväksyneet kutsuaan. Toisin kuin muita järjestelmän tietoja, sitä ei tallenneta salattuna. Kirjoita se Markdown-muodossa.",
      editor: "Tietosuojaseloste",
      preview: "Tallennetun version esikatselu",
      empty: "Tietosuojaseloste on tyhjä.",
    },
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
