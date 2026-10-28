{{- define "hardwood.labels" -}}
stack: hardwood
{{- end -}}

{{- define "hardwood.secretName" -}}
{{ .Values.existingSecretName | default "hardwood" }}
{{- end -}}

{{- define "hardwood.tlsSecretName" -}}
tls-hardwood
{{- end -}}
