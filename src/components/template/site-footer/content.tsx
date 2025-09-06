import React from "react";
import Link from "next/link";
import Image from "next/image";

export const SiteFooter = () => {
  const currentYear = new Date().getFullYear();
  
  const paymentMethods = [
    { name: "American Express", src: "/american-express.svg", alt: "American Express" },
    { name: "Apple Pay", src: "/apple-pay.svg", alt: "Apple Pay" },
    { name: "Baseeta", src: "/baseeta.svg", alt: "Baseeta" },
    { name: "Mastercard", src: "/master-card.svg", alt: "Mastercard" },
    { name: "Tabby", src: "/tabby.svg", alt: "Tabby" },
    { name: "Tamara", src: "/tamara.svg", alt: "Tamara" },
    { name: "Visa", src: "/visa.svg", alt: "Visa" },
    { name: "Mada", src: "/mada.svg", alt: "Mada" },
  ];

  return (
    <footer className="flex flex-col border-t font-medium p-6 bg-white">
      <div className="flex items-center justify-center mb-4">
        <p className="text-center text-gray-700 italic text-lg">
          &ldquo;Lexi – the protector of humankind through reading books and
          preserving the value of books.&rdquo;
        </p>
      </div>
      
      {/* Payment Methods Section */}
      <div className="flex flex-col items-center mb-6">
        <h3 className="text-sm font-semibold text-gray-600 mb-3">We Accept</h3>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {paymentMethods.map((payment) => (
            <div
              key={payment.name}
              className="flex items-center justify-center p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              title={payment.name}
            >
              <Image
                src={payment.src}
                alt={payment.alt}
                width={34}
                height={24}
                className="object-contain"
              />
            </div>
          ))}
        </div>
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
