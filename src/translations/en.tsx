const translations = {
  common: {
    /** Used where the configured event name is not available. */
    appName: "Larp sign-up",
    actions: {
      save: "Save",
      cancel: "Cancel",
      close: "Close",
    },
  },
  AppBar: {
    toggleNavigation: "Toggle navigation",
    signUp: "Sign Up",
    flagging: "Flagging",
    practical: "Practical",
    privacy: "Privacy",
    structure: "Structure",
    players: "Players",
    profile: "Profile",
    changePassword: "Change Password",
    signOut: "Sign Out",
    theme: {
      dark: "Dark",
      light: "Light",
      system: "System",
    },
  },
  Theme: {
    title: "Theme",
  },
  Errors: {
    notFound: "Page not found.",
    generic: "Something went wrong.",
  },
  HomePage: {
    redirecting: "Redirecting…",
  },
};

export type Translations = typeof translations;
export default translations;
