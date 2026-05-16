const express = require('express');
const { Resend } = require('resend');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

/* ── MIDDLEWARE ── */
app.use(express.json());
app.use(cors({
  origin: '*',
  methods: ['POST', 'GET'],
}));

/* ── RESEND CLIENT ── */
const resend = new Resend(process.env.RESEND_API_KEY);

/* ── HEALTH CHECK ── */
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Praveen contact backend is running.' });
});

/* ── CONTACT ROUTE ── */
app.post('/contact', async (req, res) => {
  const { name, email, reason, message } = req.body;

  // Basic validation
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, error: 'Name, email and message are required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, error: 'Invalid email address.' });
  }

  /* ── EMAIL TO PRAVEEN (notification) ── */
  const toOwnerHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #080c14; color: #e8edf5; margin: 0; padding: 0; }
        .wrapper { max-width: 600px; margin: 0 auto; padding: 32px 20px; }
        .card { background: #0d1320; border: 1px solid rgba(79,142,255,0.2); border-radius: 12px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #1a2540, #0d1320); padding: 28px 32px; border-bottom: 1px solid rgba(79,142,255,0.15); }
        .header h1 { font-size: 1.3rem; color: #4f8eff; margin: 0 0 4px; letter-spacing: 0.05em; font-weight: 700; }
        .header p { color: #7a8899; font-size: 0.82rem; margin: 0; letter-spacing: 0.08em; text-transform: uppercase; }
        .body { padding: 28px 32px; }
        .field { margin-bottom: 20px; }
        .label { font-size: 0.7rem; color: #4f8eff; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 5px; }
        .value { font-size: 0.95rem; color: #e8edf5; background: rgba(79,142,255,0.05); border: 1px solid rgba(79,142,255,0.12); border-radius: 6px; padding: 10px 14px; line-height: 1.6; }
        .message-value { white-space: pre-wrap; }
        .footer { padding: 18px 32px; border-top: 1px solid rgba(79,142,255,0.1); background: rgba(0,0,0,0.2); }
        .footer p { font-size: 0.72rem; color: #7a8899; margin: 0; }
        .reply-btn { display: inline-block; margin-top: 20px; background: #4f8eff; color: #fff; text-decoration: none; padding: 10px 22px; border-radius: 5px; font-size: 0.78rem; letter-spacing: 0.06em; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="card">
          <div class="header">
            <h1>📬 New Portfolio Message</h1>
            <p>Received via portfolio contact form</p>
          </div>
          <div class="body">
            <div class="field">
              <div class="label">From</div>
              <div class="value">${name}</div>
            </div>
            <div class="field">
              <div class="label">Email</div>
              <div class="value">${email}</div>
            </div>
            <div class="field">
              <div class="label">Reason</div>
              <div class="value">${reason || 'General Inquiry'}</div>
            </div>
            <div class="field">
              <div class="label">Message</div>
              <div class="value message-value">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
            </div>
            <a class="reply-btn" href="mailto:${email}?subject=Re: ${encodeURIComponent(reason || 'Your message')}&amp;body=Hi ${encodeURIComponent(name)},%0D%0A%0D%0A">Reply to ${name} →</a>
          </div>
          <div class="footer">
            <p>This email was sent from your portfolio contact form.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  /* ── CONFIRMATION EMAIL TO SENDER ── */
  const toSenderHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f4ff; color: #1a1a2e; margin: 0; padding: 0; }
        .wrapper { max-width: 580px; margin: 0 auto; padding: 32px 20px; }
        .card { background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(79,142,255,0.1); }
        .header { background: linear-gradient(135deg, #080c14, #1a2540); padding: 32px; text-align: center; }
        .header h1 { font-size: 1.5rem; color: #4f8eff; margin: 0 0 6px; font-weight: 800; letter-spacing: -0.02em; }
        .header p { color: #7a8899; font-size: 0.82rem; margin: 0; }
        .body { padding: 32px; }
        .body p { font-size: 0.95rem; color: #3a3a5c; line-height: 1.75; margin-bottom: 16px; }
        .body strong { color: #080c14; }
        .highlight { background: #f0f4ff; border-left: 3px solid #4f8eff; padding: 14px 18px; border-radius: 0 8px 8px 0; margin: 20px 0; font-size: 0.88rem; color: #3a3a5c; line-height: 1.7; }
        .footer { padding: 20px 32px; border-top: 1px solid #e8edf5; text-align: center; }
        .footer p { font-size: 0.72rem; color: #9a9ab0; margin: 0; }
        .logo { font-family: monospace; font-size: 1rem; color: #4f8eff; font-weight: 700; }
        .logo span { color: #080c14; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="card">
          <div class="header">
            <h1>Message received! ✦</h1>
            <p class="logo">PT<span>_dev</span> — Praveen T</p>
          </div>
          <div class="body">
            <p>Hi <strong>${name}</strong>,</p>
            <p>Thanks for reaching out through my portfolio! I've received your message and will get back to you at <strong>${email}</strong> as soon as possible — usually within 24–48 hours.</p>
            <div class="highlight">
              <strong>Your message:</strong><br/>
              ${message.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>')}
            </div>
            <p>In the meantime, feel free to check out my work on <a href="https://github.com/Praveentheoplus" style="color:#4f8eff">GitHub</a> or connect on <a href="https://www.linkedin.com/in/praveen-t-4261a4292" style="color:#4f8eff">LinkedIn</a>.</p>
            <p>Talk soon! 👋</p>
            <p><strong>Praveen T</strong><br/><span style="color:#9a9ab0;font-size:0.85rem">Full Stack &amp; Backend Developer</span></p>
          </div>
          <div class="footer">
            <p>You received this because you submitted the contact form at Praveen T's portfolio.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    // Send both emails in parallel
    await Promise.all([
      resend.emails.send({
        from: 'Portfolio Contact <onboarding@resend.dev>',
        to: process.env.GMAIL_USER,
        replyTo: email,
        subject: `📬 New message from ${name} — ${reason || 'General Inquiry'}`,
        html: toOwnerHtml,
      }),
      resend.emails.send({
        from: 'Portfolio Contact <onboarding@resend.dev>',
        to: email,
        subject: `Thanks for reaching out, ${name}! 👋`,
        html: toSenderHtml,
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: `Message sent! A confirmation has been sent to ${email}.`,
    });
  } catch (err) {
    console.error('Mail error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to send email. Please try again later.',
    });
  }
});

/* ── START SERVER ── */
app.listen(PORT, () => {
  console.log(`✦ Contact backend running on port ${PORT}`);
});
