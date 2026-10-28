type StrengthLabels = [string, string, string, string, string];

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
    unnamed: "Unnamed",
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
  SignIn: {
    title: "Sign in",
    password: "Password",
    submit: "Sign In",
    errors: {
      invalid: "Wrong password, or the invitation link is not valid.",
      locked:
        "Too many failed attempts. Try again in a while, or ask the GMs on Discord.",
      revoked:
        "Your invitation was revoked. If you think this is a mistake, contact the GMs on Discord.",
      generic: "Signing in failed. Please try again.",
    },
  },
  AcceptInvitation: {
    title: "Accept invitation",
    invitedAs: "You were invited as",
    resetNotice:
      "A GM has reset your password. Set a new password to continue. Your answers have been kept.",
    notSignUpNotice:
      "Accepting the invitation does not yet mean you have signed up for the event or been selected to play. After accepting, fill in the sign-up survey.",
    bookmarkNotice:
      "Bookmark this page. This invitation link is personal: you will use it, together with the password you set here, to access the system later, too.",
    privacyPrefix: "Before accepting, you may read the",
    privacyLink: "privacy policy",
    name: "Display name",
    nameHelp:
      "Shown to other invitees and the GMs. You can change it later in the sign-up survey.",
    newPassword: "New password",
    confirmPassword: "Confirm password",
    submit: "Accept invitation",
    errors: {
      passwordsDiffer: "The passwords do not match.",
      passwordRequired: "Enter a password.",
      generic: "Accepting the invitation failed. Please try again.",
    },
  },
  ChangePassword: {
    title: "Change password",
    currentPassword: "Current password",
    newPassword: "New password",
    confirmPassword: "Confirm new password",
    submit: "Change password",
    success: "Your password has been changed.",
    errors: {
      wrongPassword: "The current password is wrong.",
      passwordsDiffer: "The new passwords do not match.",
      passwordRequired: "Enter a new password.",
      generic: "Changing the password failed. Please try again.",
    },
  },
  PasswordStrength: {
    labels: [
      "Very weak",
      "Weak",
      "Fair",
      "Strong",
      "Very strong",
    ] as StrengthLabels,
  },
  Privacy: {
    title: "Privacy",
    empty: "The GMs have not written the privacy policy yet.",
  },
  SignUp: {
    title: "Sign Up",
    placeholder: "The Sign Up view comes in a later milestone.",
    notAccepted:
      "Accept your invitation first by opening your personal invitation link.",
  },
  Players: {
    title: "Players",
    columns: {
      status: "Status",
      isGm: "GM",
      createdAt: "Invited",
      actions: "Actions",
    },
    gm: "GM",
    copyInviteLink: {
      title: "Copy invite link",
      success: "The invitation link has been copied to the clipboard.",
    },
    total: (total: number) => (total === 1 ? "1 invitee" : `${total} invitees`),
  },
  VettingSurvey: {
    /** Titles of the default fields created at initialisation. */
    name: "Name",
    discordHandle: "Discord handle",
  },
  UserStatus: {
    INVITED: "Invited",
    REVOKED: "Revoked",
    ENTERED: "Entered",
    SELECTED: "Selected",
    NOT_SELECTED: "Not selected",
    WITHDRAWN: "Withdrawn",
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
