import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { Layout } from "../components/Layout";
import { Button, Loading, Alert, TicketCard } from "../components/ui";
import { urlToBase64Cached } from "../services/imageUtils";

let generateAndDownloadTicketImage:
  | typeof import("../services/ticketImageGenerator").generateAndDownloadTicketImage
  | null = null;

async function getGenerateAndDownloadTicketImage() {
  if (!generateAndDownloadTicketImage) {
    const module = await import("../services/ticketImageGenerator");
    generateAndDownloadTicketImage = module.generateAndDownloadTicketImage;
  }
  return generateAndDownloadTicketImage;
}

interface Ticket {
  id: string;
  externalId: string;
  name: string;
  description?: string;
  status: string;
  rarity: string;
  bannerUrl?: string;
  amount: number;
  seat?: string;
  sector?: string;
  tokenId?: string;
  txHash?: string;
  createdAt: string;
  event?: {
    id: string;
    name: string;
    description?: string;
    bannerUrl?: string;
    startDate: string;
    endDate?: string;
    company: {
      name: string;
      email: string;
    };
  };
  user: {
    email: string;
    walletAddress?: string;
  };
}

export function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatingImage, setGeneratingImage] = useState(false);
  const [bannerBase64, setBannerBase64] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }

    if (id) {
      fetchTicket();
    }
  }, [id, user, authLoading, navigate]);

  useEffect(() => {
    const convertBanner = async () => {
      const bannerUrl = ticket?.bannerUrl || ticket?.event?.bannerUrl;
      if (bannerUrl && !bannerUrl.startsWith("data:")) {
        try {
          if ("requestIdleCallback" in window) {
            requestIdleCallback(
              async () => {
                const base64 = await urlToBase64Cached(bannerUrl);
                setBannerBase64(base64);
              },
              { timeout: 2000 }
            );
          } else {
            setTimeout(async () => {
              const base64 = await urlToBase64Cached(bannerUrl);
              setBannerBase64(base64);
            }, 100);
          }
        } catch (error) {
          console.warn("Não foi possível converter banner para base64:", error);
        }
      }
    };

    if (ticket) {
      convertBanner();
    }
  }, [ticket]);

  const fetchTicket = async () => {
    try {
      const response = await api.get(`/tickets/${id}`);
      setTicket(response.data.ticket);
    } catch (err: any) {
      if (err.response?.status === 404 || err.response?.status === 403) {
        setError(
          "Ticket não encontrado ou você não tem permissão para visualizá-lo"
        );
      } else {
        setError(err.response?.data?.error || "Erro ao carregar ticket");
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <Loading text="Carregando ticket..." />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
        <Button variant="primary" onClick={() => navigate("/dashboard")}>
          Voltar
        </Button>
      </Layout>
    );
  }

  if (!ticket) {
    return null;
  }

  const sepoliaExplorerUrl = ticket.txHash
    ? `https://sepolia.etherscan.io/tx/${ticket.txHash}`
    : null;
  const sepoliaTokenUrl = ticket.tokenId
    ? `https://sepolia.etherscan.io/token/${
        import.meta.env.VITE_CONTRACT_ADDRESS || ""
      }?a=${ticket.tokenId}`
    : null;

  const handleDownloadImage = async () => {
    if (!ticket) return;

    setGeneratingImage(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));

      const elementId = `ticket-card-${ticket.id}`;
      let bannerToUse = bannerBase64;

      if (!bannerToUse) {
        const bannerUrl = ticket.bannerUrl || ticket.event?.bannerUrl;
        if (bannerUrl && !bannerUrl.startsWith("data:")) {
          try {
            bannerToUse = await urlToBase64Cached(bannerUrl);
            setBannerBase64(bannerToUse);
            await new Promise((resolve) => setTimeout(resolve, 200));
          } catch (error) {
            console.warn("Erro ao converter banner para base64:", error);
            bannerToUse = undefined;
          }
        } else if (bannerUrl && bannerUrl.startsWith("data:")) {
          bannerToUse = bannerUrl;
        }
      }

      const filename = `ticket-${ticket.externalId || ticket.id}.png`;
      const generateFn = await getGenerateAndDownloadTicketImage();

      await generateFn(elementId, bannerToUse, filename, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
    } catch (error: any) {
      console.error("Erro ao gerar imagem:", error);
      alert(`Erro ao gerar imagem: ${error.message}`);
    } finally {
      setGeneratingImage(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Button variant="secondary" onClick={() => navigate("/dashboard")}>
            ← Voltar
          </Button>
          <Button
            variant="primary"
            onClick={handleDownloadImage}
            disabled={generatingImage}
            className="flex items-center gap-2"
          >
            {generatingImage ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Gerando...
              </>
            ) : (
              <>
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
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Baixar Imagem
              </>
            )}
          </Button>
        </div>

        <div className="flex justify-center mb-8">
          <div className="w-full flex justify-center">
            <TicketCard
              id={`ticket-card-${ticket.id}`}
              ticket={{
                id: ticket.id,
                name: ticket.name,
                description: ticket.description,
                rarity: ticket.rarity,
                bannerUrl: ticket.bannerUrl,
                status: ticket.status,
                seat: ticket.seat,
                sector: ticket.sector,
                tokenId: ticket.tokenId,
                amount: ticket.amount,
                event: ticket.event
                  ? {
                      name: ticket.event.name,
                      startDate: ticket.event.startDate,
                      company: ticket.event.company,
                      bannerUrl: ticket.event.bannerUrl,
                    }
                  : undefined,
              }}
              interactive={true}
              bannerBase64={bannerBase64}
            />
          </div>
        </div>

        {(ticket.tokenId ||
          ticket.txHash ||
          ticket.externalId ||
          ticket.user.walletAddress) && (
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 space-y-6">
            {(ticket.tokenId || ticket.txHash || sepoliaTokenUrl) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-3 text-center">
                  Informações Blockchain
                </div>
                <div className="space-y-2">
                  {ticket.tokenId && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 font-medium">
                        Token ID:
                      </span>
                      <span className="font-mono font-bold text-gray-900">
                        #{ticket.tokenId}
                      </span>
                    </div>
                  )}
                  {ticket.txHash && sepoliaExplorerUrl && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 font-medium">
                        Transação:
                      </span>
                      <a
                        href={sepoliaExplorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 transition-colors font-medium underline text-xs break-all ml-2"
                      >
                        Ver →
                      </a>
                    </div>
                  )}
                  {sepoliaTokenUrl && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 font-medium">NFT:</span>
                      <a
                        href={sepoliaTokenUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 transition-colors font-medium underline text-xs break-all ml-2"
                      >
                        Ver →
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {ticket.externalId && (
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-center mb-2">
                  Código do Ticket
                </div>
                <div className="font-mono text-sm font-bold text-gray-900 text-center tracking-wider break-all">
                  {ticket.externalId}
                </div>
              </div>
            )}

            {ticket.user.walletAddress && (
              <div className="border-t border-dashed border-gray-300 pt-4">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 text-center">
                  Carteira Blockchain
                </div>
                <div className="font-mono text-xs text-gray-700 bg-gray-50 p-2 rounded border border-gray-200 break-all text-center">
                  {ticket.user.walletAddress}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
