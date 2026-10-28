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
    notAccepted:
      "Accept your invitation first by opening your personal invitation link.",
    intro:
      "Sign up for the event by answering the survey below. Your answers are saved automatically as you type, and you can return to edit them until the sign-up period ends.",
    signupEndsAt: "The sign-up period ends",
    onlyCompleted:
      "At the end of the sign-up period, only responses marked as completed are considered for casting.",
    preview:
      "Your completed answers are shown to the other invitees who have completed theirs, and theirs to you, in the Flagging view once the preview period begins.",
    noEmail:
      "The system sends no email. The GMs will contact you on Discord, and the casting result will also be shown here.",
    completion: {
      title: "Is your response ready?",
      notCompleted: "Not yet completed",
      notCompletedHelp: "I am still working on my answers.",
      completed: "Completed",
      completedHelp:
        "I am satisfied with my answers. I may still revise them until the end of the sign-up period without switching back.",
      saveFailed:
        "Saving the completion state failed. Try again, or reload the page.",
    },
    missingRequired:
      "Your response is marked as completed, but these required questions are unanswered:",
    readOnly: {
      notScheduled:
        "The sign-up period has not been scheduled yet. You can answer the survey once it opens.",
      notOpen: "The sign-up period has not opened yet. It opens",
      closed:
        "The sign-up period has ended. Your answers are shown below and can no longer be edited.",
      withdrawn:
        "You have withdrawn from the event. Your answers are shown below and can no longer be edited.",
      notEntered: "Your answers cannot be edited.",
    },
  },
  Autosave: {
    idle: "Your answers are saved automatically.",
    saving: "Saving…",
    saved: "Saved at",
    error:
      "Saving failed. It will be retried on your next change; if the problem persists, copy your latest answer somewhere safe and reload the page.",
    forbidden:
      "Your answers can no longer be saved: the sign-up period may have ended. Reload the page.",
  },
  StatusBanner: {
    selected:
      "You have been selected to play. Congratulations! The GMs will contact you on Discord.",
    notSelected:
      "Unfortunately you were not selected to play this time. Thank you for signing up!",
    withdrawn: "You chose to withdraw or were removed by the GM.",
  },
  ComingSoon: {
    practical: "The Practical view comes in a later milestone.",
  },
  Flagging: {
    title: "Flagging",
    intro:
      "Below are the completed sign-up responses of the other invitees. For each of them, choose the flag that expresses your willingness to play with that person. Your flags are visible only to you and the GMs.",
    coloursTitle: "What the flags mean",
    choices: {
      RED: "Red",
      YELLOW: "Yellow",
      NEUTRAL: "Neutral",
      GREEN: "Green",
    },
    definitions: {
      RED: "I do not want to participate if this person participates.",
      YELLOW:
        "I consent to participating while this person participates but wish to keep playing with them to a minimum.",
      NEUTRAL: "The default.",
      GREEN:
        "I am open to exploring the possibility of intense or intimate play with this person. Mutual green flags will be shared with them.",
    },
    safety:
      "In addition to the flags, if you feel a person on this page poses a safety hazard to the participants of the event, contact the GMs directly.",
    gmsSeeFlags:
      "The GMs see all flags, including the ones made on themselves when they play.",
    modes: {
      preview:
        "Flagging has not started yet. You can already read the responses of others. Flagging opens",
      previewNotScheduled:
        "Flagging has not been scheduled yet. You can already read the responses of others.",
      flagging: "Flagging is open. Your choices are saved as you make them.",
      flaggingEndsAt: "Flagging ends",
      readonly:
        "Flagging has ended. Your flags are shown below and can no longer be changed.",
      namesOnly:
        "Below are the people you flagged and your flags. The responses of others are no longer shown to you.",
    },
    completion: {
      title: "Have you reviewed everyone?",
      notCompleted: "Not yet completed",
      notCompletedHelp: "I am still reviewing the responses.",
      completed: "Completed",
      completedHelp:
        "I have reviewed everyone. Those I have not flagged are neutral. I may still change my flags until flagging ends.",
      saveFailed:
        "Saving the completion state failed. Try again, or reload the page.",
    },
    yourFlag: "Your flag",
    mutualGreen: "Mutual green",
    mutualGreenHelp: "You and this person flagged each other green.",
    saving: "Saving…",
    saved: "Saved",
    saveFailed: "Saving failed. Try again.",
    forbidden: "Flags can no longer be changed. Reload the page.",
    empty: "There are no other completed responses yet.",
    namesOnlyEmpty: "You did not flag anyone.",
  },
  Flags: {
    title: "Flags",
    warning:
      "This is the most sensitive information the system holds. View it only when you need to, and do not leave it open on screen.",
    backToPlayers: "Back to Players",
    backToMatrix: "Back to the flags matrix",
    matrixHelp:
      "Flaggers in rows, flagged people in columns. Click a name for that person's flags as lists.",
    flagger: "Flagger",
    completed: "Flagging marked completed",
    colours: {
      RED: "Red",
      YELLOW: "Yellow",
      GREEN: "Green",
    },
    totals: {
      title: "Totals",
      person: "Person",
      received: "Received",
      given: "Given",
    },
    person: {
      status: "Status",
      inbound: "Flags received",
      outbound: "Flags given",
      none: "None.",
    },
    empty: "No one has accepted their invitation yet.",
  },
  Players: {
    title: "Players",
    columns: {
      status: "Status",
      isGm: "GM",
      name: "Name",
      discordHandle: "Discord",
      characterName: "Character",
      characterGroup: "Group",
      feeCategory: "Fee category",
      feePaid: "Fee paid",
      vetting: "Sign-up",
      flagging: "Flagging",
      practical: "Practical",
      actions: "Actions",
    },
    gm: "GM",
    noName: "(no name yet)",
    copyInviteLink: {
      title: "Copy invite link",
      success: "The invitation link has been copied to the clipboard.",
    },
    total: (total: number) => (total === 1 ? "1 invitee" : `${total} invitees`),
    filters: {
      status: "Status",
      characterGroup: "Character group",
      all: "All",
      noGroup: "No group",
      submit: "Filter",
    },
    links: {
      createInvites: "Create invites",
      flags: "Flags",
    },
    responseState: {
      none: "No response",
      inProgress: "In progress",
      completed: "Completed",
    },
    cells: {
      saving: "Saving…",
      saved: "Saved",
      error: "Saving failed",
      noChoice: "—",
      status: "Status",
      characterName: "Character name",
      feePaid: "Fee paid",
    },
    resetPassword: {
      title: "Reset password",
      confirm:
        "A new initial password is generated for this invitee. Their current password stops working at once. Their invitation link stays the same, and all their answers and flags are kept. On their next sign-in they set a new password.",
      submit: "Reset password",
      cancel: "Cancel",
      close: "Close",
      done: "The password has been reset. Send the invitee the link and the new initial password on Discord. The password is shown only now.",
      link: "Invitation link",
      initialPassword: "Initial password",
      failed: "Resetting the password failed.",
      copyLink: {
        title: "Copy link",
        success: "The invitation link has been copied to the clipboard.",
      },
      copyPassword: {
        title: "Copy password",
        success: "The password has been copied to the clipboard.",
      },
    },
    delete: {
      title: "Delete",
      confirm:
        "This removes all traces of the invitee from the system: their user record and keys, their sign-up, flagging and practical survey answers, the attributes set by the GMs, and the flags others have made about them. Mentions of them in the free-text answers of others are not removed. This cannot be undone.",
      submit: "Delete permanently",
      cancel: "Cancel",
    },
    casting: {
      completedAt: "Casting completed",
      notCompleted:
        "Casting has not been completed. Selections are visible to the GMs only.",
      complete: {
        title: "Mark casting complete",
        confirm:
          "Each invitee will see their own casting result (selected or not selected) at the top of every view. The mutual green flags between selected players are derived and shown to both parties. Invitees whose status is Entered (no decision) get no result. This can be reverted.",
        submit: "Mark casting complete",
        cancel: "Cancel",
      },
      revert: {
        title: "Revert casting completion",
        confirm:
          "The casting results are hidden from the invitees again, and the derived mutual green flags are deleted. The selections themselves are kept.",
        submit: "Revert",
        cancel: "Cancel",
      },
    },
    errors: {
      notFound: "The invitee no longer exists.",
      invalidTransition: "That status change is not allowed.",
      notWithdrawn: "Only withdrawn invitees can be deleted.",
      invalid: "Check the value.",
      self: "Change your own password via the profile menu.",
      generic: "Something went wrong.",
    },
    invite: {
      title: "Create invites",
      intro:
        "Paste the Discord handles of the invitees, one per line. Each gets a personal invitation link and an initial password, which you hand out on Discord. The handle is prefilled in the invitee's sign-up survey.",
      handles: "Discord handles",
      helpText: "One per line. Empty lines and duplicates are skipped.",
      submit: "Create invites",
      back: "Back to players",
      created: "Invites created",
      passwordsOnce:
        "The initial passwords are shown only now. Copy them before leaving this page. The links can be copied again later in the Players view.",
      empty: "Give at least one Discord handle.",
      tooMany: "Too many at once: at most 200 handles.",
      failed: "Creating the invites failed. None were created.",
      columns: {
        discordHandle: "Discord handle",
        link: "Invitation link",
        initialPassword: "Initial password",
      },
      copyLink: {
        title: "Copy link",
        success: "The invitation link has been copied to the clipboard.",
      },
      copyPassword: {
        title: "Copy password",
        success: "The password has been copied to the clipboard.",
      },
    },
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
        "The phases of the event are driven by these times. You may change them at any time, also to reopen a closed period. Leave a time empty if it has not been decided yet: a period without a start time is closed, and one without an end time stays open once it has started.",
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
