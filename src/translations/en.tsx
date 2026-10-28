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
  SchemaForm: {
    submit: "Submit",
    noAnswer: "No answer",
  },
  FormEditor: {
    editField: "Edit field",
    moveUp: "Move up",
    moveDown: "Move down",
    removeField: "Remove field",
    addFieldAbove: "Add field above",
    addField: "Add field",
    /** Feedback of the automatic save after each change. */
    saveStatus: {
      idle: "Changes are saved automatically.",
      saving: "Saving…",
      saved: "All changes saved.",
      error:
        "Saving failed. Check the latest change and try again, or reload the page.",
    },
    errors: {
      invalidSlug:
        "The technical name may only contain small letters a–z, numbers 0–9 and underscores _.",
      duplicateSlug: "Another field already has this technical name.",
      invalidChoices:
        "Check the choices: each line needs a technical name (a–z, 0–9, -, _) and a text, and the technical names must be unique. At least one choice is needed.",
      invalidField: "Check the values of the field.",
    },

    editFieldForm: {
      slug: {
        title: "Technical name",
        helpText:
          "Machine-readable field name. Valid characters: small letters a-z, numbers 0-9, underscore _.",
      },
      title: {
        title: "Title",
        helpText:
          "Human-readable field label. If unset, defaults to field name.",
      },
      helpText: {
        title: "Help text",
        helpText: "Displayed below the field.",
      },
      required: {
        title: "Required",
        choice: "Answering this field is required",
      },
      choices: {
        title: "Choices",
        helpText:
          "One choice per line: `technical-name: Text shown to the user`. Each choice needs its own technical name (a-z, 0-9, -). Example:\n\n```\nyes: Yes\nno: No\n```\n\nDon't change the technical names after responses have been received.",
      },
      questions: {
        title: "Questions",
        helpText:
          "One question per line: `technical-name: Text shown to the user`. Each question needs its own technical name (a-z, 0-9, -). Example:\n\n```\nfood: How was the food?\nmusic: How was the music?\n```\n\nDon't change the technical names after responses have been received.",
      },
      presentation: {
        title: "Presentation",
        radio: "Radio buttons",
        dropdown: "Dropdown",
      },
      maxLength: {
        title: "Maximum length",
        helpText:
          "Maximum number of characters the respondent may enter. Leave empty for no limit.",
      },
      minValue: {
        title: "Minimum value",
        helpText: "Leave empty for no lower limit.",
      },
      maxValue: {
        title: "Maximum value",
        helpText: "Leave empty for no upper limit.",
      },
    },

    fieldTypes: {
      SingleLineText: "Single line text",
      MultiLineText: "Multi-line text",
      MarkdownText: "Multi-line text (Markdown)",
      StaticText: "Static text",
      SingleSelect: "Single select",
      MultiSelect: "Multiple select",
      RadioMatrix: "Radio button matrix",
      NumberField: "Number",
    },

    removeFieldModal: {
      title: "Confirm field removal",
      message: "Remove the selected field?",
      actions: {
        submit: "Remove",
        cancel: "Cancel",
      },
    },

    editFieldModal: {
      title: "Edit field",
      actions: {
        submit: "Save field",
        cancel: "Cancel",
      },
    },
  },
  Structure: {
    title: "Structure",
    tabs: {
      vetting: "Vetting survey",
      practical: "Practical survey",
      choices: "Choices",
      timeline: "Timeline",
      privacyPolicy: "Privacy policy",
    },
    saved: "Changes saved.",
    errors: {
      invalid: "Check the values and try again.",
      generic: "Saving failed. Please try again.",
    },
    vetting: {
      intro:
        "Invitees fill in the vetting survey to sign up. Completed responses are shown to the other invitees who have completed theirs, from the preview start onwards. Fields may be changed while responses exist: answers to removed fields are kept but not shown, and new fields appear unanswered.",
      magicFieldsTitle: "Fields with a special meaning",
      magicFields:
        "The field with the technical name `name` is the invitee's display name: it is prefilled with the name given when accepting the invitation and shown throughout the system. The field `discord_handle` is prefilled with the Discord handle the invitation was made for. Both are shown as columns in the Players view.",
      missingMagicFields:
        "The vetting survey lacks these fields with a special meaning. Add them back with these exact technical names:",
    },
    practical: {
      intro:
        "The practical survey asks selected players for practical information. Responses are visible only to the GMs and the respondent.",
    },
    choices: {
      intro:
        "Choices of player attributes the GMs set in the Players view. One choice per line: `technical-name: Text shown`. Don't change the technical names after they are in use.",
      characterGroups: {
        title: "Character groups",
        helpText: "For example `staff: Staff`.",
      },
      feeCategories: {
        title: "Player fee categories",
        helpText: "For example `normal: Normal fee (100 €)`.",
      },
      invalid:
        "Check the choices: each line needs a technical name (a–z, 0–9, -, _) and a text, and the technical names must be unique.",
    },
    timeline: {
      intro:
        "The phases of the event are driven by these times. You may change them at any time, also to reopen a closed period. Leave a time empty if it has not been decided yet: a period that lacks its start or end time is closed.",
      timezone: "Times are in the time zone",
      fields: {
        signupStartsAt: {
          title: "Sign-up starts",
          helpText:
            "Invitees may fill in and edit the vetting survey from this time on.",
        },
        previewStartsAt: {
          title: "Preview starts",
          helpText:
            "From this time on, invitees who have completed their response see the completed responses of others.",
        },
        signupEndsAt: {
          title: "Sign-up ends",
          helpText:
            "The vetting survey can no longer be edited. Only completed responses are considered for casting.",
        },
        flaggingStartsAt: {
          title: "Flagging starts",
          helpText:
            "Invitees may flag each other from this time on. Usually the same as the end of sign-up.",
        },
        flaggingEndsAt: {
          title: "Flagging ends",
          helpText: "Flags can no longer be changed.",
        },
        practicalStartsAt: {
          title: "Practical survey opens",
          helpText:
            "Players may fill in and edit the practical survey from this time on.",
        },
        practicalEndsAt: {
          title: "Practical survey closes",
          helpText: "The practical survey can no longer be edited.",
        },
      },
    },
    privacyPolicy: {
      intro:
        "The privacy policy is shown to every signed-in user, also to invitees who have not yet accepted their invitation. Unlike the other data in the system, it is stored unencrypted. Write it in Markdown.",
      editor: "Privacy policy",
      preview: "Preview of the saved version",
      empty: "The privacy policy is empty.",
    },
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
