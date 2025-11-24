import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { Layout } from "../components/Layout";
import { Card, Alert, Loading, TicketCard } from "../components/ui";

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
      email?: string;
    };
  };
  user?: {
    email: string;
    walletAddress?: string;
  };
}

export function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }

    if (user) {
      if ("requestIdleCallback" in window) {
        requestIdleCallback(
          () => {
            fetchTickets();
          },
          { timeout: 200 }
        );
      } else {
        setTimeout(() => {
          fetchTickets();
        }, 50);
      }
    }
  }, [user, authLoading, navigate]);

  const fetchTickets = async () => {
    try {
      const response = await api.get("/tickets");
      setTickets(response.data.tickets || []);
    } catch (err: any) {
      setError(err.response?.data?.error || "Erro ao carregar tickets");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <Loading text="Carregando..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
          Meus Ingressos
        </h2>

        {error && (
          <Alert variant="error" className="mb-6" onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loading text="Carregando tickets..." />
          </div>
        ) : tickets.length === 0 ? (
          <Card className="p-8 sm:p-12 text-center">
            <div className="max-w-md mx-auto">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 002 2h3a2 2 0 002-2V7a2 2 0 00-2-2H5zM5 15a2 2 0 00-2 2v3a2 2 0 002 2h3a2 2 0 002-2v-3a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h3a2 2 0 012 2v3a2 2 0 01-2 2h-3a2 2 0 01-2-2V5zM11 15a2 2 0 012-2h3a2 2 0 012 2v3a2 2 0 01-2 2h-3a2 2 0 01-2-2v-3z"
                />
              </svg>
              <p className="text-lg text-gray-600">
                Você ainda não possui tickets.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
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
                onClick={() => navigate(`/tickets/${ticket.id}`)}
                interactive={true}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
