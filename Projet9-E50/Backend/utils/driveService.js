const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Make sure this path points exactly to your JSON file
const KEYFILEPATH = path.join(__dirname, '..', 'Service-Account-39dc.json');

const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILEPATH,
  scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

const uploadToDrive = async (file) => {
  // Use the .env variable if it exists, otherwise use your new hardcoded ID
  const targetFolderId = process.env.IMAGES_DIR 
    ? process.env.IMAGES_DIR.trim() 
    : '1jJcH94CYmODCsCQDptKhFD_swKZDs6u1';

  console.log("DEBUG: Exact Folder ID to use ->", targetFolderId);

  try {
    const response = await drive.files.create({
      requestBody: {
        name: file.filename || file.originalname,
        parents: [targetFolderId],
      },
      media: {
        mimeType: file.mimetype,
        body: fs.createReadStream(file.path),
      },
      supportsAllDrives: true, 
      fields: 'id',
    });

    const fileId = response.data.id;

    // Set permissions to public so everyone can see the profile picture
    await drive.permissions.create({
      fileId: fileId,
      requestBody: { role: 'reader', type: 'anyone' },
    });

    console.log("--- UPLOAD SUCCESS ---");
    console.log("File ID:", fileId);
    console.log("Folder ID Used:", targetFolderId);
    console.log("-----------------------");

    return `https://drive.google.com/uc?export=view&id=${fileId}`;
    
  } catch (error) {
    console.error("DRIVE SERVICE ERROR:", error.message);
    throw error;
  }
};

async function getDriveInfo() {
  return { 
    folderId: process.env.IMAGES_DIR || '1jJcH94CYmODCsCQDptKhFD_swKZDs6u1', 
    serviceAccountEmail: "save-serve-service@save-and-serve-project.iam.gserviceaccount.com" 
  };
}

module.exports = { uploadToDrive, getDriveInfo };