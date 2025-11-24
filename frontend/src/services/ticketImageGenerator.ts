// Lazy import para reduzir bundle size inicial
let toPng: typeof import("html-to-image").toPng | null = null;

async function getToPng() {
  if (!toPng) {
    const htmlToImage = await import("html-to-image");
    toPng = htmlToImage.toPng;
  }
  return toPng;
}

/**
 * Opções para geração de imagem
 */
export interface GenerateImageOptions {
  quality?: number; // 0 a 1
  pixelRatio?: number; // Para melhor qualidade (2 = retina)
  backgroundColor?: string;
}

/**
 * Gera imagem PNG de um elemento HTML
 */
export async function generateTicketImage(
  element: HTMLElement,
  options: GenerateImageOptions = {}
): Promise<string> {
  const {
    quality = 1.0,
    pixelRatio = 2,
    backgroundColor = "#ffffff",
  } = options;

  try {
    // Salva estilos originais do elemento principal
    const originalElementStyle = {
      position: element.style.position,
      transform: element.style.transform,
      margin: element.style.margin,
      padding: element.style.padding,
      overflow: element.style.overflow,
      maxWidth: element.style.maxWidth,
      width: element.style.width,
      left: element.style.left,
      right: element.style.right,
    };

    // Ajusta o elemento para captura completa e centralizado
    const computedStyle = window.getComputedStyle(element);
    element.style.position = "relative";
    element.style.transform = "none";
    element.style.overflow = "hidden"; // Muda para hidden para não capturar sombras extras
    element.style.margin = "0"; // Remove margens que podem causar deslocamento
    element.style.padding = "0"; // Remove padding que pode causar espaço extra
    element.style.left = "0";
    element.style.right = "0";
    element.style.bottom = "0";

    // Calcula dimensões baseadas no aspectRatio
    const aspectRatio = computedStyle.aspectRatio;
    let width = 270; // Mesma largura do frontend (redução de 25%)
    let height = 480; // 9:16 = 270:480

    if (aspectRatio && aspectRatio !== "auto") {
      // Calcula altura baseada na largura e aspectRatio
      const currentWidth = parseFloat(computedStyle.width) || 270;
      const [ratioW, ratioH] = aspectRatio.split("/").map(Number);
      width = currentWidth;
      height = Math.ceil((width * ratioH) / ratioW);
    } else {
      // Se não tiver aspectRatio, usa as dimensões calculadas
      const rect = element.getBoundingClientRect();
      width = Math.ceil(rect.width) || 270;
      height = Math.ceil(rect.height) || 480;
    }

    // Define dimensões fixas
    element.style.width = `${width}px`;
    element.style.height = `${height}px`;
    element.style.maxWidth = `${width}px`;
    element.style.maxHeight = `${height}px`;
    element.style.minHeight = `${height}px`;
    element.style.boxSizing = "border-box";
    element.style.display = "block";

    // Remove sombras projetadas que podem estar causando espaço extra
    const shadowElements = element.querySelectorAll(
      '.ticket-shadow, [class*="absolute"][class*="bottom"]'
    );
    shadowElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      const computedStyle = window.getComputedStyle(htmlEl);
      if (
        computedStyle.position === "absolute" &&
        (computedStyle.bottom || htmlEl.classList.contains("ticket-shadow"))
      ) {
        htmlEl.style.display = "none"; // Esconde sombras durante captura
      }
    });

    // Desabilita animações e transformações temporariamente
    const originalStyles: Array<{
      element: HTMLElement;
      transition: string;
      transform: string;
    }> = [];

    const allElements = element.querySelectorAll("*");
    allElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      const computedStyle = window.getComputedStyle(htmlEl);

      originalStyles.push({
        element: htmlEl,
        transition: htmlEl.style.transition || "",
        transform: htmlEl.style.transform || "",
      });

      // Remove transições e transformações durante captura
      htmlEl.style.transition = "none";
      // Remove transformações 3D que podem causar deslocamento
      if (computedStyle.transform && computedStyle.transform !== "none") {
        htmlEl.style.transform = "none";
      }
    });

    try {
      // Aguarda um pouco para garantir que tudo está renderizado
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Scroll para o elemento para garantir que está visível
      element.scrollIntoView({ behavior: "instant", block: "center" });
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Usa as dimensões já calculadas acima
      console.log(`Capturando elemento: ${width}x${height}px`);

      // Ajusta o container pai se existir para garantir que não corte
      const parent = element.parentElement;
      let originalParentStyle: {
        overflow?: string;
        maxWidth?: string;
        width?: string;
        padding?: string;
        margin?: string;
      } = {};

      if (parent) {
        originalParentStyle = {
          overflow: parent.style.overflow,
          maxWidth: parent.style.maxWidth,
          width: parent.style.width,
          padding: parent.style.padding,
          margin: parent.style.margin,
        };
        // Remove restrições e espaços extras do container pai durante captura
        parent.style.overflow = "visible";
        parent.style.maxWidth = "none";
        parent.style.padding = "0";
        parent.style.margin = "0";
        if (width > 0) {
          parent.style.width = `${width}px`;
        }
      }

      try {
        // Garante que o elemento tenha exatamente as dimensões calculadas
        element.style.boxSizing = "border-box";
        element.style.display = "block";

        // Garante que o conteúdo interno também ocupe toda a altura
        const container3D = element.querySelector(
          '[style*="perspective"]'
        ) as HTMLElement;
        const innerCard = element.querySelector(
          '[class*="rounded-2xl"]'
        ) as HTMLElement;
        let originalContainerHeight = "";
        let originalInnerHeight = "";
        let originalInnerDisplay = "";
        let originalContentHeight = "";
        let originalContentDisplay = "";

        // Ajusta container 3D
        if (container3D) {
          originalContainerHeight = container3D.style.height;
          container3D.style.height = "100%";
          container3D.style.margin = "0";
          container3D.style.padding = "0";
        }

        if (innerCard) {
          originalInnerHeight = innerCard.style.height;
          originalInnerDisplay = innerCard.style.display;
          innerCard.style.height = "100%";
          innerCard.style.display = "block";
          innerCard.style.margin = "0";
          innerCard.style.padding = "0";

          const cardContent = innerCard.querySelector(
            '[class*="bg-white"]'
          ) as HTMLElement;
          if (cardContent) {
            originalContentHeight = cardContent.style.height;
            originalContentDisplay = cardContent.style.display;
            cardContent.style.height = "100%";
            cardContent.style.display = "flex";
            cardContent.style.flexDirection = "column";
            cardContent.style.margin = "0";
            cardContent.style.padding = "0";
          }
        }

        try {
          // Força repaint múltiplas vezes para garantir renderização
          void element.offsetHeight;
          void element.scrollHeight;
          await new Promise((resolve) => setTimeout(resolve, 200));

          const toPngFn = await getToPng();
          const dataUrl = await toPngFn(element, {
            quality,
            pixelRatio,
            backgroundColor,
            cacheBust: true,
            // Aguarda fontes e imagens carregarem
            fontEmbedCSS: "",
            // Captura o elemento completo
            includeQueryParams: true,
          });

          return dataUrl;
        } finally {
          // Restaura alturas originais
          if (container3D) {
            container3D.style.height = originalContainerHeight;
          }
          if (innerCard) {
            innerCard.style.height = originalInnerHeight;
            innerCard.style.display = originalInnerDisplay;
            const cardContent = innerCard.querySelector(
              '[class*="bg-white"]'
            ) as HTMLElement;
            if (cardContent) {
              cardContent.style.height = originalContentHeight;
              cardContent.style.display = originalContentDisplay;
            }
          }
        }
      } finally {
        // Restaura estilo do container pai
        if (parent) {
          parent.style.overflow = originalParentStyle.overflow || "";
          parent.style.maxWidth = originalParentStyle.maxWidth || "";
          parent.style.width = originalParentStyle.width || "";
          parent.style.padding = originalParentStyle.padding || "";
          parent.style.margin = originalParentStyle.margin || "";
        }

        // Restaura sombras
        shadowElements.forEach((el) => {
          const htmlEl = el as HTMLElement;
          htmlEl.style.display = "";
        });
      }
    } finally {
      // Restaura estilos originais do elemento principal
      element.style.position = originalElementStyle.position;
      element.style.transform = originalElementStyle.transform;
      element.style.margin = originalElementStyle.margin;
      element.style.padding = originalElementStyle.padding;
      element.style.overflow = originalElementStyle.overflow;
      element.style.maxWidth = originalElementStyle.maxWidth;
      element.style.width = originalElementStyle.width;
      element.style.left = originalElementStyle.left;
      element.style.right = originalElementStyle.right;

      // Restaura estilos de todos os elementos filhos
      originalStyles.forEach(({ element: el, transition, transform }) => {
        el.style.transition = transition;
        el.style.transform = transform;
      });
    }
  } catch (error: any) {
    console.error("Erro ao gerar imagem:", error);
    throw new Error(`Falha ao gerar imagem: ${error.message}`);
  }
}

