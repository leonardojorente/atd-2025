import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { randomEmail, randomName } from './helpers/randomData.js';
import { login } from './helpers/login.js';
import { BASE_URL } from './helpers/baseURL.js';
import { Trend } from 'k6/metrics';

// cmd para testar parametro: k6 run src\tests\k6\checkout-test.js -e BASE_URL='http://localhost:3000'
const postCheckoutTrend = new Trend('post_checkout_duration');

export const options = {
  vus: 1,
  iterations: '1',
  // stages: [
  //   { duration: '3s', target: 10 },    // Ramp-up
  //   { duration: '15s', target: 10 },   // avarage
  //   { duration: '2s', target: 100 },   // spike to 100 VUs
  //   { duration: '3s', target: 100 },   // spike to 100 VUs
  //   { duration: '5s', target: 10 },    // avarage
  //   { duration: '5s', target: 0 },     // ramp down
  // ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95º percentil menor que 2 segundos
  },
};

export default function() {
  // Gerar dados únicos para cada usuário
  const email = randomEmail();
  const password = 'senha123456';
  const name = randomName();

  let registerResponse;
  let productsResponse;
  let checkoutResponse;
  let token;
  let productId;

  // Group: Registrar usuário
  group('Register User', function() {
    registerResponse = http.post(
      `${BASE_URL}/auth/register`,
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

  // Group: Fazer login importando uma funcao externa
  group('Login User', function() {
    token = login(email, password);
  });

  // Group: Listar produtos
  group('Get Products', function() {
    productsResponse = http.get(
      `${BASE_URL}/products`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    check(productsResponse, {
      'Get Products - Status is 200': (res) => res.status === 200,
      'Get Products - Success is true': (res) => res.json('success') === true,
      'Get Products - Has products': (res) => res.json('data').length > 0
    });

    // Obter o primeiro produto com estoque disponível
    const products = productsResponse.json('data');
    if (products && products.length > 0) {
      // Procurar por um produto com estoque disponível
      for (let i = 0; i < products.length; i++) {
        if (products[i].stock && products[i].stock > 0) {
          productId = products[i].id;
          console.log(`Using product ID: ${productId} with stock: ${products[i].stock}`);
          break;
        }
      }
      // Se nenhum produto com estoque, usa o primeiro do array
      if (!productId) {
        productId = products[0].id;
        console.log(`No products with stock, using first product ID: ${productId}`);
      }
    }
  });

  // Group: Fazer checkout
  group('Checkout', function() {
    checkoutResponse = http.post(
      `${BASE_URL}/checkout`,
      JSON.stringify({
        items: [
          {
            productId: productId,
            quantity: 1
          }
        ],
        paymentMethod: 'cash'
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log(`Checkout Status: ${checkoutResponse.status}`);
    console.log(`Checkout Response: ${checkoutResponse.body}`);

    check(checkoutResponse, {
      'Checkout - Status is 200': (res) => res.status === 200,
      'Checkout - Success is true': (res) => res.json('success') === true,
      'Checkout - Has order id': (res) => res.json('data.id') !== null,
      'Checkout - Has total': (res) => res.json('data.total') !== null,
      'Checkout - Status is confirmed': (res) => res.json('data.status') !== null
    });
  });

  postCheckoutTrend.add(registerResponse.timings.duration);

  // Simular tempo de pensamento do usuário
  sleep(1);
}
