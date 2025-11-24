import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

/**
 * Obtém cores baseadas na raridade
 */
function getRarityColors(rarity: string) {
  switch (rarity) {
    case "rare":
      return {
        gradient: "from-green-500 via-emerald-500 to-teal-600",
        gradientColors: "rgba(34, 197, 94, 0.8), rgba(16, 185, 129, 0.8), rgba(13, 148, 136, 0.8)",
        bg: "linear-gradient(to right, #22c55e, #10b981)",
        accent: "#22c55e",
        label: "💎 RARE",
      };
    case "epic":
      return {
        gradient: "from-purple-600 via-pink-600 to-purple-700",
        gradientColors: "rgba(147, 51, 234, 0.8), rgba(219, 39, 119, 0.8), rgba(147, 51, 234, 0.8)",
        bg: "linear-gradient(to right, #9333ea, #db2777)",
        accent: "#9333ea",
        label: "✨ EPIC",
      };
    case "legendary":
      return {
        gradient: "from-yellow-400 via-orange-500 to-amber-600",
        gradientColors: "rgba(250, 204, 21, 0.8), rgba(249, 115, 22, 0.8), rgba(217, 119, 6, 0.8)",
        bg: "linear-gradient(to right, #facc15, #f97316)",
        accent: "#facc15",
        label: "⭐ LEGENDARY",
      };
    default:
      return {
        gradient: "from-blue-500 via-cyan-500 to-blue-600",
        gradientColors: "rgba(59, 130, 246, 0.8), rgba(6, 182, 212, 0.8), rgba(37, 99, 235, 0.8)",
        bg: "linear-gradient(to right, #3b82f6, #06b6d4)",
        accent: "#3b82f6",
        label: "🎫 COMMON",
      };
  }
}

/**
 * Obtém estilos do status
 */
function getStatusStyles(status: string): string {
  switch (status) {
    case "minted":
      return "background: #dcfce7; color: #166534;";
    case "valid":
      return "background: #dbeafe; color: #1e40af;";
    case "canceled":
      return "background: #fee2e2; color: #991b1b;";
    default:
      return "background: #f3f4f6; color: #374151;";
  }
}

/**
 * Formata data para exibição
 */
function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Cria uma imagem placeholder em base64 para quando não há banner
 */
