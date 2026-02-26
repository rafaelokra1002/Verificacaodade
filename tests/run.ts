// Runner principal dos testes
// Executa todos os módulos de teste em sequência

import { colors, printSummary } from './config';
import { testConexao } from './01-conexao.test';
import { testAutenticacao } from './02-auth.test';
import { testClientes } from './03-clientes.test';
import { testVerificacao } from './04-verificacao.test';
import { testLogs } from './05-logs.test';

async function runAllTests() {
  console.log('');
  console.log(`${colors.bold}╔══════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bold}║   🧪 TESTES AUTOMATIZADOS - Verificação ID      ║${colors.reset}`);
  console.log(`${colors.bold}╚══════════════════════════════════════════════════╝${colors.reset}`);

  try {
    // Executar suítes em ordem
    await testConexao();
    await testAutenticacao();
    await testClientes();
    await testVerificacao();
    await testLogs();
  } catch (error) {
    console.error(`\n${colors.red}Erro fatal durante execução dos testes:${colors.reset}`);
    console.error(error);
    process.exit(1);
  }

  // Resumo final
  printSummary();
}

runAllTests();
