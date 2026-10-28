"use client";

import { type SyntheticEvent, useMemo, useState } from "react";
import Modal from "react-bootstrap/Modal";

import type { Translations } from "@/translations";

import {
  fieldToValues,
  formDataToField,
  getFieldEditorFields,
} from "./editFieldForm";
import type { Field } from "./models";
import { SchemaForm } from "./SchemaForm";
import { type FieldError, validateField } from "./schema";

interface EditFieldModalProps {
  fieldToEdit: Field;
  /** Slugs of the other fields of the form; the edited field must not take one of them. */
  otherSlugs: string[];
  onSubmit(field: Field): void;
  onClose(): void;
  locale?: string;
  messages: {
    FormEditor: Translations["FormEditor"];
    SchemaForm: Translations["SchemaForm"];
  };
}

const EditFieldModal = ({
  fieldToEdit,
  otherSlugs,
  onSubmit,
  onClose,
  locale,
  messages,
}: EditFieldModalProps) => {
  const t = messages.FormEditor.editFieldModal;
  const [error, setError] = useState<FieldError | null>(null);
  const fields = useMemo(
    () =>
      getFieldEditorFields(fieldToEdit.type, messages.FormEditor.editFieldForm),
    [fieldToEdit.type, messages.FormEditor.editFieldForm],
  );

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const field = formDataToField(fields, fieldToEdit, formData);
    const result = validateField(field, otherSlugs);
    if (result.ok) {
      setError(null);
      onSubmit(result.field);
    } else {
      setError(result.error);
    }
  };
  const values = useMemo(() => fieldToValues(fieldToEdit), [fieldToEdit]);

  return (
    <Modal show={true} onHide={onClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          {t.title}: {messages.FormEditor.fieldTypes[fieldToEdit.type]}
        </Modal.Title>
      </Modal.Header>
      <form onSubmit={handleSubmit}>
        <Modal.Body>
          <SchemaForm
            fields={fields}
            values={values}
            messages={messages.SchemaForm}
            idPrefix="EditFieldModal"
            locale={locale}
          />
          {error ? (
            <div className="alert alert-danger mb-0" role="alert">
              {messages.FormEditor.errors[error]}
            </div>
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {t.actions.cancel}
          </button>
          <button type="submit" className="btn btn-primary">
            {t.actions.submit}
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

export default EditFieldModal;
