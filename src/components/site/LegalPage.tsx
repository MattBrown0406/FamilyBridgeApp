import type { ReactNode } from 'react';
import { BrandedFooter } from '@/components/BrandedFooter';
import { SEOHead, createBreadcrumbSchema } from '@/components/SEOHead';
import PublicCrisisHelp from '@/components/PublicCrisisHelp';
import { SiteHeader } from '@/components/site/SiteChrome';

export interface LegalSection {
  id: string;
  title: string;
  body: ReactNode;
}

/** Shared layout for Privacy, Terms and EULA: title, date, a table of contents and readable sections. */
export const LegalPage = ({ title, path, description, updated, intro, sections }: {
  title: string;
  path: string;
  description: string;
  updated: string;
  intro: ReactNode;
  sections: LegalSection[];
}) => (
  <div className="min-h-screen bg-background flex flex-col">
    <SEOHead title={`${title} | FamilyBridge`} description={description} canonicalPath={path} structuredData={createBreadcrumbSchema([{ name: 'Home', url: '/' }, { name: title, url: path }])} />
    <SiteHeader />
    <main className="flex-1 container mx-auto px-4 py-10 sm:py-14 max-w-3xl">
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: {updated}</p>
      <div className="mt-6 text-lg leading-relaxed text-foreground/90 [&_p]:mt-3">{intro}</div>
      <nav aria-label="On this page" className="mt-8 rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">On this page</p>
        <ol className="mt-3 grid gap-1.5 sm:grid-cols-2 text-sm">
          {sections.map((s, i) => (
            <li key={s.id}><a href={`#${s.id}`} className="text-primary hover:underline">{i + 1}. {s.title}</a></li>
          ))}
        </ol>
      </nav>
      <div className="mt-10 space-y-10">
        {sections.map((s, i) => (
          <section key={s.id} id={s.id} className="scroll-mt-20">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">{i + 1}. {s.title}</h2>
            <div className="mt-3 space-y-3 leading-relaxed text-muted-foreground [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_a]:text-primary [&_a]:underline [&_table]:w-full [&_td]:border-t [&_td]:border-border [&_td]:py-2 [&_td]:pr-3 [&_td]:align-top [&_th]:text-left [&_th]:py-2 [&_th]:text-foreground">
              {s.body}
            </div>
          </section>
        ))}
      </div>
      <PublicCrisisHelp className="mt-12" />
    </main>
    <BrandedFooter />
  </div>
);
