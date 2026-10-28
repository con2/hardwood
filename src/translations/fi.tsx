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
    notAccepted:
      "Hyväksy ensin kutsusi avaamalla henkilökohtainen kutsulinkkisi.",
    intro:
      "Ilmoittaudu tapahtumaan vastaamalla alla olevaan kyselyyn. Vastauksesi tallentuvat automaattisesti kirjoittaessasi, ja voit palata muokkaamaan niitä ilmoittautumisajan loppuun asti.",
    signupEndsAt: "Ilmoittautumisaika päättyy",
    onlyCompleted:
      "Ilmoittautumisajan päätyttyä pelaajavalinnoissa huomioidaan vain valmiiksi merkityt vastaukset.",
    preview:
      "Kun esikatselujakso alkaa, valmiit vastauksesi näkyvät Liputus-näkymässä muille vastauksensa valmiiksi merkinneille kutsutuille, ja heidän vastauksensa sinulle.",
    noEmail:
      "Järjestelmä ei lähetä sähköpostia. Pelinjohto on sinuun yhteydessä Discordissa, ja pelaajavalinnan tulos näytetään myös täällä.",
    completion: {
      title: "Onko vastauksesi valmis?",
      notCompleted: "Ei vielä valmis",
      notCompletedHelp: "Työstän vielä vastauksiani.",
      completed: "Valmis",
      completedHelp:
        "Olen tyytyväinen vastauksiini. Voin silti muokata niitä ilmoittautumisajan loppuun asti, eikä tilaa tarvitse sitä varten vaihtaa takaisin.",
      saveFailed:
        "Valmiustilan tallentaminen epäonnistui. Yritä uudelleen tai lataa sivu uudelleen.",
    },
    missingRequired:
      "Olet merkinnyt vastauksesi valmiiksi, mutta näihin pakollisiin kysymyksiin ei ole vastattu:",
    readOnly: {
      notScheduled:
        "Ilmoittautumisaikaa ei ole vielä päätetty. Voit vastata kyselyyn, kun ilmoittautuminen alkaa.",
      notOpen: "Ilmoittautuminen ei ole vielä alkanut. Se alkaa",
      closed:
        "Ilmoittautumisaika on päättynyt. Vastauksesi näkyvät alla, eikä niitä voi enää muokata.",
      withdrawn:
        "Olet vetäytynyt tapahtumasta. Vastauksesi näkyvät alla, eikä niitä voi enää muokata.",
      notEntered: "Vastauksiasi ei voi muokata.",
    },
  },
  Autosave: {
    idle: "Vastauksesi tallentuvat automaattisesti.",
    saving: "Tallennetaan…",
    saved: "Tallennettu klo",
    error:
      "Tallentaminen epäonnistui. Sitä yritetään uudelleen seuraavan muutoksesi yhteydessä. Jos ongelma toistuu, kopioi viimeisin vastauksesi talteen ja lataa sivu uudelleen.",
    forbidden:
      "Vastauksiasi ei voi enää tallentaa: ilmoittautumisaika on ehkä päättynyt. Lataa sivu uudelleen.",
  },
  StatusBanner: {
    selected:
      "Sinut on valittu pelaajaksi. Onneksi olkoon! Pelinjohto on sinuun yhteydessä Discordissa.",
    notSelected:
      "Valitettavasti sinua ei tällä kertaa valittu pelaajaksi. Kiitos ilmoittautumisestasi!",
    withdrawn: "Vetäydyit tapahtumasta tai pelinjohto poisti sinut.",
  },
  ComingSoon: {
    practical: "Käytännön asiat -näkymä toteutetaan myöhemmässä vaiheessa.",
  },
  Flagging: {
    title: "Liputus",
    intro:
      "Alla ovat muiden kutsuttujen valmiit ilmoittautumisvastaukset. Valitse kullekin henkilölle lippu, joka kertoo, miten suhtaudut pelaamiseen hänen kanssaan. Liputuksesi näkyvät vain sinulle ja pelinjohdolle.",
    coloursTitle: "Mitä liput tarkoittavat",
    choices: {
      RED: "Punainen",
      YELLOW: "Keltainen",
      NEUTRAL: "Neutraali",
      GREEN: "Vihreä",
    },
    definitions: {
      RED: "En halua osallistua, jos tämä henkilö osallistuu.",
      YELLOW:
        "Voin osallistua, vaikka tämä henkilö osallistuu, mutta toivon, että pelaamme yhdessä mahdollisimman vähän.",
      NEUTRAL: "Oletusvalinta.",
      GREEN:
        "Olen avoin tutkimaan intensiivisen tai intiimin pelin mahdollisuutta tämän henkilön kanssa. Molemminpuoliset vihreät liput näytetään myös hänelle.",
    },
    safety:
      "Liputuksen lisäksi: jos koet, että joku tällä sivulla oleva henkilö on vaaraksi tapahtuman osallistujien turvallisuudelle, ota yhteyttä suoraan pelinjohtoon.",
    gmsSeeFlags:
      "Pelinjohto näkee kaikki liput, myös itseensä kohdistuvat, jos pelinjohtaja itse pelaa.",
    modes: {
      preview:
        "Liputus ei ole vielä alkanut. Voit jo lukea muiden vastauksia. Liputus alkaa",
      previewNotScheduled:
        "Liputuksen alkamisaikaa ei ole vielä päätetty. Voit jo lukea muiden vastauksia.",
      flagging: "Liputus on käynnissä. Valintasi tallentuvat heti.",
      flaggingEndsAt: "Liputus päättyy",
      readonly:
        "Liputus on päättynyt. Liputuksesi näkyvät alla, eikä niitä voi enää muuttaa.",
      namesOnly:
        "Alla ovat henkilöt, jotka liputit, ja antamasi liput. Muiden vastaukset eivät enää näy sinulle.",
    },
    completion: {
      title: "Oletko käynyt kaikki läpi?",
      notCompleted: "Ei vielä valmis",
      notCompletedHelp: "Käyn vielä vastauksia läpi.",
      completed: "Valmis",
      completedHelp:
        "Olen käynyt kaikki läpi. Ne, joille en ole antanut lippua, ovat neutraaleja. Voin silti muuttaa liputuksiani liputuksen päättymiseen asti.",
      saveFailed:
        "Valmiustilan tallentaminen epäonnistui. Yritä uudelleen tai lataa sivu uudelleen.",
    },
    yourFlag: "Lippusi",
    mutualGreen: "Molemminpuolinen vihreä",
    mutualGreenHelp: "Annoitte toisillenne vihreän lipun.",
    saving: "Tallennetaan…",
    saved: "Tallennettu",
    saveFailed: "Tallentaminen epäonnistui. Yritä uudelleen.",
    forbidden: "Liputuksia ei voi enää muuttaa. Lataa sivu uudelleen.",
    empty: "Muita valmiita vastauksia ei ole vielä.",
    namesOnlyEmpty: "Et liputtanut ketään.",
  },
  Flags: {
    title: "Liput",
    warning:
      "Tämä on järjestelmän arkaluonteisinta tietoa. Katso sitä vain silloin, kun sinun on tarpeen, äläkä jätä sitä näkyviin näytölle.",
    backToPlayers: "Takaisin pelaajiin",
    backToMatrix: "Takaisin lippumatriisiin",
    matrixHelp:
      "Liputtajat riveillä, liputetut sarakkeissa. Napsauta nimeä nähdäksesi henkilön liput listoina.",
    flagger: "Liputtaja",
    completed: "Liputus merkitty valmiiksi",
    colours: {
      RED: "Punainen",
      YELLOW: "Keltainen",
      GREEN: "Vihreä",
    },
    totals: {
      title: "Yhteenveto",
      person: "Henkilö",
      received: "Saadut",
      given: "Annetut",
    },
    person: {
      status: "Tila",
      inbound: "Saadut liput",
      outbound: "Annetut liput",
      none: "Ei yhtään.",
    },
    empty: "Kukaan ei ole vielä hyväksynyt kutsuaan.",
  },
  Players: {
    title: "Pelaajat",
    columns: {
      status: "Tila",
      isGm: "Pelinjohto",
      name: "Nimi",
      discordHandle: "Discord",
      characterName: "Hahmo",
      characterGroup: "Ryhmä",
      feeCategory: "Maksuluokka",
      feePaid: "Maksettu",
      vetting: "Ilmoittautuminen",
      flagging: "Liputus",
      practical: "Käytännön asiat",
      actions: "Toiminnot",
    },
    gm: "Pelinjohto",
    noName: "(ei vielä nimeä)",
    copyInviteLink: {
      title: "Kopioi kutsulinkki",
      success: "Kutsulinkki on kopioitu leikepöydälle.",
    },
    total: (total: number) =>
      total === 1 ? "1 kutsuttu" : `${total} kutsuttua`,
    filters: {
      status: "Tila",
      characterGroup: "Hahmoryhmä",
      all: "Kaikki",
      noGroup: "Ei ryhmää",
      submit: "Suodata",
    },
    links: {
      createInvites: "Luo kutsuja",
      flags: "Liput",
    },
    responseState: {
      none: "Ei vastausta",
      inProgress: "Kesken",
      completed: "Valmis",
    },
    cells: {
      saving: "Tallennetaan…",
      saved: "Tallennettu",
      error: "Tallennus epäonnistui",
      noChoice: "—",
      status: "Tila",
      characterName: "Hahmon nimi",
      feePaid: "Pelimaksu maksettu",
    },
    resetPassword: {
      title: "Nollaa salasana",
      confirm:
        "Kutsutulle luodaan uusi alkusalasana. Nykyinen salasana lakkaa toimimasta heti. Kutsulinkki pysyy samana, ja kaikki vastaukset ja liput säilyvät. Seuraavalla kirjautumisella kutsuttu asettaa uuden salasanan.",
      submit: "Nollaa salasana",
      cancel: "Peruuta",
      close: "Sulje",
      done: "Salasana on nollattu. Lähetä kutsutulle linkki ja uusi alkusalasana Discordissa. Salasana näytetään vain tämän kerran.",
      link: "Kutsulinkki",
      initialPassword: "Alkusalasana",
      failed: "Salasanan nollaus epäonnistui.",
      copyLink: {
        title: "Kopioi linkki",
        success: "Kutsulinkki on kopioitu leikepöydälle.",
      },
      copyPassword: {
        title: "Kopioi salasana",
        success: "Salasana on kopioitu leikepöydälle.",
      },
    },
    delete: {
      title: "Poista",
      confirm:
        "Kaikki kutsutun jäljet poistetaan järjestelmästä: käyttäjätiedot ja avaimet, vastaukset ilmoittautumis-, liputus- ja käytännön asioiden kyselyihin, pelinjohdon asettamat tiedot sekä muiden hänestä tekemät liputukset. Muiden vapaatekstivastauksissa olevia mainintoja ei poisteta. Poistoa ei voi perua.",
      submit: "Poista pysyvästi",
      cancel: "Peruuta",
    },
    casting: {
      completedAt: "Valinnat julkaistu",
      notCompleted:
        "Valintoja ei ole vielä julkaistu. Ne näkyvät vain pelinjohdolle.",
      complete: {
        title: "Julkaise valinnat",
        confirm:
          "Jokainen kutsuttu näkee oman valintatuloksensa (valittu tai ei valittu) jokaisen näkymän yläreunassa. Valittujen pelaajien keskinäiset vihreät liput johdetaan ja näytetään molemmille osapuolille. Kutsutut, joiden tila on Mukana (ei päätöstä), eivät saa tulosta. Julkaisun voi perua.",
        submit: "Julkaise valinnat",
        cancel: "Peruuta",
      },
      revert: {
        title: "Peru valintojen julkaisu",
        confirm:
          "Valintatulokset piilotetaan kutsutuilta uudelleen, ja johdetut keskinäiset vihreät liput poistetaan. Itse valinnat säilyvät.",
        submit: "Peru julkaisu",
        cancel: "Peruuta",
      },
    },
    errors: {
      notFound: "Kutsuttua ei enää ole.",
      invalidTransition: "Tilaa ei voi muuttaa näin.",
      notWithdrawn: "Vain vetäytyneet kutsutut voi poistaa.",
      invalid: "Tarkista arvo.",
      self: "Vaihda oma salasanasi profiilivalikosta.",
      generic: "Jokin meni vikaan.",
    },
    invite: {
      title: "Luo kutsuja",
      intro:
        "Liitä kutsuttavien Discord-tunnukset, yksi riville. Jokainen saa henkilökohtaisen kutsulinkin ja alkusalasanan, jotka toimitat hänelle Discordissa. Tunnus esitäytetään kutsutun ilmoittautumislomakkeeseen.",
      handles: "Discord-tunnukset",
      helpText: "Yksi riville. Tyhjät rivit ja toistot ohitetaan.",
      submit: "Luo kutsut",
      back: "Takaisin pelaajiin",
      created: "Kutsut luotu",
      passwordsOnce:
        "Alkusalasanat näytetään vain nyt. Kopioi ne ennen kuin poistut sivulta. Linkit voi kopioida myöhemmin uudelleen Pelaajat-näkymästä.",
      empty: "Anna vähintään yksi Discord-tunnus.",
      tooMany: "Liian monta kerralla: enintään 200 tunnusta.",
      failed: "Kutsujen luonti epäonnistui. Yhtään kutsua ei luotu.",
      columns: {
        discordHandle: "Discord-tunnus",
        link: "Kutsulinkki",
        initialPassword: "Alkusalasana",
      },
      copyLink: {
        title: "Kopioi linkki",
        success: "Kutsulinkki on kopioitu leikepöydälle.",
      },
      copyPassword: {
        title: "Kopioi salasana",
        success: "Salasana on kopioitu leikepöydälle.",
      },
    },
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
        "Tapahtuman vaiheet etenevät näiden aikojen mukaan. Voit muuttaa niitä milloin tahansa, myös avataksesi jo päättyneen jakson uudelleen. Jätä aika tyhjäksi, jos sitä ei ole vielä päätetty: jakso, jolta puuttuu alkamisaika, on suljettu, ja jakso, jolta puuttuu päättymisaika, pysyy alettuaan auki.",
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
