// Helpers for generating random test data used by k6 scripts
import faker from "k6/x/faker"
/**
 * Gera um email aleatório no formato `usuario_<n>@test.com`.
 * @param {number} [digits=4] número de dígitos aleatórios (padrão 4)
 * @returns {string} email gerado
 */
export function randomEmail(digits = 4) {
	const max = Math.pow(10, digits);
	const rnd = Math.floor(Math.random() * max);
	return `usuario_${rnd}@test.com`;
}

/**
 * Gera um nome aleatório no formato `Usuário Teste <n>`.
 * @param {number} [digits=4] número de dígitos aleatórios (padrão 4)
 * @returns {string} nome gerado
 */
export function randomName() {
	return faker.person.firstName();
}



