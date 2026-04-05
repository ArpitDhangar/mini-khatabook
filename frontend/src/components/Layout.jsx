import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 sm:px-6">
        {children}
      </main>
      <footer className="text-center text-xs text-gray-400 py-4 border-t border-gray-100">
        Khatabook &copy; {new Date().getFullYear()} — Dairy Credit Manager
      </footer>
    </div>
  );
}
