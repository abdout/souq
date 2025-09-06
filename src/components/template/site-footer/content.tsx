import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Linkedin, Twitter, Youtube, Globe } from "lucide-react";

export const SiteFooter = () => {
  const currentYear = new Date().getFullYear();
  
  const paymentMethods = [
    { name: "Mada", src: "/mada.svg", alt: "Mada" },
    { name: "Apple Pay", src: "/apple-pay.svg", alt: "Apple Pay" },
    { name: "Mastercard", src: "/master-card.svg", alt: "Mastercard" },
    { name: "Visa", src: "/visa.svg", alt: "Visa" },
    { name: "American Express", src: "/american-express.svg", alt: "American Express" },
    { name: "Tamara", src: "/tamara.svg", alt: "Tamara" },
    { name: "Baseeta", src: "/baseeta.svg", alt: "Baseeta" },
    { name: "Tabby", src: "/tabby.svg", alt: "Tabby" },
  ];

  const socialIcons = [
    { name: "Facebook", icon: Facebook, href: "#" },
    { name: "Instagram", icon: Instagram, href: "#" },
    { name: "LinkedIn", icon: Linkedin, href: "https://www.linkedin.com/in/hannidinhcs/" },
    { name: "X", icon: Twitter, href: "#" },
    { name: "YouTube", icon: Youtube, href: "#" },
  ];

  const footerSections = [
    {
      title: "Climate and environment",
      links: [
        { name: "Social impact", href: "#" },
        { name: "Life at home", href: "#" },
      ]
    },
    {
      title: "Spare parts",
      links: [
        { name: "Contact us", href: "#" },
        { name: "Recalls", href: "#" },
        { name: "FAQ", href: "#" },
        { name: "Services booking", href: "#" },
        { name: "IKEA gift cards", href: "#" },
      ]
    },
    {
      title: "Planning tools",
      links: [
        { name: "IKEA Food", href: "#" },
        { name: "IKEA stores", href: "#" },
        { name: "IKEA App", href: "#" },
        { name: "IKEA Brochures", href: "#" },
      ]
    }
  ];

  const legalLinks = [
    { name: "Terms & Conditions", href: "#" },
    { name: "Cookie policy", href: "#" },
    { name: "Cookie settings", href: "#" },
    { name: "Privacy Policy", href: "#" },
    { name: "VAT certificate", href: "#" },
    { name: "IKEA CR", href: "#" },
  ];

  return (
    <footer className="bg-gray-50 border-t">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Links Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {footerSections.map((section, index) => (
            <div key={index}>
              <h3 className="font-semibold text-gray-900 mb-4 text-sm">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link
                      href={link.href}
                      className="text-gray-600 hover:text-gray-900 text-sm transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Social Media Icons */}
        <div className="flex items-center gap-4 mb-8">
          {socialIcons.map((social, index) => {
            const IconComponent = social.icon;
            return (
              <Link
                key={index}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-white hover:bg-gray-700 transition-colors"
                title={social.name}
              >
                <IconComponent className="w-5 h-5" />
              </Link>
            );
          })}
        </div>

        {/* Payment Methods */}
        <div className="flex items-center gap-3 mb-8">
          {paymentMethods.map((payment) => (
            <div
              key={payment.name}
              className="flex items-center justify-center p-2 bg-white rounded-md border border-gray-200 hover:shadow-sm transition-shadow"
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

        {/* Language Selector */}
        <div className="flex justify-end mb-8">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors text-sm">
            <Globe className="w-4 h-4" />
            <span>SA</span>
            <span>English</span>
          </button>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © Inter IKEA Systems B.V. 1999-{currentYear}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              {legalLinks.map((link, index) => (
                <Link
                  key={index}
                  href={link.href}
                  className="text-gray-600 hover:text-gray-900 text-sm transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
