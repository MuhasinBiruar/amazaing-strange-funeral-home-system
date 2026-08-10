export default function Footer() {
  return (
    <div className="mt-auto flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-5 py-3 border-t border-gray-200 text-[11px] sm:text-xs text-gray-400 gap-1 sm:gap-0">
      <span>© 2024 Villa Elisa Funeral Home. All rights reserved.</span>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        <span>System Status: Operational</span>
        <span>Privacy Policy</span>
        <span>Support</span>
      </div>
    </div>
  );
}