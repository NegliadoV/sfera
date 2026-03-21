import 'dotenv/config';
import { sendDailyDigests } from '../lib/emails/digest-sender';

async function main() {
  console.log('🚀 Запуск воркера дайджеста (Email)...');
  try {
    await sendDailyDigests();
    console.log('✅ Воркер дайджеста успешно завершил работу.');
  } catch (err) {
    console.error('Ошибка в воркере дайджеста:', err);
    process.exit(1);
  }
  process.exit(0);
}

main();
