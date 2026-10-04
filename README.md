# Portfolio-Moon 🌙

My personal portfolio: a landing page that splits into two tracks, one for engineering work and one for creative work.

**Live site:** [mehulsri07.github.io/Portfolio-Moon](https://mehulsri07.github.io/Portfolio-Moon/)

---

## 🚀 Features

- **Landing page:** scroll-driven hands that reach out over an animated starfield and lead into each track.
- **Two tracks:** hover the coding side for a Matrix-style digital rain effect, or the creative side for the art portfolio. Each leads to its own page.
- **Pages:** about, coding projects, creative work (photo gallery) and contact, with animated page transitions.
- **Automated image pipeline:** a GitHub Actions workflow converts new gallery photos to WebP whenever `Images/Portfolio_Creativity/` or `data/photos.json` changes.

---

## 🛠️ Tech Stack

- **Core:** HTML5, CSS3, JavaScript (ES modules)
- **Animation:** Canvas API (starfield, digital rain, cursor trail), scroll-driven CSS/JS
- **Hosting & CI:** GitHub Pages, GitHub Actions (Python WebP conversion)

---

## 📁 Project Structure

```text
Portfolio-Moon/
├── index.html            # Landing page
├── pages/                # about, coding, creativity, contact
├── js/                   # Hands rig, starfield, hover effects, cursor trail, transitions
├── css/                  # style.css (landing), pages.css (shared by sub-pages)
├── assets/               # Hand images, favicon
├── Images/               # Profile picture and creative portfolio photos
├── data/photos.json      # Gallery metadata
├── scripts/              # convert_images.py (JPG to WebP)
└── .github/workflows/    # convert-images.yml
```

---

## 💻 Running locally

The site uses ES modules, so serve it over HTTP instead of opening the file directly:

```bash
git clone https://github.com/Mehulsri07/Portfolio-Moon.git
cd Portfolio-Moon
python -m http.server 8000
```

Then open http://localhost:8000.
