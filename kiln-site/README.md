# Kiln Recordings + Alexander Hulme website

Plain HTML, CSS and JavaScript. No framework and no build step. Open `index.html` in a browser to view it.

## Files
- `index.html`: the hub (split screen)
- `kiln.html`: studio page (hero, featured on, testimonials, listen, studio, services, enquiry form)
- `plugins.html`: Kiln Audio Suite plugins (Mastering and FX)
- `alexander.html`: album, journal and the Stay in the loop sign-up
- `journal.html` and `post-*.html`: the blog
- `assets/css/site.css`: all styling (colours and fonts at the top)
- `assets/js/site.js`: forms, the Listen player, the album preview and the testimonial slider
- `assets/img/` and `assets/audio/`: images and sound

Anything in [square brackets] is a placeholder.

## Going live (Cloudflare, free)
1. Switch the two forms from Netlify to Kit (mailing list) and Formspree (enquiries). Ask Claude to do this.
2. Create a free Cloudflare account, make a new project, choose the option to upload your files, and drag in this folder.
3. Add your custom domain in Cloudflare and point the domain at it.
4. Cancel the Squarespace website plan only once the new site is live on your domain. Don't let the domain itself lapse.

To update the site, upload the folder again.
