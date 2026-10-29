import type { Translations } from "./en";

const translations: Translations = {
  common: {
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
    unnamed: "Nimetön",
    changePassword: "Vaihda salasana",
    signOut: "Kirjaudu ulos",
    signOutEverywhere: "Kirjaudu ulos kaikkialta",
    theme: {
      dark: "Tumma",
      light: "Vaalea",
      system: "Järjestelmän mukaan",
    },
  },
  SignIn: {
    title: "Kirjaudu sisään",
    intro:
      "Tämä on larpin ilmoittautumisjärjestelmä. Järjestelmään pääsee vain kutsusta: käyttäjätunnuksia ei ole, vaan jokainen kutsuttu kirjautuu omalla henkilökohtaisella kutsulinkillään.",
    linkHint:
      "Käytä Discordissa saamaasi linkkiä ja sen mukana tullutta salasanaa tai salasanaa, jonka asetit hyväksyessäsi kutsun.",
    password: "Salasana",
    submit: "Kirjaudu",
    forgotPassword:
      "Jos olet unohtanut salasanasi, pyydä pelinjohtoa nollaamaan se Discordissa.",
    lockedUntil: "Voit yrittää uudelleen aikaisintaan",
    errors: {
      invalid: "Salasana on väärä tai kutsulinkki ei ole voimassa.",
      locked: "Liian monta epäonnistunutta kirjautumisyritystä.",
      revoked:
        "Kutsusi on peruttu, joten et voi kirjautua sisään. Jos tämä on mielestäsi virhe, ota yhteyttä pelinjohtoon Discordissa.",
      generic: "Kirjautuminen epäonnistui. Yritä uudelleen.",
    },
  },
  AcceptInvitation: {
    title: "Hyväksy kutsu",
    invitedAs: "Sinut on kutsuttu Discord-tunnuksella",
    resetNotice:
      "Pelinjohto on nollannut salasanasi. Aseta uusi salasana, niin pääset jatkamaan. Vastauksesi ja lippusi ovat tallessa.",
    notSignUpNotice:
      "Kutsun hyväksyminen ei vielä tarkoita, että olisit ilmoittautunut tapahtumaan tai tullut valituksi pelaajaksi. Kun olet hyväksynyt kutsun, täytä vielä ilmoittautumislomake.",
    bookmarkNotice:
      "Lisää tämä sivu kirjanmerkkeihin. Kutsulinkki on henkilökohtainen: kirjaudut myöhemminkin järjestelmään sen ja tässä asettamasi salasanan avulla.",
    privacyPrefix: "Ennen hyväksymistä voit lukea",
    privacyLink: "tietosuojaselosteen",
    name: "Nimi",
    nameHelp:
      "Näkyy muille kutsutuille ja pelinjohdolle. Voit muuttaa sitä myöhemmin ilmoittautumislomakkeella.",
    newPassword: "Uusi salasana",
    confirmPassword: "Salasana uudelleen",
    submit: "Hyväksy kutsu",
    errors: {
      passwordsDiffer: "Salasanat eivät täsmää.",
      passwordRequired: "Anna salasana.",
      tooWeak:
        "Salasana on liian heikko. Valitse pidempi tai vaikeammin arvattava salasana.",
      generic: "Kutsun hyväksyminen epäonnistui. Yritä uudelleen.",
    },
  },
  ChangePassword: {
    title: "Vaihda salasana",
    currentPassword: "Nykyinen salasana",
    newPassword: "Uusi salasana",
    confirmPassword: "Uusi salasana uudelleen",
    submit: "Vaihda salasana",
    success: "Salasanasi on vaihdettu.",
    errors: {
      wrongPassword: "Nykyinen salasana on väärä.",
      passwordsDiffer: "Uudet salasanat eivät täsmää.",
      passwordRequired: "Anna uusi salasana.",
      tooWeak:
        "Uusi salasana on liian heikko. Valitse pidempi tai vaikeammin arvattava salasana.",
      generic: "Salasanan vaihtaminen epäonnistui. Yritä uudelleen.",
    },
  },
  PasswordStrength: {
    labels: [
      "Erittäin heikko",
      "Heikko",
      "Kohtalainen",
      "Vahva",
      "Erittäin vahva",
    ],
    belowRequired: "liian heikko hyväksyttäväksi",
  },
  Privacy: {
    title: "Tietosuoja",
    empty: "Pelinjohto ei ole vielä kirjoittanut tietosuojaselostetta.",
    dangerZone: {
      title: "Vaaravyöhyke",
      withdrawTitle: "Vetäydy tapahtumasta",
      explanation:
        "Voit vetäytyä milloin tahansa, eikä sinun tarvitse kertoa syytä. Jos vetäydyt, ilmoittautumisesi ja lippusi lukitaan, etkä voi enää muokata niitä. Jatkossa ne näkyvät vain sinulle ja pelinjohdolle, eikä sinua enää näytetä muille kutsutuille Liputus-näkymässä.",
      undoNotice:
        "Vain pelinjohto voi perua vetäytymisen. Jos haluat, että tietosi poistetaan järjestelmästä kokonaan, voit vetäytymisen jälkeen pyytää sitä pelinjohdolta Discordissa.",
      withdraw: "Vetäydy",
      confirmTitle: "Haluatko varmasti vetäytyä tapahtumasta?",
      confirmText:
        "Vastauksesi lukitaan, etkä ole enää mukana ilmoittautumisessa. Vain pelinjohto voi perua vetäytymisen.",
      confirm: "Kyllä, vetäydyn",
      failed:
        "Vetäytyminen epäonnistui. Lataa sivu uudelleen ja yritä uudestaan.",
      alreadyWithdrawn:
        "Olet vetäytynyt tapahtumasta. Ota yhteyttä pelinjohtoon Discordissa, jos haluat perua vetäytymisen tai poistattaa tietosi kokonaan.",
    },
  },
  SignUp: {
    title: "Ilmoittautuminen",
    notAccepted:
      "Hyväksy ensin kutsusi avaamalla henkilökohtainen kutsulinkkisi.",
    intro:
      "Ilmoittaudu tapahtumaan vastaamalla alla olevaan kyselyyn. Vastauksesi tallentuvat automaattisesti kirjoittaessasi, ja voit palata muokkaamaan niitä ilmoittautumisajan loppuun asti.",
    signupEndsAt: "Ilmoittautumisaika päättyy",
    onlyCompleted:
      "Kun ilmoittautumisaika päättyy, pelaajavalinnoissa huomioidaan vain valmiiksi merkityt vastaukset.",
    preview:
      "Kun esikatselu alkaa, valmiiksi merkitty vastauksesi näkyy Liputus-näkymässä niille kutsutuille, jotka ovat merkinneet omansa valmiiksi, ja heidän vastauksensa näkyvät sinulle.",
    noFields:
      "Pelinjohto ei ole vielä lisännyt ilmoittautumislomakkeelle kysymyksiä. Palaa asiaan myöhemmin.",
    completion: {
      title: "Onko vastauksesi valmis?",
      notCompleted: "Ei vielä valmis",
      notCompletedHelp: "Työstän vielä vastauksiani.",
      completed: "Valmis",
      completedHelp:
        "Olen tyytyväinen vastauksiini. Voin silti muokata niitä ilmoittautumisajan loppuun asti, eikä tilaa tarvitse sitä varten vaihtaa takaisin.",
      saveFailed:
        "Tilan tallentaminen epäonnistui. Yritä uudelleen tai lataa sivu uudestaan.",
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
      "Vastauksiasi ei voi enää tallentaa: kysely on ehkä sulkeutunut. Lataa sivu uudelleen.",
  },
  StatusBanner: {
    selected:
      "Sinut on valittu pelaajaksi. Onneksi olkoon! Pelinjohto on sinuun yhteydessä Discordissa.",
    notSelected:
      "Valitettavasti sinua ei tällä kertaa valittu pelaajaksi. Kiitos ilmoittautumisestasi!",
    withdrawn:
      "Olet vetäytynyt tapahtumasta tai pelinjohto on poistanut sinut siitä.",
  },
  Practical: {
    title: "Käytännön asiat",
    intro:
      "Sinut on valittu pelaajaksi, joten vastaathan alla olevaan käytännön kyselyyn. Vastauksesi tallentuvat automaattisesti kirjoittaessasi, ja ne näkyvät vain sinulle ja pelinjohdolle.",
    practicalEndsAt: "Käytännön kysely sulkeutuu",
    noFields:
      "Pelinjohto ei ole vielä lisännyt käytännön kyselyyn kysymyksiä. Palaa asiaan myöhemmin.",
    completion: {
      title: "Onko vastauksesi valmis?",
      notCompleted: "Ei vielä valmis",
      notCompletedHelp: "Työstän vielä vastauksiani.",
      completed: "Valmis",
      completedHelp:
        "Olen tyytyväinen vastauksiini. Voin silti muokata niitä kyselyn sulkeutumiseen asti, eikä tilaa tarvitse sitä varten vaihtaa takaisin.",
      saveFailed:
        "Tilan tallentaminen epäonnistui. Yritä uudelleen tai lataa sivu uudestaan.",
    },
    missingRequired:
      "Olet merkinnyt vastauksesi valmiiksi, mutta näihin pakollisiin kysymyksiin ei ole vastattu:",
    readOnly: {
      closed:
        "Käytännön kysely on sulkeutunut. Vastauksesi näkyvät alla, eikä niitä voi enää muokata.",
      withdrawn:
        "Olet vetäytynyt tapahtumasta. Vastauksesi näkyvät alla, eikä niitä voi enää muokata.",
      notEditable: "Vastauksiasi ei voi muokata.",
    },
    closed: {
      withdrawn:
        "Olet vetäytynyt tapahtumasta, joten käytännön kysely ei ole käytettävissäsi.",
      notSelected:
        "Käytännön kysely on vain pelaajavalinnoissa valituille pelaajille.",
      beforeCasting:
        "Käytännön kysely on pelaajavalinnoissa valituille pelaajille. Jos sinut valitaan, voit vastata siihen täällä.",
      notStarted: "Käytännön kysely ei ole vielä avautunut.",
      opening: {
        opensAt: "Kysely avautuu",
        notScheduled: "Pelinjohto ei ole vielä päättänyt sen avautumisaikaa.",
      },
    },
  },
  Flagging: {
    title: "Liputus",
    intro:
      "Alla ovat muiden kutsuttujen valmiit ilmoittautumisvastaukset. Valitse kullekin henkilölle lippu, joka kertoo, miten suhtaudut pelaamiseen hänen kanssaan. Lippusi näkyvät vain sinulle ja pelinjohdolle.",
    coloursTitle: "Mitä liput tarkoittavat",
    defaultFlags: {
      red: {
        title: "Punainen",
        definition: "En halua osallistua, jos tämä henkilö osallistuu.",
      },
      yellow: {
        title: "Keltainen",
        definition:
          "Voin osallistua, vaikka tämä henkilö osallistuu, mutta toivon, että pelaamme yhdessä mahdollisimman vähän.",
      },
      neutral: {
        title: "Neutraali",
        definition: "Oletus: ei erityistä toivetta suuntaan tai toiseen.",
      },
      green: {
        title: "Vihreä",
        definition:
          "Olen avoin intensiivisen tai intiimin pelin mahdollisuudelle tämän henkilön kanssa. Jos hänkin antaa sinulle vihreän lipun, näette sen molemmat pelaajavalintojen jälkeen, mikäli teidät molemmat valitaan.",
      },
    },
    safety:
      "Jos koet, että joku tällä sivulla oleva henkilö on vaaraksi tapahtuman osallistujien turvallisuudelle, ota liputuksen lisäksi yhteyttä suoraan pelinjohtoon.",
    gmsSeeFlags:
      "Pelinjohto näkee kaikki liput, myös ne, jotka on annettu pelaaville pelinjohtajille itselleen.",
    modes: {
      preview:
        "Liputus ei ole vielä alkanut. Voit jo lukea muiden vastauksia. Liputus alkaa",
      previewNotScheduled:
        "Liputuksen alkamisaikaa ei ole vielä päätetty. Voit jo lukea muiden vastauksia.",
      flagging: "Liputus on käynnissä. Valintasi tallentuvat heti.",
      flaggingEndsAt: "Liputus päättyy",
      readonly:
        "Liputus on päättynyt. Lippusi näkyvät alla, eikä niitä voi enää muuttaa.",
      namesOnly:
        "Alla ovat ne, joille annoit lipun, ja antamasi liput. Muiden vastaukset eivät enää näy sinulle.",
    },
    closed: {
      withdrawn:
        "Olet vetäytynyt tapahtumasta, joten liputus ei ole käytettävissäsi.",
      signupClosed:
        "Liputus on vain niille, jotka merkitsivät ilmoittautumisvastauksensa valmiiksi ennen ilmoittautumisen päättymistä.",
      notCompleted:
        "Liputus avautuu sinulle, kun olet merkinnyt vastauksesi valmiiksi Ilmoittautuminen-näkymässä.",
      notStarted: "Liputus ei ole vielä avautunut.",
      opening: {
        opensAt: "Muiden vastausten lukeminen alkaa",
        notScheduled: "Pelinjohto ei ole vielä päättänyt sen alkamisaikaa.",
      },
    },
    completion: {
      title: "Oletko käynyt kaikki läpi?",
      notCompleted: "Ei vielä valmis",
      notCompletedHelp: "Käyn vielä vastauksia läpi.",
      completed: "Valmis",
      completedHelp:
        "Olen käynyt kaikki läpi. Ne, joille en ole antanut lippua, ovat neutraaleja. Voin silti muuttaa lippujani liputuksen päättymiseen asti.",
      saveFailed:
        "Tilan tallentaminen epäonnistui. Yritä uudelleen tai lataa sivu uudestaan.",
    },
    yourFlag: "Lippusi",
    mutualGreen: "Molemminpuolinen vihreä",
    mutualGreenHelp: "Annoitte toisillenne vihreän lipun.",
    saving: "Tallennetaan…",
    saved: "Tallennettu",
    saveFailed: "Tallentaminen epäonnistui. Yritä uudelleen.",
    forbidden: "Lippuja ei voi enää muuttaa. Lataa sivu uudelleen.",
    empty: "Muiden valmiita vastauksia ei ole vielä.",
    namesOnlyEmpty: "Et antanut kenellekään lippua.",
  },
  Flags: {
    title: "Liput",
    warning:
      "Tämä on järjestelmän arkaluonteisinta tietoa. Katso sitä vain, kun se on tarpeen, äläkä jätä sitä näkyviin näytölle.",
    backToPlayers: "Takaisin pelaajiin",
    backToMatrix: "Takaisin lippumatriisiin",
    matrixHelp:
      "Liputtajat riveillä, liputetut sarakkeissa. Napsauta nimeä nähdäksesi henkilön liput listoina.",
    flagger: "Liputtaja",
    completed: "Liputus merkitty valmiiksi",
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
    noFlags: "Kukaan ei ole vielä antanut lippuja.",
  },
  Players: {
    title: "Pelaajat",
    columns: {
      status: "Tila",
      isGm: "Pelinjohtaja",
      name: "Nimi",
      discordHandle: "Discord",
      characterName: "Hahmo",
      characterGroup: "Ryhmä",
      feeCategory: "Maksuluokka",
      feePaid: "Maksettu",
      vetting: "Ilmoittautuminen",
      flagging: "Liputus",
      practical: "Käytännön kysely",
      actions: "Toiminnot",
    },
    gm: "Pelinjohtaja",
    noName: "(ei vielä nimeä)",
    noInvitees:
      "Kutsuttuja ei ole vielä. Luo kutsut ja toimita linkit ja alkusalasanat kutsutuille Discordissa.",
    noMatches: "Yksikään kutsuttu ei vastaa suodattimia.",
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
      error: "Tallentaminen epäonnistui",
      noChoice: "—",
      status: "Tila",
      characterName: "Hahmon nimi",
      feePaid: "Pelimaksu maksettu",
    },
    resetPassword: {
      title: "Nollaa salasana",
      confirm:
        "Kutsutulle luodaan uusi alkusalasana, ja nykyinen salasana lakkaa toimimasta heti. Kutsulinkki pysyy samana, ja kaikki vastaukset ja liput säilyvät. Seuraavan kirjautumisen yhteydessä kutsuttu asettaa itselleen uuden salasanan.",
      submit: "Nollaa salasana",
      cancel: "Peruuta",
      close: "Sulje",
      done: "Salasana on nollattu. Lähetä kutsutulle linkki ja uusi alkusalasana Discordissa. Salasana näytetään vain tämän kerran.",
      link: "Kutsulinkki",
      initialPassword: "Alkusalasana",
      failed: "Salasanan nollaaminen epäonnistui.",
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
        "Kaikki kutsutun jäljet poistetaan järjestelmästä: käyttäjätiedot ja avaimet, vastaukset ilmoittautumislomakkeeseen ja käytännön kyselyyn, hänen antamansa liput, pelinjohdon asettamat tiedot sekä muiden hänelle antamat liput. Muiden vapaatekstivastauksissa olevia mainintoja ei poisteta. Poistoa ei voi perua.",
      submit: "Poista pysyvästi",
      cancel: "Peruuta",
    },
    casting: {
      completedAt: "Pelaajavalinnat julkaistu",
      notCompleted:
        "Pelaajavalintoja ei ole vielä julkaistu. Valinnat näkyvät vain pelinjohdolle.",
      complete: {
        title: "Julkaise pelaajavalinnat",
        confirm:
          "Jokainen kutsuttu näkee oman valintatuloksensa (valittu tai ei valittu) jokaisen näkymän yläreunassa. Valittujen pelaajien keskinäiset vihreät liput lasketaan ja näytetään molemmille osapuolille. Kutsutut, joiden tila on Mukana (ei päätöstä), eivät saa tulosta. Julkaisun voi perua.",
        submit: "Julkaise pelaajavalinnat",
        cancel: "Peruuta",
      },
      revert: {
        title: "Peru pelaajavalintojen julkaisu",
        confirm:
          "Valintatulokset piilotetaan kutsutuilta uudelleen, ja lasketut keskinäiset vihreät liput poistetaan. Itse valinnat säilyvät.",
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
        "Liitä kutsuttavien Discord-tunnukset, yksi riville. Jokainen saa henkilökohtaisen kutsulinkin ja alkusalasanan, jotka toimitat hänelle Discordissa. Tunnus esitäytetään kutsutun ilmoittautumislomakkeelle.",
      handles: "Discord-tunnukset",
      helpText:
        "Yksi tunnus riviä kohden. Tyhjät rivit ja toistuvat tunnukset ohitetaan.",
      submit: "Luo kutsut",
      back: "Takaisin pelaajiin",
      created: "Kutsut luotu",
      passwordsOnce:
        "Alkusalasanat näytetään vain nyt. Kopioi ne ennen kuin poistut sivulta. Linkit voi kopioida myöhemmin uudelleen Pelaajat-näkymästä.",
      empty: "Anna vähintään yksi Discord-tunnus.",
      tooMany: "Liian monta kerralla: enintään 200 tunnusta.",
      failed: "Kutsujen luominen epäonnistui. Yhtään kutsua ei luotu.",
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
    addFieldAbove: "Lisää kenttä yläpuolelle",
    addField: "Lisää kenttä",
    empty:
      "Lomakkeella ei ole vielä kenttiä. Lisää ensimmäinen kenttä alla olevalla Lisää kenttä -painikkeella.",
    saveStatus: {
      idle: "Muutokset tallentuvat automaattisesti.",
      saving: "Tallennetaan…",
      saved: "Kaikki muutokset on tallennettu.",
      error:
        "Tallentaminen epäonnistui. Tarkista viimeisin muutos ja yritä uudelleen tai lataa sivu uudestaan.",
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
          "Kentän tekninen nimi. Ei näytetä vastaajalle. Sallitut merkit: pienet kirjaimet a–z (ei ääkkösiä), numerot 0–9 ja alaviiva _.",
      },
      title: {
        title: "Otsikko",
        helpText:
          "Vastaajalle näytettävä otsikko. Jos otsikkoa ei ole asetettu, sen tilalla näytetään kentän tekninen nimi.",
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
          "Yksi vaihtoehto riviä kohden: `tekninen-nimi: Vastaajalle näytettävä teksti`. Jokaisella vaihtoehdolla on oltava oma tekninen nimi (a–z, 0–9, -). Esimerkki:\n\n```\nyes: Kyllä\nno: Ei\n```\n\nÄlä muuta teknisiä nimiä, kun vastauksia on jo tullut.",
      },
      questions: {
        title: "Kysymykset",
        helpText:
          "Yksi kysymys riviä kohden: `tekninen-nimi: Vastaajalle näytettävä teksti`. Jokaisella kysymyksellä on oltava oma tekninen nimi (a–z, 0–9, -). Esimerkki:\n\n```\nfood: Millaista ruoka oli?\nmusic: Millaista musiikki oli?\n```\n\nÄlä muuta teknisiä nimiä, kun vastauksia on jo tullut.",
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
      SingleSelect: "Yksi valinta",
      MultiSelect: "Monivalinta",
      RadioMatrix: "Valintamatriisi",
      NumberField: "Kokonaisluku",
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
        submit: "Tallenna kenttä",
        cancel: "Peruuta",
      },
    },
  },
  Structure: {
    title: "Rakenne",
    tabs: {
      vetting: "Ilmoittautumislomake",
      practical: "Käytännön kysely",
      choices: "Vaihtoehdot",
      timeline: "Aikataulu",
      privacyPolicy: "Tietosuojaseloste",
    },
    saved: "Muutokset on tallennettu.",
    errors: {
      invalid: "Tarkista tiedot ja yritä uudelleen.",
    },
    vetting: {
      intro:
        "Kutsutut ilmoittautuvat täyttämällä tämän lomakkeen. Valmiiksi merkityt vastaukset näkyvät esikatselun alettua niille kutsutuille, jotka ovat itse merkinneet vastauksensa valmiiksi. Kenttiä voi muuttaa, vaikka vastauksia olisi jo tullut: poistettujen kenttien vastaukset säilyvät mutta eivät näy, ja uudet kentät näkyvät vastaamattomina.",
      magicFieldsTitle: "Erityismerkityksiset kentät",
      magicFields:
        "Kenttä, jonka tekninen nimi on `name`, on kutsutun nimi: se täytetään valmiiksi kutsua hyväksyttäessä annetulla nimellä, ja se näkyy kaikkialla järjestelmässä. Kenttä `discord_handle` täytetään valmiiksi sillä Discord-tunnuksella, jolle kutsu on luotu. Molemmat näkyvät sarakkeina Pelaajat-näkymässä.",
      missingMagicFields:
        "Ilmoittautumislomakkeelta puuttuu näitä erityismerkityksisiä kenttiä. Lisää ne takaisin täsmälleen näillä teknisillä nimillä:",
    },
    practical: {
      intro:
        "Käytännön kyselyllä kysytään valituilta pelaajilta käytännön tietoja. Vastaukset näkyvät vain pelinjohdolle ja vastaajalle itselleen.",
    },
    choices: {
      intro:
        "Pelaajatietojen vaihtoehdot, joita pelinjohto asettaa Pelaajat-näkymässä, sekä liput, joita kutsutut antavat toisilleen. Yksi vaihtoehto riviä kohden: `tekninen-nimi: Näytettävä teksti`. Älä muuta teknisiä nimiä, kun ne ovat jo käytössä.",
      characterGroups: {
        title: "Hahmoryhmät",
        helpText: "Esimerkiksi `opettajat: Opettajat`.",
      },
      feeCategories: {
        title: "Pelimaksuluokat",
        helpText: "Esimerkiksi `normaali: Normaali pelimaksu (100 €)`.",
      },
      flags: {
        title: "Liput",
        helpText:
          "Yksi lippu riviä kohden: `tekninen-nimi: Nimi: Selitys`. Nimi näkyy painikkeissa ja merkeissä, selitys Liputus-näkymän selitteessä; selityksen voi jättää pois. Rivien järjestys on painikkeiden järjestys. Listassa on oltava `neutral`, oletus eli lipun puuttuminen. Lipulla `green` on erityismerkitys: molemminpuoliset vihreät liput näytetään valituille pelaajille pelaajavalintojen jälkeen. Liput `red`, `yellow` ja `green` näytetään omilla väreillään, muut harmaina. Älä muuta teknisiä nimiä liputuksen alettua: vanhalla nimellä annetut liput lasketaan neutraaleiksi.",
      },
      invalid:
        "Tarkista vaihtoehdot: jokaisella rivillä on oltava tekninen nimi (a–z, 0–9, -, _) ja teksti, eikä kahdella vaihtoehdolla saa olla samaa teknistä nimeä. Lipulla voi lisäksi olla selitys toisen kaksoispisteen jälkeen.",
      neutralRequired: "Lipuissa on oltava tekninen nimi `neutral`.",
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
            "Ilmoittautumislomaketta ei voi enää muokata. Pelaajavalinnoissa huomioidaan vain valmiiksi merkityt vastaukset.",
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
          title: "Käytännön kysely avautuu",
          helpText:
            "Tästä alkaen valitut pelaajat voivat täyttää ja muokata käytännön kyselyä.",
        },
        practicalEndsAt: {
          title: "Käytännön kysely sulkeutuu",
          helpText: "Käytännön kyselyä ei voi enää muokata.",
        },
      },
    },
    privacyPolicy: {
      intro:
        "Tietosuojaseloste näytetään kaikille kirjautuneille, myös kutsutuille, jotka eivät ole vielä hyväksyneet kutsuaan. Toisin kuin järjestelmän muita tietoja, sitä ei tallenneta salattuna. Kirjoita se Markdown-muodossa.",
      editor: "Tietosuojaseloste",
      preview: "Tallennetun version esikatselu",
      empty: "Tietosuojaseloste on tyhjä.",
    },
  },
  VettingSurvey: {
    name: "Nimi",
    discordHandle: "Discord-tunnus",
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
    backHome: "Etusivulle",
  },
};

export default translations;
