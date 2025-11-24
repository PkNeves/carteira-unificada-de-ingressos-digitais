import api from './api';

/**
 * Converte uma URL de imagem para base64
 * Usa o backend para evitar problemas de CORS
 */
export async function urlToBase64(url: string): Promise<string> {
  // Se já for base64, retorna direto
  if (url.startsWith('data:')) {
    return url;
  }

  try {
    // Usa o backend para converter (não tem restrições de CORS)
    const response = await api.get('/tickets/image/convert', {
      params: { url },
    });

    if (response.data?.base64) {
      return response.data.base64;
    }

    throw new Error('Resposta inválida do servidor');
  } catch (error: any) {
    console.warn('Erro ao converter imagem para base64 via backend:', error);
    
    // Fallback: tenta converter direto no frontend (pode falhar por CORS)
    try {
      const response = await fetch(url, {
        mode: 'cors',
        credentials: 'omit',
      });

      if (!response.ok) {
        throw new Error(`Erro ao carregar imagem: ${response.statusText}`);
      }

      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (fetchError: any) {
      throw new Error(
        `Não foi possível carregar a imagem. Erro: ${error.message || fetchError.message}`
      );
    }
  }
}

/**
 * Cache simples em memória para evitar múltiplas conversões da mesma URL
 */
const base64Cache = new Map<string, string>();

/**
 * Converte URL para base64 com cache
 */
export async function urlToBase64Cached(url: string): Promise<string> {
  // Se já for base64, retorna direto
  if (url.startsWith('data:')) {
    return url;
  }

  // Verifica cache
  if (base64Cache.has(url)) {
    return base64Cache.get(url)!;
  }

  try {
    const base64 = await urlToBase64(url);
    base64Cache.set(url, base64);
    return base64;
  } catch (error) {
    // Se falhar, retorna a URL original (pode não funcionar, mas não quebra)
    console.error('Erro ao converter para base64, usando URL original:', error);
    return url;
  }
}

/**
 * Limpa o cache de conversões
 */
export function clearBase64Cache(): void {
  base64Cache.clear();
}

