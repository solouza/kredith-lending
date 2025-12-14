import KredithApp from '@/components/KredithApp';

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Kita panggil komponen MVP di sini */}
      <KredithApp />
    </main>
  );
}