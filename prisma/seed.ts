// Seed do banco de dados
// Cria um responsável padrão e filhos de exemplo

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar responsável padrão
  const senhaHash = await bcrypt.hash('admin123', 12);

  const responsavel = await prisma.user.upsert({
    where: { email: 'pai@familia.com' },
    update: {},
    create: {
      email: 'pai@familia.com',
      password: senhaHash,
      nome: 'João (Pai)',
    },
  });

  console.log(`✅ Responsável criado: ${responsavel.email}`);

  // Criar filhos de exemplo
  const filhos = await Promise.all([
    prisma.filho.create({
      data: {
        nome: 'Lucas',
        idade: 14,
        dispositivo: 'iPhone 15',
        responsavelId: responsavel.id,
      },
    }),
    prisma.filho.create({
      data: {
        nome: 'Ana',
        idade: 12,
        dispositivo: 'Samsung Galaxy A54',
        responsavelId: responsavel.id,
      },
    }),
    prisma.filho.create({
      data: {
        nome: 'Pedro',
        idade: 8,
        responsavelId: responsavel.id,
      },
    }),
  ]);

  console.log(`✅ ${filhos.length} filhos cadastrados`);
  console.log('');
  console.log('📋 Credenciais do responsável:');
  console.log('   Email: pai@familia.com');
  console.log('   Senha: admin123');
  console.log('');
  console.log('👶 Filhos cadastrados:');
  filhos.forEach(f => console.log(`   - ${f.nome}${f.idade ? ` (${f.idade} anos)` : ''}`));
  console.log('');
  console.log('🎉 Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
