import { Markdown, ModalButton } from "@con2/components";

import { canWithdraw, hasAccepted } from "@/auth/permissions";
import { requireViewer } from "@/auth/viewer";
import { getPrivacyPolicy } from "@/models/event";
import { UserStatus } from "@/prisma/enums";
import { getTranslations } from "@/translations";

import { withdrawAction } from "./actions";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Readable by every signed-in user, including INVITED ones deciding whether to accept. Accepted
 * invitees also get the Danger Zone with the Withdraw button.
 */
export default async function PrivacyPage({ searchParams }: Props) {
  const viewer = await requireViewer();
  const t = getTranslations();
  const m = t.Privacy.dangerZone;
  const [privacyPolicy, params] = await Promise.all([
    getPrivacyPolicy(),
    searchParams,
  ]);
  const withdrawn = viewer.user.status === UserStatus.WITHDRAWN;

  return (
    <div className="container mt-4 mb-4">
      <h1 className="mb-3">{t.Privacy.title}</h1>
      {params.error === "withdraw" ? (
        <div className="alert alert-danger" role="alert">
          {m.failed}
        </div>
      ) : null}
      {privacyPolicy.trim() ? (
        <Markdown input={privacyPolicy} />
      ) : (
        <p className="text-muted">{t.Privacy.empty}</p>
      )}

      {hasAccepted(viewer) ? (
        <section className="card border-danger border-2 mt-5">
          <div className="card-body">
            <h2 className="h4 card-title text-danger">{m.title}</h2>
            {withdrawn ? (
              <p className="text-muted mb-0">{m.alreadyWithdrawn}</p>
            ) : (
              <>
                <h3 className="h5">{m.withdrawTitle}</h3>
                <p>{m.explanation}</p>
                <p>{m.undoNotice}</p>
                {canWithdraw(viewer) ? (
                  <ModalButton
                    title={m.confirmTitle}
                    label={m.withdraw}
                    className="btn btn-danger"
                    action={withdrawAction}
                    messages={{
                      cancel: t.common.actions.cancel,
                      submit: m.confirm,
                    }}
                    submitButtonVariant="danger"
                  >
                    <p className="mb-0">{m.confirmText}</p>
                  </ModalButton>
                ) : null}
              </>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
