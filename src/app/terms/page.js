export const metadata = { title: 'Terms — One Dollar Quote' };

export default function TermsPage() {
  return (
    <div className="legal">
      <h1>Terms of Use &amp; Sale</h1>
      <p className="updated">Last updated: 2026</p>

      <p>
        One Dollar Quote (the “Site”) is a living book written by strangers. Anyone can buy a
        page for €1 and publish a short quote or a personal story on it, permanently and publicly.
        By using the Site or buying a page, you agree to these Terms.
      </p>

      <h2>1. Eligibility</h2>
      <p>
        You must be at least 18 years old (or of legal age in your country), or have the consent of
        a parent or legal guardian, to buy and publish a page.
      </p>

      <h2>2. Buying and publishing a page</h2>
      <p>
        Each page costs €1, paid securely through Stripe. Once your payment is confirmed, you can
        choose a format (a quote or a story), write your text, add a signature and, optionally, a
        link. Publication is <strong>immediate, public and permanent</strong>: your page becomes
        part of the book and visible to everyone.
      </p>

      <h2>3. Your public content</h2>
      <p>
        By paying and publishing a page, you understand and accept that your text, your signature
        (name, handle, or “anonymous”) and any link you add are <strong>published publicly</strong>
        and can be seen and searched by anyone. Do not publish anything you are not comfortable
        making public and permanent.
      </p>

      <h2>4. Licence to use your page</h2>
      <p>
        By publishing a page, you grant Arber Kadriu the right to use, reproduce and display your
        page — including its text, signature, link and any information on it — for content creation,
        promotion and communication, on any medium and platform, as he sees fit, without further
        compensation.
      </p>

      <h2>5. Rules of conduct — prohibited content</h2>
      <p>The following are not allowed and will be removed:</p>
      <ul>
        <li>Racism, hate speech, or discrimination of any kind;</li>
        <li>Political or religious campaigning or propaganda;</li>
        <li>Shaming, harassment, bullying, or targeting of a person;</li>
        <li>Excessive insults, threats, or incitement to violence;</li>
        <li>Impersonation — signing in someone else’s name and/or adding a link that is not yours;</li>
        <li>Sharing another person’s private information (doxxing);</li>
        <li>Sexual, explicit, or age-inappropriate content, or any content harming minors;</li>
        <li>Content that is illegal or that promotes illegal activities;</li>
        <li>Spam, repetitive posting, or deceptive/misleading content;</li>
        <li>Malicious, phishing, or harmful links.</li>
      </ul>

      <h2>6. Personal promotion and spam</h2>
      <p>
        Personal promotion is welcome: you may promote yourself and add a personal link.
        However, <strong>spam, repetition or abuse are not allowed</strong> and will lead to
        removal of the page(s) <strong>without a refund</strong>.
      </p>

      <h2>7. Impersonation</h2>
      <p>
        Signing in the name of another person and/or adding a link belonging to someone else is
        strictly forbidden. It may lead to removal of the page, a ban, legal action and damages,
        with <strong>no refund</strong>.
      </p>

      <h2>8. Illegal activity</h2>
      <p>
        Promoting illegal activities may lead to a ban from the Site and removal of the page,
        with <strong>no refund possible</strong>.
      </p>

      <h2>9. Moderation</h2>
      <p>
        Arber Kadriu may, at his sole discretion, remove or edit any page that violates these
        Terms, and may ban users who repeatedly or seriously break the rules.
      </p>

      <h2>10. Refunds</h2>
      <p>
        You may request a refund for a page by email at
        {' '}
        <a href="mailto:myonedollarquote@gmail.com">myonedollarquote@gmail.com</a>{' '}
        within <strong>15 days</strong> of your purchase. After 15 days, no refund will be granted.
        No refund is given for pages removed because they broke these Terms.
      </p>

      <h2>11. External links</h2>
      <p>
        Pages may contain links to external websites. Arber Kadriu is not responsible for the
        content, accuracy or practices of those external sites.
      </p>

      <h2>12. Availability and liability</h2>
      <p>
        The Site is provided “as is”, without warranty of uninterrupted availability. To the extent
        permitted by law, Arber Kadriu is not liable for indirect or incidental damages arising from
        the use of the Site.
      </p>

      <h2>13. Changes</h2>
      <p>
        These Terms may be updated at any time. Continuing to use the Site after changes means you
        accept the updated Terms.
      </p>

      <h2>14. Governing law &amp; contact</h2>
      <p>
        These Terms are governed by French law. For any question, contact{' '}
        <a href="mailto:myonedollarquote@gmail.com">myonedollarquote@gmail.com</a>.
      </p>

      <a className="back" href="/">← Back to the book</a>
    </div>
  );
}
