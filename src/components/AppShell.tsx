'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBars,
  faGauge,
  faHeadset,
  faRightFromBracket,
  faTicket,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { useCurrentUser } from '@/context/AuthContext';
import { Avatar, RoleBadge } from './ui';

const AppShell = ({ children }: { children: ReactNode }) => {
  const { user, isAdmin, logout } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);

  // Close the mobile menu after navigating (adjusting state during render, not in an effect)
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setNavOpen(false);
  }

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const links = [
    { href: '/', label: 'Dashboard', icon: faGauge, exact: true },
    { href: '/tickets', label: isAdmin ? 'All tickets' : 'My tickets', icon: faTicket, exact: false },
    ...(isAdmin ? [{ href: '/users', label: 'Team', icon: faUsers, exact: false }] : []),
  ];

  // Same rule as React Router's NavLink: exact match, or a sub-path when not `exact`
  const isActive = (href: string, exact: boolean) =>
    pathname === href || (!exact && pathname.startsWith(`${href}/`));

  return (
    <div className={`app-shell ${navOpen ? 'nav-open' : ''}`}>
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            <FontAwesomeIcon icon={faHeadset} />
          </span>
          <span className="brand-name">SupportDesk</span>
        </div>

        <nav className="nav">
          <span className="nav-section">Workspace</span>
          {links.map((link) => {
            const active = isActive(link.href, link.exact);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link ${active ? 'active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <FontAwesomeIcon icon={link.icon} fixedWidth />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <Avatar id={user.id} name={user.name} />
            <div className="user-chip-text">
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>
          </div>
          <div className="sidebar-footer-row">
            <RoleBadge role={user.role} />
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
              <FontAwesomeIcon icon={faRightFromBracket} />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="nav-scrim" onClick={() => setNavOpen(false)} />

      <div className="main">
        <header className="topbar-mobile">
          <button className="icon-btn" onClick={() => setNavOpen(true)} aria-label="Open menu">
            <FontAwesomeIcon icon={faBars} />
          </button>
          <span className="brand-name">SupportDesk</span>
          <Avatar id={user.id} name={user.name} size="sm" />
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
};

export default AppShell;
