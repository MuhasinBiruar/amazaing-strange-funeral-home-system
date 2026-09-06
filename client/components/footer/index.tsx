export default function Footer() {
  return (
    <footer className="sticky bottom-0 z-40 bg-white/50 backdrop-blur-md mt-auto flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-5 py-4 border-t border-gray-200 text-[11px] sm:text-xs text-gray-500 gap-3 sm:gap-0">
      <span>© 2024 Villa Elisa Funeral Home. All rights reserved.</span>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        <span>System Status: Operational</span>
        <span>Privacy Policy</span>
        <span>Support</span>
      </div>
    </footer>
  );
}
