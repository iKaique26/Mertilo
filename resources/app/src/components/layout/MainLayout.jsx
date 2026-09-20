/**
 * MainLayout - Layout principal que envolve toda a aplicação
 */

import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function MainLayout({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-panel">
        <Header />
        {children}
      </main>
    </div>
  );
}
