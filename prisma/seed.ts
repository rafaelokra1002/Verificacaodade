// Seed do banco de dados
// Cria um administrador padrão para acesso inicial

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar administrador padrão
  const senhaHash = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@sistema.com' },
    update: {},
    create: {
      email: 'admin@sistema.com',
      password: senhaHash,
      nome: 'Administrador',
    },
  });

  console.log(`✅ Admin criado: ${admin.email}`);

  // Criar alguns clientes de exemplo
  const clientes = await Promise.all([
    prisma.cliente.create({
      data: {
        nome: 'João Silva',
        telefone: '(11) 99999-0001',
      },
    }),
    prisma.cliente.create({
      data: {
        nome: 'Maria Santos',
        telefone: '(11) 99999-0002',
      },
    }),
    prisma.cliente.create({
      data: {
        nome: 'Pedro Oliveira',
        telefone: '(11) 99999-0003',
      },
    }),
  ]);

  console.log(`✅ ${clientes.length} clientes criados`);
  console.log('');
  console.log('📋 Credenciais do admin:');
  console.log('   Email: admin@sistema.com');
  console.log('   Senha: admin123');
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
