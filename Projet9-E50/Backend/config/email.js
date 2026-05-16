const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const envoyerCodeVerification = async (email, nom, code) => {
  const mailOptions = {
    from: `"Save&Serve" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verification de votre compte Save&Serve',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;">
        <div style="background:#3a7d44;padding:20px;border-radius:10px 10px 0 0;text-align:center;">
          <h1 style="color:white;margin:0;">Save&Serve</h1>
          <p style="color:#e8f5e9;margin:5px 0;">Sauvez des repas, reduisez le gaspillage</p>
        </div>
        <div style="background:#f9f9f9;padding:30px;border-radius:0 0 10px 10px;text-align:center;">
          <h2 style="color:#2d3a2e;">Bonjour ${nom} !</h2>
          <p style="color:#5a7060;">Voici votre code de verification :</p>
          <div style="background:#3a7d44;color:white;font-size:2.5rem;font-weight:bold;padding:20px;border-radius:10px;letter-spacing:8px;margin:20px 0;">
            ${code}
          </div>
          <p style="color:#9db89f;font-size:0.85rem;">Ce code expire dans <strong>15 minutes</strong>.</p>
          <p style="color:#9db89f;font-size:0.85rem;">Si vous n'avez pas cree de compte, ignorez cet email.</p>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

const genererCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = { envoyerCodeVerification, genererCode };
