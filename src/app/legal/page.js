export const metadata = { title: 'Legal Notice — One Dollar Quote' };

export default function LegalPage() {
  return (
    <div className="legal">
      <h1>Legal Notice</h1>
      <p className="updated">Last updated: 2026</p>

      <h2>Publisher</h2>
      <p>
        This website (onedollarquote.com) is published by Arber Kadriu.
        <br />
        Contact: <a href="mailto:myonedollarquote@gmail.com">myonedollarquote@gmail.com</a>
      </p>

      <h2>Publication director</h2>
      <p>Arber Kadriu.</p>

      <h2>Hosting and providers</h2>
      <p>
        The Site is hosted by <strong>Vercel Inc.</strong>, 440 N. Barranca Ave #4133, Covina,
        CA 91723, United States — phone: +1 (951) 383-6898 (
        <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">vercel.com</a>).
        The database is provided by <strong>Supabase</strong>, and payments are processed by{' '}
        <strong>Stripe</strong>.
      </p>

      <h2>Intellectual property</h2>
      <p>
        The design, layout and code of the Site are protected. Pages published by users remain
        subject to the licence described in the Terms.
      </p>

      <h2>External content</h2>
      <p>
        I am not responsible for the content of external sites linked from user pages. Images
        featured on the homepage are © of their respective owners.
      </p>

      <p style={{ marginTop: '28px', color: 'var(--muted)' }}>
        One Dollar Quote © 2026 Arber Kadriu. All rights reserved.
      </p>

      <a className="back" href="/">← Back to the book</a>
    </div>
  );
}
