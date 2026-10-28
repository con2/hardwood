"use client";

import { useState } from "react";

import type { Translations } from "@/translations";

import AddFieldDropdown from "./AddFieldDropdown";
import EditFieldModal from "./EditFieldModal";
import FormEditorControls from "./FormEditorControls";
import { addField, removeField, replaceField } from "./formEditorLogic";
import { Modal, useModal } from "./LegacyModal";
import { type Field, type FieldType, emptyField } from "./models";
import newField from "./newField";
import SchemaFormField from "./SchemaFormField";
import SchemaFormInput from "./SchemaFormInput";

import "./FormEditor.scss";

interface Props {
  value: Field[];
  onChange(fields: Field[]): void;
  locale?: string;
  messages: {
    FormEditor: Translations["FormEditor"];
    SchemaForm: Translations["SchemaForm"];
  };
}

/** Fully controlled form editor component. */
export default function FormEditor(props: Props) {
  const { value: fields, onChange, locale, messages } = props;
  const t = messages.FormEditor;

  const [targetFieldName, setTargetFieldName] = useState("");
  const [editExisting, setEditExisting] = useState(false);
  const [fieldBeingEdited, setFieldBeingEdited] = useState(emptyField);
  const [editFieldModalOpen, setEditFieldModalOpen] = useState(false);

  const removeFieldModal = useModal();

  const handleAddField = (fieldType: FieldType, aboveFieldSlug?: string) => {
    const usedIdentifiers = fields.map((field) => field.slug);
    setEditExisting(false);
    setTargetFieldName(aboveFieldSlug ?? "");
    setFieldBeingEdited(newField(fieldType, usedIdentifiers));
    setEditFieldModalOpen(true);
  };

  const handleEditField = (slug: string) => {
    const fieldToEdit = fields.find((field) => field.slug === slug);

    if (!fieldToEdit) {
      throw new Error(
        "Asked to edit non-existent field (this shouldn't happen)",
      );
    }

    setEditExisting(true);
    setTargetFieldName(slug);
    setFieldBeingEdited(fieldToEdit);
    setEditFieldModalOpen(true);
  };

  const handleRemoveField = (slug: string) => {
    setTargetFieldName(slug);
    removeFieldModal.open();
  };

  const otherSlugs = fields
    .map((field) => field.slug)
    .filter((slug) => !editExisting || slug !== targetFieldName);

  return (
    <div className="FormEditor">
      {fields.map((field) => (
        <div key={field.slug} className="FormEditor-field">
          <div className="FormEditor-background">
            <SchemaFormField field={field} idPrefix="FormEditor">
              <SchemaFormInput
                field={field}
                readOnly={true}
                messages={messages.SchemaForm}
                idPrefix="FormEditor"
                locale={locale}
              />
            </SchemaFormField>
            <FormEditorControls
              value={fields}
              field={field}
              onChange={onChange}
              onAddField={handleAddField}
              onRemoveField={handleRemoveField}
              onEditField={handleEditField}
              messages={messages.FormEditor}
            />
          </div>
        </div>
      ))}
      <AddFieldDropdown
        title={t.addField}
        onSelect={handleAddField}
        messages={messages.FormEditor}
      />

      <Modal
        {...removeFieldModal}
        title={t.removeFieldModal.title}
        messages={t.removeFieldModal.actions}
        onSubmit={() => onChange(removeField(fields, targetFieldName))}
      >
        {t.removeFieldModal.message}
      </Modal>

      {editFieldModalOpen && (
        <EditFieldModal
          fieldToEdit={fieldBeingEdited}
          otherSlugs={otherSlugs}
          onSubmit={(field) => {
            const newFields = editExisting
              ? replaceField(fields, targetFieldName, field)
              : addField(fields, field, targetFieldName);

            setEditFieldModalOpen(false);
            onChange(newFields);
          }}
          onClose={() => setEditFieldModalOpen(false)}
          locale={locale}
          messages={messages}
        />
      )}
    </div>
  );
}