function createPlaceholderImage(gradientColors: string): string {
  // Retorna um SVG gradiente simples em base64
  const svg = `
    <svg width="800" height="400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:rgba(147, 51, 234, 0.8);stop-opacity:1" />
          <stop offset="50%" style="stop-color:rgba(219, 39, 119, 0.8);stop-opacity:1" />
          <stop offset="100%" style="stop-color:rgba(147, 51, 234, 0.8);stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="800" height="400" fill="url(#grad)"/>
    </svg>
  `.trim();
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/**
 * Substitui placeholders no template HTML
 */
function replaceTemplate(template: string, ticket: any): string {
  const colors = getRarityColors(ticket.rarity);
  const bannerUrl = ticket.bannerUrl || ticket.event?.bannerUrl || "";

  // Prepara dados para substituição
  const replacements: Record<string, string> = {
    BANNER_URL: bannerUrl || createPlaceholderImage(colors.gradientColors),
    GRADIENT_COLORS: colors.gradientColors,
    RARITY_BG: colors.bg,
    RARITY_LABEL: colors.label,
    ACCENT_COLOR: colors.accent,
    TICKET_NAME: escapeHtml(ticket.name),
    EVENT_NAME: ticket.event?.name ? escapeHtml(ticket.event.name) : "",
    DESCRIPTION: ticket.description ? escapeHtml(ticket.description) : "",
    EVENT_DATE: ticket.event ? formatDate(ticket.event.startDate) : "",
    COMPANY_NAME: ticket.event?.company?.name
      ? escapeHtml(ticket.event.company.name)
      : "",
    SEAT_SECTOR: [ticket.sector, ticket.seat]
      .filter(Boolean)
      .join(" - Assento ") || "",
    EXTERNAL_ID: ticket.externalId,
    STATUS_LABEL:
      ticket.status === "minted"
        ? "✓ NFT"
        : ticket.status === "valid"
        ? "✓ Válido"
        : ticket.status === "canceled"
        ? "✗ Cancelado"
        : ticket.status,
    TOKEN_ID: ticket.tokenId || "",
    STATUS_STYLES: getStatusStyles(ticket.status),
  };

  let html = template;

  // Substitui placeholders simples
  Object.entries(replacements).forEach(([key, value]) => {
    html = html.replace(new RegExp(`{{${key}}}`, "g"), value);
  });

  // Processa blocos condicionais ({{#KEY}}...{{/KEY}})
  html = html.replace(/{{#(\w+)}}([\s\S]*?){{\/\1}}/g, (match, key, content) => {
    const value = replacements[key] || "";
    return value ? content : "";
  });

  return html;
}

/**
 * Escapa HTML para prevenir XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Gera imagem PNG do ticket
 */
export async function generateTicketImage(ticket: any): Promise<Buffer> {
  // Lê o template HTML
  // Tenta primeiro em dist (produção), depois em src (desenvolvimento)
  const possiblePaths = [
    path.join(__dirname, "../templates/ticket-template.html"), // dist/templates (produção)
    path.join(__dirname, "../../src/templates/ticket-template.html"), // src/templates (desenvolvimento)
    path.join(process.cwd(), "src/templates/ticket-template.html"), // fallback
  ];

  let templatePath: string | null = null;
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      templatePath = possiblePath;
      break;
    }
  }

  if (!templatePath) {
    throw new Error(
      "Template HTML não encontrado. Verifique se o arquivo src/templates/ticket-template.html existe."
    );
  }

  const template = fs.readFileSync(templatePath, "utf-8");

  // Substitui placeholders
  const html = replaceTemplate(template, ticket);

  // Inicia Puppeteer
  // Configuração específica para macOS ARM64 (Apple Silicon)
  let executablePath: string | undefined;
  try {
    executablePath = puppeteer.executablePath();
    // Verifica se o executável existe e é válido
    if (executablePath && fs.existsSync(executablePath)) {
      // Verifica se não é um binário Linux (verifica se contém 'linux' no caminho)
      if (executablePath.includes("linux") && process.platform === "darwin") {
        console.warn(
          "⚠️  Executável Linux detectado em macOS. Limpando cache..."
        );
        // Não usa o executável incorreto
        executablePath = undefined;
      }
    } else {
      // Executável não existe - precisa instalar
      throw new Error(
        "Chromium não encontrado. Execute: npx puppeteer browsers install chrome"
      );
    }
  } catch (error: any) {
    const errorMsg = error?.message || "Erro desconhecido";
    if (
      errorMsg.includes("not found") ||
      errorMsg.includes("não encontrado")
    ) {
      throw new Error(
        "Chromium não está instalado. Execute no diretório backend: npx puppeteer browsers install chrome"
      );
    }
    console.warn(
      "Não foi possível obter o caminho do executável do Puppeteer:",
      error
    );
    executablePath = undefined;
  }

  const launchOptions: any = {
    headless: true,
    // Só usa executablePath se for válido e correto para a plataforma
    ...(executablePath &&
      fs.existsSync(executablePath) && { executablePath }),
    args: [
      // Em macOS, não precisa de --no-sandbox (pode causar problemas)
      ...(process.platform !== "darwin"
        ? ["--no-sandbox", "--disable-setuid-sandbox"]
        : []),
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      // Flags específicas para macOS
      ...(process.platform === "darwin"
        ? [
            "--disable-software-rasterizer",
            "--disable-background-timer-throttling",
            "--disable-backgrounding-occluded-windows",
            "--disable-renderer-backgrounding",
          ]
        : ["--disable-gpu"]),
    ],
  };

  // Em macOS, não usar --no-zygote (não é necessário e pode causar problemas)
  if (process.platform !== "darwin") {
    launchOptions.args?.push("--no-zygote");
  }

  let browser;
  try {
    browser = await puppeteer.launch(launchOptions);
  } catch (error: any) {
    const errorMessage =
      error?.message || "Erro desconhecido ao iniciar o navegador";
    console.error("Erro ao iniciar Puppeteer:", errorMessage);
    console.error("Executável tentado:", executablePath);
    console.error("Plataforma:", process.platform, process.arch);

    // Se falhou e estamos em macOS, tenta sem especificar o executável
    if (process.platform === "darwin" && executablePath) {
      console.log("🔄 Tentando sem especificar executablePath...");
      try {
        const fallbackOptions = {
          ...launchOptions,
          executablePath: undefined,
        };
        browser = await puppeteer.launch(fallbackOptions);
      } catch (fallbackError: any) {
        throw new Error(
          `Falha ao iniciar o navegador: ${errorMessage}. Erro no fallback: ${fallbackError?.message}. ` +
            `Tente executar: rm -rf ~/.cache/puppeteer && npm install`
        );
      }
    } else {
      throw new Error(
        `Falha ao iniciar o navegador: ${errorMessage}. Verifique se o Chromium foi instalado corretamente. ` +
          `Tente executar: rm -rf ~/.cache/puppeteer && npm install`
      );
    }
  }

  try {
    const page = await browser.newPage();

    // Define viewport
    await page.setViewport({
      width: 800,
      height: 1200,
      deviceScaleFactor: 2, // Para melhor qualidade (retina)
    });

    // Carrega HTML
    await page.setContent(html, { waitUntil: "networkidle0" });

    // Aguarda carregamento de imagens
    // Usa string para evitar problemas de tipo (código executa no navegador, não Node.js)
    await page.evaluate(`
      (function() {
        return Promise.all(
          Array.from(document.images).map(function(img) {
            if (img.complete) return Promise.resolve();
            return new Promise(function(resolve) {
              img.onload = function() { resolve(); };
              img.onerror = function() { resolve(); };
              setTimeout(function() { resolve(); }, 5000);
            });
          })
        );
      })()
    `);

    // Aguarda um pouco mais para garantir que tudo está renderizado
    // waitForTimeout foi removido no Puppeteer 24+, usando setTimeout como alternativa
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Gera screenshot
    const screenshot = (await page.screenshot({
      type: "png",
      fullPage: false,
      clip: {
        x: 0,
        y: 0,
        width: 800,
        height: 1200,
      },
    })) as Buffer;

    return screenshot;
  } finally {
    await browser.close();
  }
}

