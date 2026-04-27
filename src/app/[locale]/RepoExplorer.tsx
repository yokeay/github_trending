'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { apiFetch, ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Repo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  topics: string[];
  owner: { login: string; avatar_url: string; html_url: string };
  pushed_at: string;
}

interface Category {
  key: string;
  label: string;
}

interface ReposResponse {
  total_count: number;
  items: Repo[];
  rateLimit: { remaining: string; limit: string; reset: string };
}

const PER_PAGE_OPTIONS = [15, 30, 50, 100];

export default function RepoExplorer() {
  const t = useTranslations();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('trending');
  const [repos, setRepos] = useState<Repo[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(30);
  const [days, setDays] = useState(7);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rateLimit, setRateLimit] = useState<{
    remaining: string;
    limit: string;
    reset: string;
  } | null>(null);

  // Load categories on mount
  useEffect(() => {
    apiFetch<Category[]>('/api/categories').then(setCategories).catch(console.error);
  }, []);

  // Fetch repos when params change
  const fetchRepos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<ReposResponse>('/api/repos', {
        params: { category: selectedCategory, page, per_page: perPage, days, search },
      });
      setRepos(data.items);
      setTotalCount(data.total_count);
      setRateLimit(data.rateLimit);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(`${e.message} (code: ${e.code})`);
      } else {
        setError('Failed to fetch repositories');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, page, perPage, days, search]);

  // Use ref to track initial mount and avoid cascading renders
  const isInitialFetch = useCallback(() => {
    return true;
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRepos();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchRepos]);

  const totalPages = Math.ceil(totalCount / perPage);

  return (
    <div className="space-y-6">
      {/* Search & Filters Toolbar */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-4 md:flex-row">
            <Input
              placeholder={t('toolbar.searchPlaceholder', { default: 'Search repositories...' })}
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="max-w-xs"
            />
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">
                {t('toolbar.days', { default: 'Days' })}:
              </label>
              <Input
                type="number"
                min={1}
                max={365}
                value={days}
                onChange={e => setDays(Math.max(1, Number(e.target.value)))}
                className="w-20"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">{t('toolbar.perPage')}:</label>
              <select
                value={perPage}
                onChange={e => {
                  setPerPage(Number(e.target.value));
                  setPage(1);
                }}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {PER_PAGE_OPTIONS.map(p => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <Button
            key={cat.key}
            variant={selectedCategory === cat.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setSelectedCategory(cat.key);
              setPage(1);
            }}
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Rate Limit Info */}
      {rateLimit && (
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            API Rate: {rateLimit.remaining}/{rateLimit.limit}
          </span>
          <span>Total: {totalCount.toLocaleString()}</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-4 text-destructive">{error}</CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {/* Repo Table */}
      {!loading && !error && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Repository</TableHead>
                <TableHead className="text-center">Stars</TableHead>
                <TableHead className="text-center">Forks</TableHead>
                <TableHead className="text-center">Language</TableHead>
                <TableHead className="w-[200px]">Topics</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {repos.map(repo => (
                <TableRow key={repo.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium hover:underline"
                      >
                        {repo.name}
                      </a>
                      <span className="text-sm text-muted-foreground">{repo.full_name}</span>
                      {repo.description && (
                        <span className="text-xs text-muted-foreground line-clamp-2">
                          {repo.description}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-mono">
                    {repo.stargazers_count.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center font-mono">
                    {repo.forks_count.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center">
                    {repo.language && <Badge variant="secondary">{repo.language}</Badge>}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {repo.topics.slice(0, 3).map(topic => (
                        <Badge key={topic} variant="outline" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            {t('pagination.prev', { default: 'Prev' })}
          </Button>
          <span className="px-4 py-2">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >
            {t('pagination.next', { default: 'Next' })}
          </Button>
        </div>
      )}
    </div>
  );
}
