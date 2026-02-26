// Página inicial - Redireciona para login admin
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/admin/login');
}
