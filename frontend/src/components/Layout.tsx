import React, { useState, useCallback, memo } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button, Container } from "./ui";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = useCallback(
    (e?: React.MouseEvent) => {
      e?.preventDefault();
      e?.stopPropagation();
      setIsMenuOpen(false);
      logout();
      navigate("/login");
    },
    [logout, navigate]
  );

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <Container>
          <div className="flex justify-between items-center py-2 sm:py-4">
            <div
              className="flex items-center gap-2 sm:gap-3"
              title="Carteira Unificada de Ingressos Digitais"
            >
              <img
                src="/wallet-icon.svg"
                alt="Carteira"
                className="w-6 h-6 sm:w-8 sm:h-8"
              />
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                CUID
              </h1>
            </div>
            {user && (
              <>
                {/* Desktop: Layout horizontal */}
                <div className="hidden sm:flex items-center gap-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">{user.email}</span>
                    {user.walletAddress && (
                      <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                        {user.walletAddress.slice(0, 6)}...
                        {user.walletAddress.slice(-4)}
                      </span>
                    )}
                  </div>
                  <Button variant="danger" size="sm" onClick={handleLogout}>
                    Sair
                  </Button>
                </div>

                {/* Mobile: Menu hambúrguer */}
                <div className="sm:hidden relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMenu();
                    }}
                    className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 relative z-30"
                    aria-label="Menu"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      {isMenuOpen ? (
                        <path d="M6 18L18 6M6 6l12 12" />
                      ) : (
                        <path d="M4 6h16M4 12h16M4 18h16" />
                      )}
                    </svg>
                  </button>

                  {/* Menu dropdown */}
                  {isMenuOpen && (
                    <>
                      {/* Overlay para fechar o menu ao clicar fora */}
                      <div
                        className="fixed inset-0 z-40 sm:hidden"
                        onClick={() => setIsMenuOpen(false)}
                      />
                      <div
                        className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 py-2 z-50"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="px-4 py-3 border-b border-gray-200">
                          <div className="text-sm text-gray-600 break-all mb-2">
                            {user.email}
                          </div>
                          {user.walletAddress && (
                            <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded block w-fit">
                              {user.walletAddress.slice(0, 6)}...
                              {user.walletAddress.slice(-4)}
                            </span>
                          )}
                        </div>
                        <div className="px-2">
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={handleLogout}
                            className="w-full"
                          >
                            Sair
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </Container>
      </header>
      <main className="flex-1 py-6 sm:py-8">
        <Container>{children}</Container>
      </main>
    </div>
  );
}
