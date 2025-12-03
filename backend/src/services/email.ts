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
 * Envia email de boas-vindas para usuário que ganhou um ingresso
 * (criado por uma company ao atribuir ticket)
 */
export async function sendWelcomeEmailWithTicket(
  email: string,
  password: string,
  eventName: string
): Promise<void> {
  const mailOptions = {
    from: EMAIL_FROM,
    to: email,
    subject: '🎉 Bem-vindo! Você ganhou um ingresso NFT',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: #4CAF50; text-align: center; margin-bottom: 20px;">🎉 Parabéns!</h1>
          
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Você acaba de ganhar um ingresso NFT para <strong>${eventName}</strong>!
          </p>
          
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Sua conta foi criada automaticamente na nossa plataforma de Carteira de Ingressos NFT.
          </p>
          
          <div style="background-color: #f0f8ff; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #333; margin-top: 0;">🔐 Seus dados de acesso:</h3>
            <p style="margin: 10px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 10px 0;"><strong>Senha temporária:</strong> <code style="background-color: #fff; padding: 5px 10px; border-radius: 4px; font-size: 14px;">${password}</code></p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${FRONTEND_URL}" 
               style="background-color: #4CAF50; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 8px; display: inline-block; font-size: 16px; font-weight: bold;">
              Acessar minha carteira
            </a>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              ⚠️ <strong>Importante:</strong> Por segurança, recomendamos que você altere sua senha após o primeiro acesso.
            </p>
          </div>
          
          <h3 style="color: #333; margin-top: 30px;">📱 Compartilhe nas redes sociais!</h3>
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            Mostre para seus amigos que você tem um ingresso NFT exclusivo! 
            Compartilhe sua experiência e ajude a divulgar essa tecnologia inovadora.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #999; text-align: center; margin-top: 20px;">
            Se você não solicitou este ingresso ou tem dúvidas, entre em contato conosco.
          </p>
        </div>
      </div>
    `,
    text: `
🎉 Parabéns! Você ganhou um ingresso NFT!

Você acaba de ganhar um ingresso NFT para ${eventName}!

Sua conta foi criada automaticamente na nossa plataforma de Carteira de Ingressos NFT.

🔐 SEUS DADOS DE ACESSO:
Email: ${email}
Senha temporária: ${password}

⚠️ IMPORTANTE: Por segurança, recomendamos que você altere sua senha após o primeiro acesso.

Acesse sua carteira em: ${FRONTEND_URL}

📱 Compartilhe nas redes sociais!
Mostre para seus amigos que você tem um ingresso NFT exclusivo!

---
Se você não solicitou este ingresso ou tem dúvidas, entre em contato conosco.
    `,
  };

  try {
    const emailTransporter = getTransporter();
    await emailTransporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Erro ao enviar email de boas-vindas com ingresso:', error);
    throw new Error('Falha ao enviar email');
  }
}

/**
 * Envia email de boas-vindas para usuário que se cadastrou por conta própria
 * (orienta a comprar ingressos em plataformas parceiras)
 */
export async function sendWelcomeEmailNewUser(
  email: string
): Promise<void> {
  const mailOptions = {
    from: EMAIL_FROM,
    to: email,
    subject: '👋 Bem-vindo à Carteira de Ingressos NFT',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: #4CAF50; text-align: center; margin-bottom: 20px;">👋 Bem-vindo!</h1>
          
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Olá! Sua conta na <strong>Carteira de Ingressos NFT</strong> foi criada com sucesso!
          </p>
          
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Agora você está pronto para receber e gerenciar seus ingressos NFT de forma segura e moderna.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${FRONTEND_URL}" 
               style="background-color: #4CAF50; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 8px; display: inline-block; font-size: 16px; font-weight: bold;">
              Acessar minha carteira
            </a>
          </div>
          
          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2196F3;">
            <h3 style="color: #1565C0; margin-top: 0;">🎫 Como obter ingressos NFT?</h3>
            <p style="margin: 10px 0; color: #333; line-height: 1.6;">
              Para ter ingressos NFT em sua carteira, você precisa comprá-los em uma de nossas 
              <strong>plataformas parceiras</strong> de venda de ingressos.
            </p>
            <p style="margin: 10px 0; color: #333; line-height: 1.6;">
              Após a compra, seus ingressos aparecerão automaticamente aqui na sua carteira digital!
            </p>
          </div>
          
          <h3 style="color: #333; margin-top: 30px;">✨ Por que ingressos NFT?</h3>
          <ul style="color: #666; line-height: 1.8;">
            <li>🔒 <strong>Segurança:</strong> Impossível falsificar</li>
            <li>💎 <strong>Exclusividade:</strong> Item colecionável único</li>
            <li>🎁 <strong>Benefícios:</strong> Acesso a vantagens exclusivas</li>
            <li>📱 <strong>Praticidade:</strong> Tudo em um só lugar</li>
          </ul>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #999; text-align: center; margin-top: 20px;">
            Tem dúvidas? Entre em contato com nosso suporte.
          </p>
        </div>
      </div>
    `,
    text: `
👋 Bem-vindo à Carteira de Ingressos NFT!

Olá! Sua conta na Carteira de Ingressos NFT foi criada com sucesso!

Agora você está pronto para receber e gerenciar seus ingressos NFT de forma segura e moderna.

Acesse sua carteira em: ${FRONTEND_URL}

🎫 COMO OBTER INGRESSOS NFT?

Para ter ingressos NFT em sua carteira, você precisa comprá-los em uma de nossas plataformas parceiras de venda de ingressos.

Após a compra, seus ingressos aparecerão automaticamente aqui na sua carteira digital!

✨ POR QUE INGRESSOS NFT?

• 🔒 Segurança: Impossível falsificar
• 💎 Exclusividade: Item colecionável único
• 🎁 Benefícios: Acesso a vantagens exclusivas
• 📱 Praticidade: Tudo em um só lugar

---
Tem dúvidas? Entre em contato com nosso suporte.
    `,
  };

  try {
    const emailTransporter = getTransporter();
    await emailTransporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Erro ao enviar email de boas-vindas:', error);
    throw new Error('Falha ao enviar email');
  }
}

/**
 * Verifica se o serviço de email está configurado
 */
export function isEmailConfigured(): boolean {
  return !!(SMTP_USER && SMTP_PASS);
}

