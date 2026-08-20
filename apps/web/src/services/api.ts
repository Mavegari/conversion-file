import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const uploadFile = async (
  file: File,
  type: string
): Promise<{ id: string; status: string; progress: number }> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post(`/jobs?type=${type}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export const getJobStatus = async (jobId: string) => {
  const response = await api.get(`/jobs/${jobId}`);
  return response.data;
};

export const downloadFile = (jobId: string) => {
  window.location.href = `${API_BASE_URL}/jobs/${jobId}/download`;
};
