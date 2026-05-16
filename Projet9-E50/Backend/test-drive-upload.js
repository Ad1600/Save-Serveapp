require('dotenv').config();
const path = require('path');
const { uploadToDrive } = require('./utils/driveService');

(async () => {
  try {
    const filePath = path.join(__dirname, 'uploads', 'test.jpg');
    console.log('Uploading', filePath);
    const res = await uploadToDrive(filePath, { name: 'test.jpg', mimeType: 'image/jpeg' });
    console.log('UPLOAD OK:', res);
  } catch (e) {
    console.error('UPLOAD ERR:', e && e.message ? e.message : e);
    console.error(e);
  }
})();
