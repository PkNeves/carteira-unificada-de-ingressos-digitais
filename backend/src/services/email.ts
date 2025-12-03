import nodemailer from 'nodemailer';

function getFrontendUrl(): string {
  const frontendUrl = process.env.FRONTEND_URL || 
    (process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : undefined);
  
  if (!frontendUrl) {
    throw new Error("FRONTEND_URL não configurada. Configure a variável de ambiente FRONTEND_URL.");
  }
  
  return frontendUrl;
}

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@ticketwallet.com';
const FRONTEND_URL = getFrontendUrl();

// Configuração do transporter de email (lazy initialization)
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      throw new Error(
        "Configuração de email incompleta. Configure SMTP_HOST, SMTP_USER e SMTP_PASS."
      );
    }
    
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: false, // true para 465, false para outras portas
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }
  return transporter;
}

/**
 * Envia email com magic link para login
 */
export async function sendMagicLinkEmail(
  email: string,
  token: string
): Promise<void> {
  const magicLink = `${FRONTEND_URL}/verify/${token}`;

  const mailOptions = {
    from: EMAIL_FROM,
    to: email,
    subject: 'Link de acesso - Carteira de Ingressos NFT',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Olá!</h2>
        <p>Você solicitou acesso à sua carteira de ingressos NFT.</p>
        <p>Clique no link abaixo para fazer login:</p>
        <p style="margin: 30px 0;">
          <a href="${magicLink}" 
             style="background-color: #4CAF50; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Acessar minha carteira
          </a>
        </p>
        <p style="color: #666; font-size: 12px;">
          Este link expira em 15 minutos. Se você não solicitou este acesso, 
          pode ignorar este email.
        </p>
        <p style="color: #666; font-size: 12px;">
          Ou copie e cole este link no seu navegador:<br>
          ${magicLink}
        </p>
      </div>
    `,
    text: `
      Olá!
      
      Você solicitou acesso à sua carteira de ingressos NFT.
      
      Clique no link abaixo para fazer login:
      ${magicLink}
      
      Este link expira em 15 minutos.
    `,
  };

  try {
    const emailTransporter = getTransporter();
    await emailTransporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    throw new Error('Falha ao enviar email');
  }
}

/**
 * Verifica se o serviço de email está configurado
 */
export function isEmailConfigured(): boolean {
  return !!(SMTP_USER && SMTP_PASS);
}

