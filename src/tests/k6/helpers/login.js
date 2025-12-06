import http from 'k6/http';
import { BASE_URL } from './baseURL.js';

/**
 * Realiza o login e retorna apenas o token JWT.
 * @param {string} email - Email do usuário
 * @param {string} password - Senha do usuário
 * @returns {string} token JWT
 */
export function login(email, password) {
  const response = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email, password }),
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  const token = response.json('data.token');
  if (!token) {
    throw new Error('Token não encontrado na resposta de login.');
  }
  return token;
}