/**
 * Converte data URL para blob e faz download
 */
export function downloadImage(dataUrl: string, filename: string): void {
  try {
    // Converte data URL para blob
    const link = document.createElement("a");
    link.download = filename;
    link.href = dataUrl;

    // Adiciona ao DOM temporariamente
    document.body.appendChild(link);
    link.click();

    // Remove do DOM
    document.body.removeChild(link);

    // Limpa a URL do objeto para liberar memória
    setTimeout(() => {
      URL.revokeObjectURL(dataUrl);
    }, 100);
  } catch (error: any) {
    console.error("Erro ao fazer download:", error);
    throw new Error(`Falha ao fazer download: ${error.message}`);
  }
}

/**
 * Gera e faz download da imagem do ticket
 * Recebe bannerBase64 (sempre base64 ou undefined) - conversão deve ser feita antes
 */
export async function generateAndDownloadTicketImage(
  elementId: string,
  bannerBase64: string | undefined,
  filename: string = "ticket.png",
  options: GenerateImageOptions = {}
): Promise<void> {
  try {
    // Encontra o elemento
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Elemento com id "${elementId}" não encontrado`);
    }

    // Encontra o elemento do header que contém o backgroundImage
    let headerElement = element.querySelector(".relative.h-48") as HTMLElement;
    if (!headerElement) {
      headerElement = element.querySelector(
        '[style*="backgroundImage"]'
      ) as HTMLElement;
    }
    if (!headerElement) {
      headerElement = element.querySelector(
        '[style*="background-image"]'
      ) as HTMLElement;
    }
    // Se ainda não encontrou, procura por qualquer div com backgroundImage no style
    if (!headerElement) {
      const allDivs = element.querySelectorAll("div");
      for (const div of Array.from(allDivs)) {
        const style =
          (div as HTMLElement).style.backgroundImage ||
          window.getComputedStyle(div).backgroundImage;
        if (style && style !== "none") {
          headerElement = div as HTMLElement;
          break;
        }
      }
    }

    // Se temos base64 e encontramos o elemento, substitui no DOM
    if (bannerBase64 && headerElement) {
      // Salva o estilo original
      const originalStyle = headerElement.getAttribute("style") || "";
      const originalBackgroundImage = headerElement.style.backgroundImage;

      // Atualiza o headerElement com base64
      headerElement.style.backgroundImage = `url(${bannerBase64})`;
      headerElement.style.setProperty(
        "background-image",
        `url(${bannerBase64})`,
        "important"
      );

      // Força repaint
      void headerElement.offsetHeight;
      void element.offsetHeight;

      // Aguarda a imagem carregar completamente
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          console.log("Imagem base64 carregada");
          resolve();
        };
        img.onerror = () => {
          console.warn(
            "Erro ao carregar imagem base64, continuando mesmo assim"
          );
          resolve();
        };
        img.src = bannerBase64;
        // Timeout de segurança
        setTimeout(() => resolve(), 2000);
      });

      // Aguarda um pouco mais para garantir renderização
      await new Promise((resolve) => setTimeout(resolve, 500));

      try {
        // Gera a imagem
        console.log("Gerando imagem...");
        const dataUrl = await generateTicketImage(element, options);
        downloadImage(dataUrl, filename);
        console.log("Imagem gerada com sucesso");
      } finally {
        // Restaura o estilo original
        if (originalStyle) {
          headerElement.setAttribute("style", originalStyle);
        } else {
          headerElement.removeAttribute("style");
        }
        if (originalBackgroundImage) {
          headerElement.style.backgroundImage = originalBackgroundImage;
        }
      }
    } else {
      // Sem banner ou não encontrou elemento, gera direto
      console.log("Gerando imagem sem banner ou elemento não encontrado");
      const dataUrl = await generateTicketImage(element, options);
      downloadImage(dataUrl, filename);
    }
  } catch (error: any) {
    console.error("Erro ao gerar e baixar imagem:", error);
    throw error;
  }
}
