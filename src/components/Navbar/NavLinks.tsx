"use client"
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { name: 'Dashboard', href: '/' },
  { name: 'Planes', href: '/playground' },
  { name: 'Configuración', href: '/settings' },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {links.map((link) => {
        const isHighlighted = 
        (link.name === 'Dashboard' && (pathname === '/' || pathname.startsWith('/dashboard'))) ||
        (link.name === 'Planes' && pathname.startsWith('/playground')) ||
        (link.name === 'Configuración' && pathname.startsWith('/settings'));

        return (
          <Link
            key={link.name}
            href={link.href}
            className={`text-base max-xl:text-sm font-mulish transition-colors duration-150 hover:text-prinFuchsia hover:font-medium
              ${isHighlighted ? "text-prinFuchsia font-medium" : "text-txtWhite"}`}
          >
            {link.name}
          </Link>
        );
      })}
    </>
  );
}