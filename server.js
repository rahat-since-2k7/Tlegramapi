require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const fetch = require('node-fetch');
const FormData = require('form-data');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// allow CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/', (req, res) => res.send('✅ Telegram File Relay Running'));

app.post('/upload', upload.array('files', 10), async (req, res) => {
  try {
    const message = req.body.message || '(No text)';

    // send text message
    const sendMsgUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    await fetch(sendMsgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text: message })
    });

    // send files
    for (const file of req.files || []) {
      const form = new FormData();
      form.append('chat_id', CHAT_ID);
      form.append('document', fs.createReadStream(path.resolve(file.path)), file.originalname);

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
        method: 'POST',
        body: form,
        headers: form.getHeaders()
      });

      fs.unlinkSync(file.path);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('🚀 Server listening on', PORT));
