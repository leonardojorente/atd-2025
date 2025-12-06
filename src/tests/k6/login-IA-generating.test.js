import http from 'k6/http';
import { sleep, check, group } from 'k6';

/** prompt usado para criar esse arquivo de teste de performance com K6:
Objetivo:
Crie um teste de performance com K6 para registrar um usuário e fazer login dele.

Contexto:
- O k6 já está instalado na minha máquina.
- O teste a ser criado é apenas para o fluxo principal (não preciso de fluxo alternativo ou de exceção).
- Para registrar, olhe o Swagger.yaml e pesquise como funciona o POST /auth/register
- Para logar, olhe o Swagger.yaml e pesquise como funciona o POST /auth/login.
- O teste de performance passa quando o percentil de 95 é menor que 2 segundos.
- Esse teste deve rodar para 10 usuários virtuais com 15 segundos de duração.

Regras:
- Salve o teste dentro da pasta test/k6/login.test.js
- Crie check do status code de sucesso contido na resposta de cada request que você fizer.
- Separe ações similares em groups.
- Execute os testes depois de criar para saber se está funcionando corretamente.
 **/

export const options = {
  vus: 10,
  duration: '15s',
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95º percentil menor que 2 segundos
  }
};

export default function() {
  // Gerar dados únicos para cada usuário
  const timestamp = Date.now();
  const email = `usuario_${timestamp}_${Math.floor(Math.random() * 10000)}@test.com`;
  const password = 'senha123456';
  const name = `Usuário Teste ${timestamp}`;

  let registerResponse;
  let loginResponse;

  // Group: Registrar usuário
  group('Register User', function() {
    registerResponse = http.post(
      'http://localhost:3000/auth/register',
      JSON.stringify({
        email: email,
        password: password,
        name: name
      }),
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    check(registerResponse, {
      'Register - Status is 201': (res) => res.status === 201,
      'Register - Success is true': (res) => res.json('success') === true,
      'Register - Has user data': (res) => res.json('data.id') !== null
    });
  });

  // Group: Fazer login
  group('Login User', function() {
    loginResponse = http.post(
      'http://localhost:3000/auth/login',
      JSON.stringify({
        email: email,
        password: password
      }),
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    check(loginResponse, {
      'Login - Status is 200': (res) => res.status === 200,
      'Login - Success is true': (res) => res.json('success') === true,
      'Login - Has token': (res) => res.json('data.token') !== null && res.json('data.token') !== '',
      'Login - Has user info': (res) => res.json('data.user.id') !== null
    });
  });

  // Simular tempo de pensamento do usuário
  sleep(1);
}
