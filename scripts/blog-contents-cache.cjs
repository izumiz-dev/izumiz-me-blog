/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-var-requires */
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Client } = require('@notionhq/client');
const { PromisePool } = require('@supercharge/promise-pool');

const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }
    const delimiterIndex = trimmed.indexOf('=');
    if (delimiterIndex === -1) {
      return;
    }
    const key = trimmed.slice(0, delimiterIndex).trim();
    let value = trimmed.slice(delimiterIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key] || process.env[key].length === 0) {
      process.env[key] = value;
    }
  });
}

const log = (level, message, meta) => {
  const timestamp = new Date().toISOString();
  const parts = [`[${timestamp}]`, level];
  if (meta && meta.pageId) {
    parts.push(`page=${meta.pageId}`);
  }
  if (meta && meta.databaseId) {
    parts.push(`database=${meta.databaseId}`);
  }
  parts.push(message);
  console.log(parts.join(' | '));
};

if (!process.env.NOTION_API_SECRET) {
  log('WARN', 'NOTION_API_SECRET is not set. Requests will fail.');
}

const notion = new Client({ auth: process.env.NOTION_API_SECRET });

const GALLERY_MODE = false;

const getAllPages = async (isGallery = false) => {
  const params = {
    database_id: isGallery ? process.env.GALLERY_ID : process.env.DATABASE_ID,
    filter: {
      and: [
        {
          property: 'Published',
          checkbox: {
            equals: true,
          },
        },
        {
          property: 'Date',
          date: {
            on_or_before: new Date().toISOString(),
          },
        },
      ],
    },
  };

  let results = [];
  while (true) {
    try {
      log('INFO', 'Querying Notion database', {
        databaseId: params.database_id || '<unknown>',
      });
      const res = await notion.databases.query(params);

      results = results.concat(res.results);

      if (!res.has_more) {
        break;
      }

      params['start_cursor'] = res.next_cursor;
    } catch (error) {
      log('ERROR', 'Failed while querying Notion database', {
        databaseId: params.database_id || '<unknown>',
      });
      if (error && error.body) {
        log('ERROR', `Notion response body: ${error.body}`, {
          databaseId: params.database_id || '<unknown>',
        });
      }
      if (error && error.message) {
        log('ERROR', `Error message: ${error.message}`, {
          databaseId: params.database_id || '<unknown>',
        });
      }
      throw error;
    }
  }

  const pages = results.map((result) => {
    return {
      id: result.id,
      last_edited_time: result.last_edited_time,
      slug: result.properties.Slug.rich_text
        ? result.properties.Slug.rich_text[0].plain_text
        : '',
    };
  });

  return pages;
};

(async () => {
  const pages = await getAllPages(GALLERY_MODE);

  const concurrency = parseInt(process.env.CACHE_CONCURRENCY || '1', 10);

  await PromisePool.withConcurrency(concurrency)
    .for(pages)
    .process(async (page, index) => {
      return new Promise((resolve) => {
        log('INFO', `Processing page (${index + 1}/${pages.length})`, {
          pageId: page.id,
        });
        const command = `NX_BRANCH=main node scripts/retrieve-block-children.cjs ${page.id}`;
        const options = { timeout: 60000 };

        log('INFO', `Running command: ${command}`, { pageId: page.id });
        exec(command, options, (err, stdout, stderr) => {
          if (stdout) {
            stdout
              .split('\n')
              .filter(Boolean)
              .forEach((line) => log('INFO', line, { pageId: page.id }));
          }
          if (stderr) {
            stderr
              .split('\n')
              .filter(Boolean)
              .forEach((line) => log('WARN', line, { pageId: page.id }));
          }
          if (err) {
            log('ERROR', `exec error: ${err}`, { pageId: page.id });
          }
          return resolve();
        });
      });
    });
})();
