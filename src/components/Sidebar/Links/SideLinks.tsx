"use client";
import Link from 'next/link';
import React from 'react';
import { SidebarItem } from '@/util/type';
import { usePathname } from 'next/navigation';

interface SideLinksProps {
  links: SidebarItem[];
}

export const SideLinks: React.FC<SideLinksProps> = ({ links }) => {
  const pathname = usePathname();

  const isActiveSubLink = (item: SidebarItem) => {
    const activeTitles = Array.isArray(item.activeTitle) ? item.activeTitle : [item.activeTitle];
    return activeTitles.includes(pathname);
  };

  return (
    <>
      {links.map(link => {
        const hasSublinks = link.sublinks && link.sublinks.length > 0;
        const isActive = pathname === link.path;
        const activeSubLink = isActiveSubLink(link);

        return (
          <li key={link.path}
            className={`font-maven text-txtWhite text-base font-medium`}
          >
            {hasSublinks ? (
              <div 
                className={`left-3 w-full h-10 flex items-center rounded-md cursor-default 
                  ${isActive ? 'bg-prinFuchsia' : ''}
                  ${activeSubLink ? "text-prinFuchsia" : ""}
                `}
              >
                <p className='ml-3'>
                  {link.titleItem}
                </p>
              </div>
            ) : (
              <Link 
                href={link.path} 
                className={`left-3 w-full h-10 flex items-center rounded-md transition-colors duration-150
                  ${isActive ? 'bg-prinFuchsia' : 'hover:bg-btnFuchsiaHov'}
                `}
              >
                <p className='ml-3'>
                  {link.titleItem}
                </p>
              </Link>
            )}
            {hasSublinks && (
              <ul className="py-2 pl-6 flex flex-col gap-2">
                <SideLinks links={link.sublinks || []} />
              </ul>
            )}
          </li>
        );
      })}
    </>
  );
};
