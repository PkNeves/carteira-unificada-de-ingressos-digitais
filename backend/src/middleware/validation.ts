import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";

/**
 * Formata erros do Zod em formato amigável
 */
function formatZodError(error: ZodError): {
  error: string;
  details: Array<{ field: string; message: string }>;
} {
  const details = error.errors.map((err) => {
    const field = err.path.join(".");
    return {
      field: field || "root",
      message: err.message,
    };
  });

  return {
    error: "Erro de validação",
    details,
  };
}

/**
 * Middleware de validação usando Zod
 * @param schema Schema Zod para validação
 * @param source Onde buscar os dados: 'body', 'params', 'query' ou 'all'
 */
export function validate(
  schema: z.ZodSchema,
  source: "body" | "params" | "query" | "all" = "body"
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      let data: any;

      if (source === "all") {
        data = {
          body: req.body,
          params: req.params,
          query: req.query,
        };
      } else {
        data = req[source];
      }

      const validated = schema.parse(data);
      
      // Atualiza os dados validados de volta na requisição
      if (source === "all") {
        req.body = validated.body || req.body;
        req.params = validated.params || req.params;
        req.query = validated.query || req.query;
      } else {
        req[source] = validated;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json(formatZodError(error));
        return;
      }

      // Erro inesperado
      res.status(500).json({
        error: "Erro interno de validação",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  };
}

