'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { apiFetch, ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';

export default function RepoExplorer() {
  const t = useTranslations();
  const perPage = 30;
  const visibleCount = 10;

  // State
  const [categories, setCategories] = useState<{ key: string; label: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('trending');
  const [repos, setRepos] = useState<Repo[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [days, setDays] = useState(7);
  const [search, setSearch] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [showAlphabet, setShowAlphabet] = useState(false);
  const [alphabetPosition, setAlphabetPosition] = useState<string | null>(null);

  // Load categories
  useEffect(() => {
    apiFetch<{ key: string; label: string }[]>('/api/categories')
      .then(setCategories)
      .catch(console.error);
  }, []);

  // Initial fetch
  const fetchRepos = useCallback(
    async (reset = false) => {
      if (reset) {
        setPage(1);
        setRepos([]);
        setHasMore(true);
      }
      setLoading(true);
      try {
        const data = await apiFetch<ReposResponse>('/api/repos', {
          params: {
            category: selectedCategory,
            page: reset ? 1 : page,
            per_page: perPage,
            days,
            search,
            ...(selectedLanguage && { language: selectedLanguage }),
          },
        });
        setRepos(prev => (reset ? data.items : [...prev, ...data.items]));
        setTotalCount(data.total_count);
        setHasMore(data.items.length === perPage);
      } catch (e) {
        if (e instanceof ApiError) {
          console.error(`${e.message} (code: ${e.code})`);
        } else {
          console.error('Failed to fetch repositories');
        }
      } finally {
        setLoading(false);
      }
    },
    [selectedCategory, page, days, search, selectedLanguage]
  );

  useEffect(() => {
    fetchRepos(true);
  }, [selectedCategory, days, search]);

  // Infinite scroll
  const observer = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage(p => p + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (sentinelRef.current) observer.current.observe(sentinelRef.current);

    return () => observer.current?.disconnect();
  }, [hasMore, loading]);

  // Go to language
  const goToLanguage = useCallback(
    (lang: string) => {
      setSelectedLanguage(lang);
      setShowAlphabet(false);
      fetchRepos(true);
      setAlphabetPosition(lang);
    },
    [fetchRepos]
  );

  // Return to all languages
  const returnToAllLanguages = useCallback(() => {
    if (!alphabetPosition) return;
    setSelectedLanguage(null);
    fetchRepos(true);
    setTimeout(() => {
      const element = document.getElementById(`lang-${alphabetPosition}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }, [alphabetPosition, fetchRepos]);

  const categoriesLabels: Record<string, string> = {
    trending: '🔥 Trending',
    rust: '🦀 Rust',
    python: '🐍 Python',
    java: '☕ Java',
    vue: '💚 Vue',
    react: '⚛️ React',
    nestjs: '🐱 NestJS',
    cpp: '⚡ C++',
    'fast-growing': '📈 Fast Growing',
    ai: '🤖 AI / ML',
    cicd: '🚀 CI/CD',
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Category Pills */}
      <div className="flex-none py-2 px-2 flex gap-2 flex-wrap overflow-x-auto">
        {categories.map(cat => (
          <Button
            key={cat.key}
            variant={selectedCategory === cat.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setSelectedCategory(cat.key);
              setSelectedLanguage(null);
              fetchRepos(true);
            }}
          >
            {categoriesLabels[cat.key] || cat.label}
          </Button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Fixed Toolbar */}
        <Card className="flex-none w-64 p-2 flex flex-col h-40 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Languages</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setShowAlphabet(!showAlphabet)}
            >
              {showAlphabet ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
          {selectedLanguage && (
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="flex-1 text-center">
                {selectedLanguage}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={returnToAllLanguages}
                className="h-6 w-6 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="flex-1 overflow-auto">
            {showAlphabet ? (
              <div className="grid grid-cols-5 gap-1 text-xs">
                {Object.entries(AZ_LETTERS).map(([letter, langs]) => (
                  <Button
                    key={letter}
                    variant="ghost"
                    size="sm"
                    onClick={() => goToLanguage(langs[0])}
                    className="h-8 hover:bg-muted flex flex-col items-center"
                    id={`lang-${langs[0]}`}
                  >
                    <span>{letter}</span>
                    <span className="text-[10px] text-muted-foreground">{langs.length}</span>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1 text-xs">
                {Object.entries(AZ_LETTERS).map(([letter, langs]) => (
                  <Button
                    key={letter}
                    variant="ghost"
                    size="sm"
                    onClick={() => goToLanguage(langs[0])}
                    className="h-6 hover:bg-muted truncate text-left"
                  >
                    {letter}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Repo Cards */}
        <div className="flex-1 overflow-auto p-2">
          {loading && repos.length === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-lg" />
              ))}
            </div>
          )}
          {!loading && repos.length === 0 && !selectedLanguage && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <p className="mb-4">No repositories found</p>
              <Button variant="outline" onClick={() => setShowAlphabet(true)}>
                Browse Languages
              </Button>
            </div>
          )}
          {!loading && repos.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {repos.map(repo => (
                  <RepoCard key={repo.id} repo={repo} />
                ))}
              </div>
              {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {[...Array(visibleCount)].map((_, i) => (
                    <Skeleton key={repos.length + i} className="h-32 w-full rounded-lg" />
                  ))}
                </div>
              )}
            </>
          )}
          <div ref={sentinelRef} className="h-4" />
        </div>
      </div>

      {/* Fixed Footer */}
      <footer className="flex-none border-t">
        <Card>
          <CardContent className="pt-4 text-center text-sm text-muted-foreground">
            <div className="flex items-center justify-center gap-4">
              <span>Powered by NextJS</span>
              <span>•</span>
              <span>© 2026 Yokeay</span>
            </div>
          </CardContent>
        </Card>
      </footer>
    </div>
  );
}

interface Repo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  topics: string[];
  owner: { login: string; avatar_url: string; html_url: string };
  pushed_at: string;
}

interface ReposResponse {
  total_count: number;
  items: Repo[];
  rateLimit: { remaining: string; limit: string; reset: string };
}

interface RepoCardProps {
  repo: Repo;
}

function RepoCard({ repo }: RepoCardProps) {
  const truncatedDesc =
    repo.description && repo.description.length > 80
      ? repo.description.slice(0, 80) + '...'
      : repo.description;

  return (
    <Card className="h-32 hover:shadow-md transition-shadow">
      <div className="p-4 h-full flex flex-col">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <a
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold hover:underline truncate block"
              title={repo.full_name}
            >
              {repo.name}
            </a>
            <span className="text-xs text-muted-foreground">{repo.full_name}</span>
          </div>
          {repo.language && <Badge variant="outline">{repo.language}</Badge>}
        </div>
        {truncatedDesc && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2 flex-1">{truncatedDesc}</p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 16 16">
                <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm1 11H7V7h2v4zm0-5H7V5h2v1z" />
              </svg>
              {repo.stargazers_count.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 16 16">
                <path d="M8 1a2.5 2.5 0 00-2.5 2.5v4A2.5 2.5 0 008 10a2.5 2.5 0 002.5-2.5v-4A2.5 2.5 0 008 1zm3 8v1a3 3 0 01-6 0v-1h6z" />
              </svg>
              {repo.forks_count.toLocaleString()}
            </span>
          </div>
          <span className="truncate max-w-[80px]">
            {new Date(repo.pushed_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </Card>
  );
}

const AZ_LETTERS: Record<string, string[]> = {
  A: ['Assembly', 'awk', 'BlitzMax', 'Boo'],
  B: ['bash', 'Boo'],
  C: ['C', 'C#', 'C++'],
  D: ['Dart', 'Delphi'],
  E: ['Eiffel', 'Elm'],
  F: ['F#', 'Fantom', 'Factor'],
  G: ['Go'],
  H: ['Groovy', 'Haskell', 'Haxe'],
  I: ['Idris'],
  J: ['JavaScript', 'Julia'],
  K: ['Kotlin'],
  L: ['Lisp', 'Logo', 'Lua'],
  M: ['Max', 'Mercury'],
  N: ['Nemerle', 'NewLISP', 'Nim'],
  O: ['OCaml', 'Oberon', 'Oxygene'],
  P: ['Pascal', 'Pike'],
  R: ['R', 'Racket', 'REXX', 'Ruby'],
  S: ['SAS', 'Scheme', 'Scratch', 'Shell', 'Self'],
  T: ['Tcl', 'TeX', 'TypeScript'],
  V: ['Vala', 'Verilog', 'VHDL'],
  W: ['Wolfram'],
  X: ['X10'],
  Y: ['Yacc'],
};
