import React from "react";
import Link from "next/link";

export const SiteFooter = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="flex flex-col border-t font-medium p-6 bg-white">
      <div className="flex items-center justify-center mb-4">
        <p className="text-center text-gray-700 italic text-lg">
          &ldquo;Lexi – the protector of humankind through reading books and
          preserving the value of books.&rdquo;
        </p>
      </div>
      <div className="flex items-center justify-center gap-4 mb-4">
        <Link
          href="https://www.linkedin.com/in/hannidinhcs/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
        >
          LinkedIn
        </Link>
        <span className="text-gray-400">•</span>
        <Link
          href="https://hiendinh.space"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
        >
          Portfolio
        </Link>
      </div>
      <div className="flex items-center justify-center">
        <p className="text-gray-500">
          &copy; {currentYear} Hien (Hanni) Dinh. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
