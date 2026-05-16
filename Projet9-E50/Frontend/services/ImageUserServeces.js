import api from './api';
import { BASE_URL } from '../constants/Api';

/**
 * Check if a photo URL points to an existing file in the uploads directory
 * @param {string|null} photoUrl - The photo URL or filename from the database
 * @returns {Promise<boolean>} - True if the file exists, false otherwise
 */
export const checkPhotoExists = async (photoUrl) => {
  if (!photoUrl) return false;
  
  // If it's already a full URL, use it directly; otherwise construct the URL
  const fullUrl = photoUrl.startsWith('http') 
    ? photoUrl 
    : `${BASE_URL}/uploads/${photoUrl}`;
  
  try {
    // Use HEAD request to check if file exists without downloading it
    const response = await api.head(fullUrl);
    return response.status === 200;
  } catch (error) {
    // If we get any error (404, 500, etc.), the file doesn't exist
    return false;
  }
};

/**
 * Get the display avatar URI - returns the photo URL if file exists, otherwise returns null
 * @param {string|null} photoUrl - The photo URL or filename from the database
 * @returns {Promise<string|null>} - The valid photo URL or null
 */
export const getValidAvatarUri = async (photoUrl, bustCache = false) => {
  if (!photoUrl) return null;

  if (photoUrl.startsWith('http')) {
    return bustCache ? `${photoUrl}?t=${Date.now()}` : photoUrl;
  }

  const exists = await checkPhotoExists(photoUrl);
  if (exists) {
    const base = `${BASE_URL}/uploads/${photoUrl}`;
    return bustCache ? `${base}?t=${Date.now()}` : base;
  }

  return null;
};

/**
 * Upload a profile photo to the server.
 * @param {string} uri - local uri of the image (React Native)
 * @param {string} [userId] - optional user id; if provided the function will call PUT /users/:id/photo, otherwise POST /users/upload-photo
 * @returns {{success:boolean, data: any, message: string|null}}
 */
export const uploadProfilePhoto = async (uri, userId = null) => {
	try {
		if (!uri) return { success: false, data: null, message: 'uri is required' };

		const formData = new FormData();
		const filename = uri.split('/').pop();
		const match = /\.([0-9a-zA-Z]+)$/.exec(filename);
		const ext = match ? match[1].toLowerCase() : 'jpg';
		const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;

		// React Native/Expo expects an object with uri, name and type
		formData.append('image', { uri, name: filename || `photo.${ext}`, type: mimeType });

		const endpoint = userId ? `/users/${userId}/photo` : '/users/upload-photo';
		const method = userId ? 'put' : 'post';

		const response = await api[method](endpoint, formData, {
			headers: { 'Content-Type': 'multipart/form-data' }
		});

		// Support multiple backend response shapes:
		// - { success: true, url: '...' }
		// - { success: true, data: { photo: '...' } }
		const photoUrl = response.data?.url ?? response.data?.data?.photo ?? null;

		return {
			success: response.data?.success ?? true,
			data: photoUrl,
			message: response.data?.message ?? null
		};
	} catch (error) {
		return {
			success: false,
			data: null,
			message: error.response?.data?.message || error.message || 'Upload failed'
		};
	}
};

export const uploadProfileImage = async (uri) => {
	try {
		if (!uri) return { success: false, data: null, message: 'uri is required' };

		const formData = new FormData();
		const filename = uri.split('/').pop();
		const match = /\.([0-9a-zA-Z]+)$/.exec(filename);
		const ext = match ? match[1].toLowerCase() : 'jpg';
		const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;

		formData.append('image', { uri, name: filename || `photo.${ext}`, type: mimeType });

		const response = await api.post('/users/upload-photo', formData, {
			headers: { 'Content-Type': 'multipart/form-data' }
		});

		return {
			success: response.data?.success ?? true,
			data: response.data?.url ?? null,
			message: response.data?.message ?? null
		};
	} catch (error) {
		return {
			success: false,
			data: null,
			message: error.response?.data?.message || error.message || 'Upload failed'
		};
	}
};

export const loadUser = async () => {
  try {
    const storedUser = await authService.getStoredUser();
    setUser(storedUser);
    if (storedUser?.photo) {
      const uri = storedUser.photo.startsWith('http')
        ? storedUser.photo
        : `${BASE_URL}/uploads/${storedUser.photo}`;
      setValidPhotoUri(uri);
    } else {
      setValidPhotoUri(storedUser?.avatar ?? null);
    }
  } finally {
    setRefreshing(false);
  }
};

export default { uploadProfilePhoto, uploadProfileImage, loadUser };
