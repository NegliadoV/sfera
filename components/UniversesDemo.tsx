'use client';

import { useState } from 'react';

const universes = [
  {
    id: 'quantum',
    name: 'Квантовая физика',
    description:
      'Пространство для обсуждения квантовой механики, квантовой теории поля и смежных областей. Здесь вы найдете научные статьи, пояснительные видео, обсуждения интерпретаций квантовой механики и последних открытий.',
    stats: { participants: '2.4k', materials: '124', discussions: '86' },
    discussions: [
      'Копенгагенская vs многомировая интерпретация: сравнительный анализ',
      'Квантовая запутанность и ее практическое применение',
      'Проблема измерения в квантовой механике',
    ],
  },
  {
    id: 'urban',
    name: 'Урбанистика 80-х',
    description:
      'Изучение градостроительства, архитектуры и городской культуры 1980-х годов. Коллекция архивных материалов, фотографий, интервью с архитекторами и исследовательские работы.',
    stats: { participants: '1.8k', materials: '98', discussions: '54' },
    discussions: [],
  },
  {
    id: 'embroidery',
    name: 'Вышивание крестиком',
    description:
      'Сообщество любителей вышивания крестиком. Обмен схемами, техниками, историческими традициями и современными подходами к вышиванию.',
    stats: { participants: '3.2k', materials: '210', discussions: '142' },
    discussions: [],
  },
  {
    id: 'philosophy',
    name: 'Философия сознания',
    description:
      'Исследование природы сознания, проблемы «разум-тело», искусственного интеллекта и феноменологии. Междисциплинарный подход с привлечением нейронаук, психологии и компьютерных наук.',
    stats: { participants: '2.1k', materials: '156', discussions: '92' },
    discussions: [],
  },
] as const;

export function UniversesDemo() {
  type UniverseId = (typeof universes)[number]['id'];
  const [activeId, setActiveId] = useState<UniverseId>(universes[0].id);
  const active = universes.find((u) => u.id === activeId)!;

  return (
    <section className="platform-card mb-16">
      <div className="platform-card-title mb-4">
        <i className="fa-solid fa-star" aria-hidden />
        Примеры тематических сфер
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {universes.map((u) => (
          <button
            key={u.id}
            type="button"
            onClick={() => setActiveId(u.id)}
            className={`platform-btn platform-btn-sm ${activeId === u.id ? 'platform-btn-primary' : ''}`}
          >
            {u.name}
          </button>
        ))}
      </div>
      <div
        key={active.id}
        className="animate-in block slide-in-from-bottom-2 fade-in duration-300 rounded-2xl p-6 md:p-8"
        style={{ background: 'color-mix(in srgb, var(--bg-accent) 40%, transparent)', border: '1px solid var(--border-subtle)' }}
      >
        <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
          <h3 className="platform-card-title mb-0">Сфера: {active.name}</h3>
          <div className="flex flex-wrap gap-6 text-sm platform-card-desc">
            <span><i className="fa-solid fa-users" style={{ marginRight: 6 }} />{active.stats.participants} участников</span>
            <span><i className="fa-solid fa-file-lines" style={{ marginRight: 6 }} />{active.stats.materials} материалов</span>
            <span><i className="fa-solid fa-comments" style={{ marginRight: 6 }} />{active.stats.discussions} дискуссий</span>
          </div>
        </div>
        <div
          className="inline-flex items-center gap-2 platform-tag mb-4"
          style={{ background: 'var(--studio-status-live-bg)', borderColor: 'var(--studio-status-live-border)', color: 'var(--studio-status-live-color)' }}
        >
          <i className="fa-solid fa-clock animate-pulse" />
          <span>Режим фокуса активен (таймер: 45:00)</span>
        </div>
        <p className="platform-card-desc mb-4">{active.description}</p>
        {active.discussions.length > 0 && (
          <div className="mt-6 border-t pt-4" style={{ borderColor: 'var(--border-subtle)' }}>
            <strong className="text-sm uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>Актуальные дискуссии:</strong>
            <ul className="mt-3 pl-5 list-disc platform-card-desc space-y-1">
              {active.discussions.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
