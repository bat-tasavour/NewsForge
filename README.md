# NewsForge: The Most Sophisticated Open-Source Newsroom Platform Ever Built

🌟 Show Your Support
If you found this project helpful, give it a ⭐️!

---

## "The headline is the 'ticket' on the meat. Use it to flag your customer."

In the world of digital publishing, speed is your currency and SEO is your lifeblood. Most CMS platforms are bloated, slow, and frankly, behind the times. 

**NewsForge** was built for the publisher who demands excellence. It is a single-site, SEO-first newsroom platform engineered with the precision of a Swiss watch. Built on the Next.js App Router, MongoDB, and Tiptap, it doesn't just manage content—it crafts an experience.

### Why You Should Choose NewsForge for Your Next Publication

**1. The "Perfect" Editor**
We use Tiptap to provide a writing experience that is as fluid as it is powerful. It stores both JSON and HTML, ensuring your content is future-proof and ready for any platform. It is not just a text box; it is a professional tool.

**2. An AI Assistant That Actually Works**
Integrated with OpenAI, NewsForge doesn't just wait for you to type. It suggests objective headlines, creates factual SEO summaries under 155 characters, and even writes descriptive ALT text for your images. It is like having a senior editor sitting right next to you, ensuring every piece of content is optimized for the web.

**3. The Most Advanced Image Engine in Open Source**
Images are the heaviest part of any news site. NewsForge handles them with ruthless efficiency. Powered by Sharp, it automatically converts uploads to WebP, generates responsive variants (480px to 1600px), creates thumbnails, and applies intelligent compression. Your site stays fast; your readers stay engaged.

**4. SEO as a First-Class Citizen**
We don't do "SEO plugins." SEO is baked into the core.
*   **Dynamic JSON-LD:** Automatic schema for `NewsArticle`, `BreadcrumbList`, and `Organization`.
*   **Automated Assets:** `sitemap.xml`, `robots.txt`, and `rss.xml` are generated on the fly.
*   **Server-Side Excellence:** Full SSR with cache revalidation means Google sees your content the millisecond it's published.

**5. A Design That Commands Respect**
Whether it’s the clean, stacking sections of the public homepage or the high-performance Admin CMS shell, every pixel has been placed with purpose. It is responsive, elegant, and built to convert visitors into loyal readers.

**6. Professional Newsroom Management**
Role-based access control (RBAC) ensures your `admin` and `editor` teams have the exact tools they need. Manage users, categories, and media with a level of control usually reserved for proprietary enterprise systems.

---

### The Blueprint (Setup)

To run NewsForge is to embrace the future of publishing. Follow these steps with care:

1.  **Prepare the Foundation:**
    ```bash
    npm install
    cp .env.example .env.local
    ```

2.  **Configure Your Command Center:**
    Ensure these variables are set in your `.env.local`:
    *   `MONGODB_URI`: Your database connection.
    *   `SITE_URL`: Where your news lives.
    *   `OPENAI_API_KEY`: For the AI Assistant.
    *   `AUTH_SECRET`: To keep your newsroom secure.
    *   `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`: Dev-only bootstrap credentials (not used in production).

3.  **Launch:**
    ```bash
    npm run dev
    ```

---

### Key Capabilities at a Glance

*   **Public Routes:** `/`, `/news/[slug]`, `/category/[slug]`, `/rss.xml`.
*   **Admin Panel:** Full management of articles, categories, users, and media.
*   **Newsletter:** Built-in subscription system with source tracking and validation.
*   **Security:** JWT-based sessions with server-side role enforcement.

---

👤 **Author**
**Syed Tasavour**

*   **GitHub:** [@syedtasavour](https://github.com/syedtasavour)
*   **Portfolio:** [syedtasavour.me](https://syedtasavour.me)

📞 **Contact**
For any queries or support:
*   **Email:** help@syedtasavour.me
*   **GitHub Issues:** [Create an issue](https://github.com/syedtasavour/NewsForge/issues)

*Built with passion (and a lot of coffee) by Syed Tasavour.*
