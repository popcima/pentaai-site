"""Regression checks for daily publication without resetting existing dates."""
import contextlib
import copy
import importlib.util
import io
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch
import xml.etree.ElementTree as ET

SCRIPT = Path(__file__).with_name('build_blog.py')
spec = importlib.util.spec_from_file_location('blog_builder', SCRIPT)
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)
ORIGINAL = json.loads((SCRIPT.parents[1] / 'content/posts.json').read_text())

class PublicationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / 'content').mkdir()
        self.source = self.root / 'content/posts.json'
        self.posts = copy.deepcopy(ORIGINAL)
        for p in self.posts:
            p.pop('published', None)
            p.pop('modified', None)
        self.save()

    def save(self):
        self.source.write_text(json.dumps(self.posts))

    def run_build(self, *args):
        with patch.object(builder, 'ROOT', self.root), patch.object(builder, 'SITE', self.root / 'site'), patch.object(sys, 'argv', ['build_blog.py', *args]), contextlib.redirect_stdout(io.StringIO()):
            builder.main()
        self.posts = json.loads(self.source.read_text())

    def add_draft(self):
        p = copy.deepcopy(self.posts[0])
        p.update(slug='publication-test-new-guide', title='New publication test guide', date='2026-10-26', related=[])
        p.pop('published', None)
        p.pop('modified', None)
        self.posts.append(p)
        self.save()

    def test_later_batch_preserves_first_publication_and_feed_dates(self):
        self.run_build('--publish-date', '2026-10-25', '--published-only')
        self.add_draft()
        self.run_build('--publish-date', '2026-10-26', '--published-only')
        self.assertEqual({p['published'] for p in self.posts[:-1]}, {'2026-10-25'})
        self.assertEqual(self.posts[-1]['published'], '2026-10-26')
        feed = ET.parse(self.root / 'site/feed.xml')
        items = feed.findall('./channel/item')
        self.assertIn('25 Oct 2026', items[0].findtext('pubDate'))
        self.assertIn('26 Oct 2026', items[-1].findtext('pubDate'))
        old = (self.root / 'site/blog' / self.posts[0]['slug'] / 'index.html').read_text()
        self.assertIn('"datePublished":"2026-10-25"', old)

    def test_live_build_excludes_unpublished_drafts(self):
        self.run_build('--publish-date', '2026-10-25', '--published-only')
        self.add_draft()
        self.run_build('--published-only')
        self.assertFalse((self.root / 'site/blog/publication-test-new-guide/index.html').exists())
        for name in ['sitemap.xml', 'feed.xml', 'blog/index.html']:
            self.assertNotIn('publication-test-new-guide', (self.root / 'site' / name).read_text())

    def test_stale_public_draft_is_reported(self):
        self.run_build('--publish-date', '2026-10-25')
        self.add_draft()
        self.run_build()
        with contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit):
            self.run_build('--published-only')

if __name__ == '__main__':
    unittest.main()
