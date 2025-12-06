import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { SharedArray } from 'k6/data';

const users = new SharedArray('users', function() {
  return JSON.parse(open('./data/login.test.data.json'));
});

export const options = {
  vus: 5,
  iterations: 5, 
  thresholds: {
    http_req_duration: ['p(90)<=1000', 'p(95)<=3000'],
    //http_req_failed: ['rate<0.01']
  }
};

export default function() {
  //const user = users[__VU-1]; numero de vus igual numero de itens no json
  const user = users[(__VU - 1) % users.length]; // permite mais VUs que itens no json
  console.log(user);

  let responseRegister = '';
  let responseLogin = '';
  const email = `julio@${Math.floor(Math.random() * 10000)}.com`;
  const username = `julio_${Math.floor(Math.random() * 10000)}`;

  group('Register user', function() {
    responseRegister = http.post(
      'http://localhost:3000/auth/register',
      JSON.stringify({
        email: email,
        password: '123456',
        name: username
      }),
      { 
        headers: { 
          'Content-Type': 'application/json' 
        } 
      }
    );
  });

  group('Doing login', function() {
    responseLogin = http.post(
      'http://localhost:3000/auth/login',
      JSON.stringify({
        email: email,
        password: '123456'
      }),
      { 
        headers: { 
          'Content-Type': 'application/json' 
        } 
      }
    );

    check(responseLogin, { 
      "status is 200": (res) => res.status === 200,
      "has token": (res) => res.json('data.token') !== null
    });
  });

  group('Simulate user think time', function() {
    sleep(1); 
  });
}
