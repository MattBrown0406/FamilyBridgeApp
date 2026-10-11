// Vite plugin for the blog:
//  - "virtual:familybridge-blog" gives the React site the list of articles (homepage "Guides for families", nav link);
//  - in development (and the Lovable preview) it serves the same static blog pages the build writes.
import { join } from 'node:path';
import { BLOG_DIR_FROM_ROOT, loadPosts, postSummaries } from './content.mjs';
import { renderBlogRoute } from './render.mjs';

const VIRTUAL_ID = 'virtual:familybridge-blog';
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

export function familyBridgeBlog() {
  let root = process.cwd();
  return {
    name: 'familybridge-blog',
    configResolved(config) {
      root = config.root;
    },
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : undefined;
    },
    load(id) {
      if (id !== RESOLVED_ID) return undefined;
      return `export const blogPosts = ${JSON.stringify(postSummaries(loadPosts(root, { log: { warn: () => {} } })))};\n`;
    },
    configureServer(server) {
      const dir = join(root, BLOG_DIR_FROM_ROOT);
      server.watcher.add(dir);
      server.watcher.on('all', (_event, file) => {
        if (!file.startsWith(dir)) return;
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
        if (mod) server.moduleGraph.invalidateModule(mod);
      });
      server.middlewares.use((req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') return next();
        const { pathname } = new URL(req.url ?? '/', 'http://localhost');
        if (!pathname.startsWith('/blog')) return next();
        const page = renderBlogRoute(pathname, loadPosts(root));
        if (!page) return next();
        res.setHeader('Content-Type', page.type);
        res.end(page.body);
      });
    },
  };
}
