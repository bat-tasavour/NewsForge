type JsonLdScriptProps = {
  id: string;
  payload: Record<string, unknown>;
};

export function JsonLdScript({ id, payload }: JsonLdScriptProps) {
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
