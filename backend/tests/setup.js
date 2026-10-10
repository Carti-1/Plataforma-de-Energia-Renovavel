// Configuração dos testes: segredo JWT fixo e bcrypt mais rápido (só nos testes).
process.env.JWT_SECRET ??= 'segredo-somente-para-testes-1234567890'
process.env.BCRYPT_ROUNDS ??= '4'
