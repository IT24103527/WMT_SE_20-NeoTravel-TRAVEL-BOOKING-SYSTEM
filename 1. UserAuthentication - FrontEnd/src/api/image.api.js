import axiosInstance from './axiosInstance';

const getApiRoot = () => axiosInstance.defaults.baseURL.replace(/\/api\/?$/, '');

export const uploadImage = (formData) => axiosInstance.post('/images/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});

export const getImagesByPackage = (packageId) => axiosInstance.get(`/images/package/${packageId}`);
export const deleteImage = (id) => axiosInstance.delete(`/images/${id}`);

export const resolveUploadUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const baseUrl = getApiRoot();
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};
