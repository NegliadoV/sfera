import Link from 'next/link';
import { redirect } from 'next/navigation';
import { UniversesDemo } from '@/components/UniversesDemo';
import { auth } from '@/auth';

export default async function HomePage(
  props: {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
  }
) {
  const searchParams = await props.searchParams;
  if (searchParams) await searchParams;

  let session = null;
  try {
    session = await auth();
    if (session?.user) {
      redirect('/explore');
    }
  } catch {}

  return (
    <div className="platform-page relative animate-in fade-in duration-700">
      {/* Мягкое фоновое свечение (glow) */}
      {/* Фоновое свечение теперь глобальное (в layout.tsx), чтобы всё приложение было единообразным */}

      <section className="text-center mb-20 md:mb-28 relative mt-12 z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-8 animate-in slide-in-from-bottom-4 duration-700" style={{ background: 'color-mix(in srgb, var(--accent-primary) 15%, transparent)', borderColor: 'color-mix(in srgb, var(--accent-primary) 30%, transparent)', color: 'var(--accent-primary)' }}>
          <i className="fa-solid fa-shapes" />
          <span className="text-sm font-semibold tracking-wide uppercase">Пространство без шума</span>
        </div>
        
        <h1 className="platform-hero-title font-extrabold tracking-tight mb-6 animate-in slide-in-from-bottom-6 duration-700 delay-100" style={{ lineHeight: 1.15 }}>
          Интернет, разбитый на <br />
          <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #0ea5e9 0%, #a855f7 100%)' }}>
            уютные комнаты
          </span>
        </h1>
        
        <p className="platform-hero-desc mx-auto text-lg md:text-xl mb-10 animate-in slide-in-from-bottom-8 duration-700 delay-200" style={{ color: 'var(--studio-meta-color)', maxWidth: '750px', lineHeight: 1.7 }}>
          Roominate — это место, где весь контент, идеи и дискуссии разложены по полочкам. Бесконечная мультивселенная, в которой вы сами выбираете портал: никакого хаоса, только то, что важно именно сейчас.
        </p>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-5 animate-in slide-in-from-bottom-10 duration-700 delay-300 w-full sm:w-auto px-2 sm:px-0">
          <Link href={session?.user ? "/universes" : "/auth/signin"} className="platform-btn platform-btn-primary no-underline text-base sm:text-lg px-6 py-3 sm:px-8 sm:py-4 shadow-2xl hover:scale-105 transition-transform flex-1 justify-center whitespace-normal text-center h-auto min-h-[50px] leading-tight" style={{ borderRadius: '50px' }}>
            <i className="fa-solid fa-door-open" aria-hidden />
            Войти в комнаты
          </Link>
          <Link href="/auth/register" className="platform-btn no-underline text-base sm:text-lg px-6 py-3 sm:px-8 sm:py-4 glass-icon-btn hover:scale-105 transition-transform flex-1 justify-center whitespace-normal text-center h-auto min-h-[50px] leading-tight" style={{ borderRadius: '50px' }}>
            Создать аккаунт
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
        <ConceptCard
          icon="fa-layer-group"
          title="Тематические комнаты"
          description="Создавайте собственные пространства под любые интересы. В каждой комнате — своя атмосфера, свой контент и свои правила."
          tags={['четкий контекст', 'свои интересы']}
          delay="100ms"
        />
        <ConceptCard
          icon="fa-comments"
          title="Фокус на обсуждении"
          description="Никакого разбросанного текста. Дискуссии организованы в понятные ветки, чтобы было легко находить нужное и хранить историю идей."
          tags={['структурированные беседы', 'без хаоса']}
          delay="200ms"
        />
        <ConceptCard
          icon="fa-cubes"
          title="Связанная мультивселенная"
          description="Свободно перемещайтесь между комнатами через порталы. Умная площадка связывает смыслы и отсекает информационный шум."
          tags={['мультивселенная', 'чистый фокус']}
          delay="300ms"
        />
      </section>

      <UniversesDemo />
    </div>
  );
}

function ConceptCard({
  icon,
  title,
  description,
  tags,
  delay,
}: {
  icon: string;
  title: string;
  description: string;
  tags: string[];
  delay: string;
}) {
  return (
    <article 
      className="platform-card group hover:-translate-y-2 transition-all duration-300 animate-in slide-in-from-bottom-8 fill-mode-both"
      style={{ animationDelay: delay }}
    >
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border transition-transform duration-300 group-hover:scale-110" style={{ background: 'color-mix(in srgb, var(--accent-primary) 10%, transparent)', borderColor: 'color-mix(in srgb, var(--accent-primary) 20%, transparent)' }}>
        <i className={`fa-solid ${icon} text-2xl`} style={{ color: 'var(--accent-primary)' }} aria-hidden />
      </div>
      <div className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
        {title}
      </div>
      <p className="mb-6 leading-relaxed" style={{ color: 'var(--studio-meta-color)', fontSize: '0.95rem' }}>
        {description}
      </p>
      <div className="flex flex-wrap gap-2 mt-auto">
        {tags.map((tag) => (
          <span 
            key={tag} 
            className="text-xs font-medium px-3 py-1.5 rounded-full border transition-colors"
            style={{ 
              background: 'color-mix(in srgb, var(--bg-accent) 50%, transparent)', 
              borderColor: 'var(--border-color)',
              color: 'var(--text-secondary)'
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </article>
  );
}
