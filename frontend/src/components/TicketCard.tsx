import { useState, useEffect, useRef } from "react";

interface TicketCardProps {
  ticket: {
    id: string;
    name: string;
    description?: string;
    rarity: string;
    bannerUrl?: string;
    status: string;
    seat?: string;
    sector?: string;
    tokenId?: string;
    amount: number;
    event?: {
      name: string;
      startDate: string;
      company?: {
        name: string;
      };
      bannerUrl?: string;
    };
  };
  onClick?: () => void;
  interactive?: boolean;
  id?: string;
  bannerBase64?: string;
}

export function TicketCard({
  ticket,
  onClick,
  interactive = true,
  id,
  bannerBase64,
}: TicketCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [shouldLoadImage, setShouldLoadImage] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const getRarityColors = () => {
    switch (ticket.rarity) {
      case "rare":
        return {
          gradient: "from-green-500 via-emerald-500 to-teal-600",
          border: "border-emerald-400",
          glow: "shadow-emerald-500/50",
          accent: "text-emerald-200",
        };
      case "epic":
        return {
          gradient: "from-purple-600 via-pink-600 to-purple-700",
          border: "border-purple-500",
          glow: "shadow-purple-500/50",
          accent: "text-purple-200",
        };
      case "legendary":
        return {
          gradient: "from-yellow-400 via-orange-500 to-amber-600",
          border: "border-yellow-400",
          glow: "shadow-yellow-500/50",
          accent: "text-yellow-200",
        };
      default:
        return {
          gradient: "from-blue-500 via-cyan-500 to-blue-600",
          border: "border-blue-400",
          glow: "shadow-blue-500/50",
          accent: "text-blue-200",
        };
    }
  };

  const colors = getRarityColors();
  const bannerUrl = bannerBase64 || ticket.bannerUrl || ticket.event?.bannerUrl;

  useEffect(() => {
    if (!bannerUrl || bannerUrl.startsWith("data:")) {
      setShouldLoadImage(true);
      setImageLoaded(true);
      return;
    }

    let observer: IntersectionObserver | null;

    const isMobile =
      window.innerWidth < 768 ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

    const setupObserver = () => {
      if (!cardRef.current) {
        requestAnimationFrame(setupObserver);
        return;
      }

      if (isMobile) {
        const cardId = id || `ticket-card-${ticket.id}`;
        const allCards = document.querySelectorAll('[id^="ticket-card-"]');
        const cardIndex = Array.from(allCards).findIndex(
          (card) => card.id === cardId
        );

        if (cardIndex < 3) {
          setShouldLoadImage(true);
          return;
        }
      }

      if ("IntersectionObserver" in window) {
        observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                setShouldLoadImage(true);
                observer?.disconnect();
              }
            });
          },
          {
            rootMargin: isMobile ? "100px" : "50px",
            threshold: 0.01,
          }
        );

        if (cardRef.current) {
          observer.observe(cardRef.current);
        }
      } else {
        setShouldLoadImage(true);
      }
    };

    setupObserver();

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [bannerUrl, id, ticket.id]);

  useEffect(() => {
    if (!shouldLoadImage || !bannerUrl || bannerUrl.startsWith("data:")) {
      if (bannerUrl && bannerUrl.startsWith("data:")) {
        setImageLoaded(true);
      }
      return;
    }

    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.onerror = () => setImageLoaded(true);
    img.src = bannerUrl;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [shouldLoadImage, bannerUrl]);

  return (
    <div
      ref={cardRef}
      id={id || `ticket-card-${ticket.id}`}
      className={`relative mx-auto ${interactive ? "cursor-pointer" : ""}`}
      style={{
        width: "270px",
        height: "480px",
        aspectRatio: "9/16",
        maxWidth: "100%",
        maxHeight: "100vh",
      }}
      onClick={onClick}
      onMouseEnter={() => interactive && setIsFlipped(true)}
      onMouseLeave={() => interactive && setIsFlipped(false)}
    >
      <div
        className={`relative transition-all duration-500 h-full ${
          isFlipped && interactive
            ? "transform -translate-y-2 scale-105"
            : "transform scale-100"
        }`}
        style={{
          perspective: "1000px",
          transformStyle: "preserve-3d",
          height: "100%",
        }}
      >
        <div
          className={`relative bg-gradient-to-br ${
            colors.gradient
          } rounded-2xl p-1 ${colors.border} border-2 ${
            colors.glow
          } shadow-2xl overflow-hidden h-full ${
            isFlipped && interactive ? "rotate-y-5" : ""
          } transition-all duration-500`}
          style={{
            transform:
              isFlipped && interactive
                ? "rotateY(5deg) rotateX(-2deg)"
                : "rotateY(0deg) rotateX(0deg)",
            height: "100%",
          }}
        >
          {isFlipped && interactive && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer pointer-events-none" />
          )}

          <div className="bg-white rounded-xl overflow-hidden h-full flex flex-col">
            <div
              className="relative flex-shrink-0 overflow-hidden"
              style={{
                height: "50%",
                minHeight: "0",
                backgroundImage:
                  bannerUrl &&
                  (shouldLoadImage ||
                    imageLoaded ||
                    bannerUrl.startsWith("data:"))
                    ? `url(${bannerUrl})`
                    : `linear-gradient(135deg, ${colors.gradient})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                transition: "opacity 0.3s ease-in-out",
                opacity:
                  bannerUrl &&
                  !imageLoaded &&
                  shouldLoadImage &&
                  !bannerUrl.startsWith("data:")
                    ? 0.8
                    : 1,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />

              <div
                className={`absolute inset-0 bg-gradient-to-r ${
                  colors.gradient
                } opacity-0 ${
                  isFlipped && interactive ? "opacity-10" : ""
                } transition-opacity duration-500`}
                style={{
                  mixBlendMode: "overlay",
                }}
              />

              <div className="relative h-full flex flex-col justify-between p-4">
                <div className="flex justify-end">
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg ${
                      ticket.rarity === "rare"
                        ? "bg-gradient-to-r from-green-500 to-emerald-600"
                        : ticket.rarity === "epic"
                        ? "bg-gradient-to-r from-purple-600 to-pink-600"
                        : ticket.rarity === "legendary"
                        ? "bg-gradient-to-r from-yellow-400 to-orange-500"
                        : "bg-blue-600"
                    }`}
                  >
                    {ticket.rarity === "rare"
                      ? "💎 RARE"
                      : ticket.rarity === "epic"
                      ? "✨ EPIC"
                      : ticket.rarity === "legendary"
                      ? "⭐ LEGENDARY"
                      : "🎫 COMMON"}
                  </div>
                </div>

                <div>
                  {ticket.event?.name && (
                    <div
                      className={`text-sm font-semibold ${colors.accent} mb-1 drop-shadow-lg`}
                    >
                      {ticket.event.name}
                    </div>
                  )}
                  <h3 className="text-lg sm:text-xl font-bold text-white drop-shadow-lg leading-tight">
                    {ticket.name}
                  </h3>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                {ticket.description && (
                  <p className="text-xs sm:text-sm text-gray-600 line-clamp-3">
                    {ticket.description}
                  </p>
                )}

                {ticket.event && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>
                      {new Date(ticket.event.startDate).toLocaleDateString(
                        "pt-BR",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                  </div>
                )}

                {ticket.event?.company?.name && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    <span>{ticket.event.company.name}</span>
                  </div>
                )}

                {(ticket.seat || ticket.sector) && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span>
                      {ticket.sector && `${ticket.sector}`}
                      {ticket.seat && ` - Assento ${ticket.seat}`}
                    </span>
                  </div>
                )}
              </div>

              <div className="relative h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-2">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white px-2">
                    <div
                      className={`w-2 h-2 rounded-full bg-gradient-to-r ${colors.gradient}`}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <div
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      ticket.status === "minted"
                        ? "bg-green-100 text-green-800"
                        : ticket.status === "valid"
                        ? "bg-blue-100 text-blue-800"
                        : ticket.status === "canceled"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {ticket.status === "minted"
                      ? "✓ NFT"
                      : ticket.status === "valid"
                      ? "✓ Válido"
                      : ticket.status === "canceled"
                      ? "✗ Cancelado"
                      : ticket.status}
                  </div>
                </div>

                {ticket.tokenId && (
                  <div className="text-xs font-mono text-gray-400">
                    #{ticket.tokenId}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div
          className={`absolute inset-x-0 -bottom-4 h-8 bg-black/20 blur-xl rounded-full transition-all duration-500 ticket-shadow ${
            isFlipped && interactive ? "opacity-50 scale-110" : "opacity-30"
          }`}
        />
      </div>

      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
