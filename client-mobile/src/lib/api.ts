import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

const api = axios.create({
    baseURL: 'http://10.0.2.2:8082',  
    timeout: 10000,
});

// REQUEST interceptor — attach both tokens every time
api.interceptors.request.use(async (config) => {
    const accessToken  = await SecureStore.getItemAsync('accessToken');
    const refreshToken = await SecureStore.getItemAsync('refreshToken');

    if (accessToken)  config.headers['Authorization']   = `Bearer ${accessToken}`;
    if (refreshToken) config.headers['X-Refresh-Token'] = refreshToken;

    return config;
});

// RESPONSE interceptor — save new access token if gateway refreshed it
api.interceptors.response.use(
    async (response) => {
        const newToken = response.headers['x-new-access-token'];
        if (newToken) {
            await SecureStore.setItemAsync('accessToken', newToken);
        }
        return response;
    },
    async (error) => {
        if (error.response?.status === 401) {
            await SecureStore.deleteItemAsync('accessToken');
            await SecureStore.deleteItemAsync('refreshToken');
            router.replace('/login');
        }
        return Promise.reject(error);
    }
);

export default api;