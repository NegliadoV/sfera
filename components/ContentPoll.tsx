'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';

type PollOption = {
  id: string;
  text: string;
};

type PollVote = {
  id: string;
  optionId: string;
  userId: string;
};

type ContentPollProps = {
  pollId: string;
  options: PollOption[];
  initialVotes?: PollVote[]; // we might pass this if SSR later
  pollAuthorId?: string;
  className?: string;
};

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function ContentPoll({ pollId, options, initialVotes = [], className = '' }: ContentPollProps) {
  const [votes, setVotes] = useState<PollVote[]>(initialVotes);
  const [isVoting, setIsVoting] = useState(false);
  
  // We fetch the current session user info to know if they voted.
  const { data: sessionData } = useSWR('/api/me', fetcher);
  const currentUserId = sessionData?.user?.id;
  
  // SWR for votes
  const { data: latestVotesData, mutate } = useSWR(`/api/polls/${pollId}/votes`, fetcher);
  
  useEffect(() => {
    if (latestVotesData && Array.isArray(latestVotesData)) {
      setVotes(latestVotesData);
    }
  }, [latestVotesData]);

  const totalVotes = votes.length;
  
  const userVotedOptionId = currentUserId 
    ? votes.find(v => v.userId === currentUserId)?.optionId 
    : undefined;

  const handleVote = async (optionId: string) => {
    if (!currentUserId || userVotedOptionId || isVoting) return;
    setIsVoting(true);
    
    // optimistic UI
    const tempVote: PollVote = { id: 'temp', optionId, userId: currentUserId };
    setVotes([...votes, tempVote]);
    
    try {
      const res = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId })
      });
      if (res.ok) {
        mutate(); // re-fetch to confirm
      } else {
        // revert on failure
        setVotes(votes.filter(v => v.id !== 'temp'));
      }
    } catch {
       setVotes(votes.filter(v => v.id !== 'temp'));
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className={`flex flex-col gap-3 my-4 p-5 rounded-2xl bg-[var(--bg-accent)] border border-[var(--border-color)] ${className}`}>
      <div className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
        <i className="fa-solid fa-chart-pie"></i> Опрос
      </div>
      
      {options.map((option) => {
        const optionVotes = votes.filter(v => v.optionId === option.id).length;
        const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
        const isSelected = userVotedOptionId === option.id;

        return (
          <button
            key={option.id}
            onClick={() => handleVote(option.id)}
            disabled={!!userVotedOptionId || !currentUserId || isVoting}
            className={`relative flex items-center justify-between px-4 py-3 rounded-xl overflow-hidden text-left border transition-all ${
              isSelected 
                ? 'border-[var(--accent-primary)] bg-[color-mix(in_srgb,var(--accent-primary)_10%,transparent)]' 
                : 'border-[var(--border-color)] bg-white/5 hover:bg-white/10'
            } ${userVotedOptionId ? 'cursor-default' : 'cursor-pointer'} ${!currentUserId ? 'opacity-70' : ''}`}
          >
            {/* Animated Progress Bar */}
            <div 
              className="absolute left-0 top-0 bottom-0 bg-[var(--border-color)] opacity-20 transition-all duration-700 ease-out"
              style={{ width: `${userVotedOptionId ? percentage : 0}%`, 
                       backgroundColor: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
            />
            
            <div className="relative z-10 flex items-center gap-3 w-full font-medium" style={{ color: 'var(--text-primary)' }}>
               {/* Selection Indicator */}
               <div className={`shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-[var(--accent-primary)]' : 'border-[var(--text-secondary)]'}`}>
                 {isSelected && <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)]" />}
               </div>
               <span className="flex-1">{option.text}</span>
            </div>
            
            {(userVotedOptionId !== undefined) && (
              <div className="relative z-10 text-sm font-bold ml-4" style={{ color: 'var(--text-secondary)' }}>
                {percentage}%
              </div>
            )}
          </button>
        );
      })}
      
      <div className="mt-2 text-xs flex justify-between" style={{ color: 'var(--text-meta)' }}>
        <span>{totalVotes} {getNoun(totalVotes, 'голос', 'голоса', 'голосов')}</span>
        {!currentUserId && <span>Авторизуйтесь, чтобы голосовать</span>}
      </div>
    </div>
  );
}

// Utility for Russian plurals
function getNoun(number: number, one: string, two: string, five: string) {
  let n = Math.abs(number);
  n %= 100;
  if (n >= 5 && n <= 20) {
    return five;
  }
  n %= 10;
  if (n === 1) {
    return one;
  }
  if (n >= 2 && n <= 4) {
    return two;
  }
  return five;
}
