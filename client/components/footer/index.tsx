export default function Footer() {
  return (
    <footer className="mt-auto flex flex-col gap-1 border-t border-gray-200 px-4 py-3 text-[11px] text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:text-xs">
      <span>
        © {new Date().getFullYear()} Villa Elisa Funeral Home. All rights
        reserved.
      </span>
      <span>Funeral Home Management System · v0.1.0</span>
    </footer>
  );
}
