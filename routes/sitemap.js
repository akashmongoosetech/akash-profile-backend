const express = require('express');
const Blog = require('../models/Blog');
const Event = require('../models/Event');
const CaseStudy = require('../models/CaseStudy');

const router = express.Router();

router.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = process.env.CLIENT_URL || 'https://akashraikwar.in';

    // Static routes
    const staticPages = [
      '',
      '/about',
      '/projects',
      '/skills',
      '/services',
      '/experience',
      '/testimonials',
      '/blog',
      '/events',
      '/contact',
      '/case-studies',
      '/tools',
      '/ai-chat'
    ];

    // Fetch dynamic content
    const blogs = await Blog.find({ published: true }).select('slug updatedAt').lean();
    const events = await Event.find({ published: true }).select('slug date').lean();
    const caseStudies = await CaseStudy.find({ published: true }).select('_id updatedAt').lean();

    let xml = '<?xml version="1.0" encoding="UTF-8"?>';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

    // Add static pages
    staticPages.forEach(page => {
      xml += `
  <url>
    <loc>${baseUrl}${page}</loc>
    <changefreq>weekly</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>`;
    });

    // Add blogs
    blogs.forEach(blog => {
      const lastMod = blog.updatedAt ? new Date(blog.updatedAt).toISOString() : new Date().toISOString();
      xml += `
  <url>
    <loc>${baseUrl}/blog/${blog.slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;
    });

    // Add events
    events.forEach(event => {
      const lastMod = event.date ? new Date(event.date).toISOString() : new Date().toISOString();
      xml += `
  <url>
    <loc>${baseUrl}/events/${event.slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });

    // Add case studies
    caseStudies.forEach(cs => {
      const lastMod = cs.updatedAt ? new Date(cs.updatedAt).toISOString() : new Date().toISOString();
      xml += `
  <url>
    <loc>${baseUrl}/case-studies</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
    });

    xml += '\n</urlset>';

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

module.exports = router;
