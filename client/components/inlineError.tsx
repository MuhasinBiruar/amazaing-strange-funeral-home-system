export default function InlineError({ error }: { error?: string }) {
  return (
    <>
      {error && <p className="text-red-700 text-xs font-bold mt-1">{error}</p>}
    </>
  );
}
