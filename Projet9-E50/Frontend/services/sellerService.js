import api from './api';

export const sellerService = {

  // Called by the client from BecomeSellerScreen
  // payload must include a `documentPdfUri` (local file URI from expo-document-picker)
  // plus all other text fields
  becomeSeller: async (payload) => {
    const {
      nomCommerce, adresseCommerce, descriptionShop,
      telephone, categorie, latitude, longitude,
      documentPdfUri, documentPdfName,
    } = payload;

    // Build multipart/form-data — same pattern as uploadProfilePhoto
    const formData = new FormData();
    formData.append('nomCommerce',     nomCommerce);
    formData.append('adresseCommerce', adresseCommerce);
    formData.append('descriptionShop', descriptionShop);
    formData.append('telephone',       telephone);
    formData.append('categorie',       categorie);
    if (latitude  != null) formData.append('latitude',  String(latitude));
    if (longitude != null) formData.append('longitude', String(longitude));

    // Attach PDF — React Native FormData expects { uri, name, type }
    formData.append('documentPdf', {
      uri:  documentPdfUri,
      name: documentPdfName || 'business_document.pdf',
      type: 'application/pdf',
    });

    const response = await api.post('/vendeur/postuler', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return {
      success: response.data?.success ?? true,
      data:    response.data?.data    ?? response.data ?? null,
      message: response.data?.message ?? null,
    };
  },

  // Check application status
  getMyStatus: async () => {
    const response = await api.get('/vendeur/ma-demande');
    return {
      success: response.data?.success ?? true,
      data:    response.data?.data    ?? response.data ?? null,
    };
  },
};