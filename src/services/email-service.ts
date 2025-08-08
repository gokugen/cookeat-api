import nodemailer from 'nodemailer';

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Interface pour les options d'email
interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Fonction pour envoyer un email
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, '') // Version texte sans HTML
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email envoyé:', info.messageId);
  } catch (error) {
    console.error('Erreur lors de l\'envoi d\'email:', error);
    throw error;
  }
};

// Fonction spécifique pour l'email de réinitialisation de mot de passe
export const sendPasswordResetEmail = async (email: string, resetUrl: string, language = 'en'): Promise<void> => {
  const subject = language === 'fr'
    ? 'Réinitialisation de votre mot de passe - CookEat'
    : 'Password Reset - CookEat';

  const html = language === 'fr' ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7c3aed;">Réinitialisation de votre mot de passe</h2>
            <p>Bonjour,</p>
            <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte CookEat.</p>
            <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background: linear-gradient(90deg, #a084fa 0%, #7c3aed 100%); 
                          color: white; 
                          padding: 12px 30px; 
                          text-decoration: none; 
                          border-radius: 5px; 
                          display: inline-block;">
                    Réinitialiser mon mot de passe
                </a>
            </div>
            <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <p>Ce lien expirera dans 1 heure pour des raisons de sécurité.</p>
            <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
                Cet email a été envoyé automatiquement, merci de ne pas y répondre.
            </p>
        </div>
    ` : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7c3aed;">Password Reset</h2>
            <p>Hello,</p>
            <p>You requested a password reset for your CookEat account.</p>
            <p>Click the button below to create a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background: linear-gradient(90deg, #a084fa 0%, #7c3aed 100%); 
                          color: white; 
                          padding: 12px 30px; 
                          text-decoration: none; 
                          border-radius: 5px; 
                          display: inline-block;">
                    Reset my password
                </a>
            </div>
            <p>If the button doesn't work, copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <p>This link will expire in 1 hour for security reasons.</p>
            <p>If you didn't request this reset, please ignore this email.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
                This email was sent automatically, please do not reply.
            </p>
        </div>
    `;

  await sendEmail({
    to: email,
    subject,
    html
  });
};

// Fonction pour envoyer un email avec détection automatique de la langue
export const sendEmailWithLanguage = async (
  email: string,
  subjectKey: string,
  templateKey: string,
  data: any = {},
  language = 'en'
): Promise<void> => {
  // Templates d'emails
  const emailTemplates = {
    welcome: {
      fr: {
        subject: 'Bienvenue sur CookEat !',
        html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #7c3aed;">Bienvenue sur CookEat !</h2>
                        <p>Bonjour ${data.userName || 'utilisateur'},</p>
                        <p>Merci de vous être inscrit sur CookEat. Votre compte a été créé avec succès !</p>
                        <p>Vous pouvez maintenant commencer à utiliser toutes nos fonctionnalités.</p>
                        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                        <p style="color: #666; font-size: 12px;">
                            Cet email a été envoyé automatiquement, merci de ne pas y répondre.
                        </p>
                    </div>
                `
      },
      en: {
        subject: 'Welcome to CookEat!',
        html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #7c3aed;">Welcome to CookEat!</h2>
                        <p>Hello ${data.userName || 'user'},</p>
                        <p>Thank you for signing up to CookEat. Your account has been successfully created!</p>
                        <p>You can now start using all our features.</p>
                        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                        <p style="color: #666; font-size: 12px;">
                            This email was sent automatically, please do not reply.
                        </p>
                    </div>
                `
      }
    },
    accountUpdate: {
      fr: {
        subject: 'Mise à jour de votre compte CookEat',
        html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #7c3aed;">Mise à jour de votre compte</h2>
                        <p>Bonjour ${data.userName || 'utilisateur'},</p>
                        <p>Votre compte CookEat a été mis à jour avec succès.</p>
                        <p>Si vous n'êtes pas à l'origine de cette modification, veuillez nous contacter immédiatement.</p>
                        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                        <p style="color: #666; font-size: 12px;">
                            Cet email a été envoyé automatiquement, merci de ne pas y répondre.
                        </p>
                    </div>
                `
      },
      en: {
        subject: 'CookEat Account Update',
        html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #7c3aed;">Account Update</h2>
                        <p>Hello ${data.userName || 'user'},</p>
                        <p>Your CookEat account has been successfully updated.</p>
                        <p>If you didn't make this change, please contact us immediately.</p>
                        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                        <p style="color: #666; font-size: 12px;">
                            This email was sent automatically, please do not reply.
                        </p>
                    </div>
                `
      }
    }
  };

  const template = emailTemplates[templateKey as keyof typeof emailTemplates];
  if (!template) {
    throw new Error(`Template email '${templateKey}' non trouvé`);
  }

  const emailContent = template[language as keyof typeof template];
  if (!emailContent) {
    throw new Error(`Langue '${language}' non supportée pour le template '${templateKey}'`);
  }

  await sendEmail({
    to: email,
    subject: emailContent.subject,
    html: emailContent.html
  });
};

// Fonction pour vérifier la configuration email
export const testEmailConnection = async (): Promise<boolean> => {
  try {
    await transporter.verify();
    console.log('Configuration email valide');
    return true;
  } catch (error) {
    console.error('Erreur de configuration email:', error);
    return false;
  }
}; 