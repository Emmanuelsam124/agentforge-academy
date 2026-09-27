import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    // Deliberately a fixed dark color rather than bg-ink — this footer was
    // already designed as a permanent dark band even in the light theme, and
    // --color-ink itself flips to near-white under dark mode (it's a text
    // color there), so reusing it as a background here would invert broken.
    <footer className="mt-auto bg-[#1A1333] text-white px-4 sm:px-6 lg:px-8 pt-11 pb-7">
      <div className="max-w-6xl mx-auto flex flex-wrap justify-between gap-8">
        <div className="max-w-xs">
          <Link to="/" className="flex items-center gap-2.5 mb-3">
            <img src="/logo-icon.webp" alt="" className="w-[34px] h-[34px] object-contain rounded-lg bg-white p-0.5" />
            <span className="font-display font-extrabold text-[15px]">Social Dev Technologies</span>
          </Link>
          <p className="text-sm text-[#B8B0D8] leading-relaxed">
            Learn AI by building real agents — hands-on sessions, real prompts, a portfolio that gets you hired.
          </p>
        </div>

        <div className="flex gap-12 sm:gap-16 flex-wrap">
          <FooterCol
            title="Platform"
            links={[
              { label: 'AI Agent Mastery', to: '/ai-agent-mastery' },
              { label: 'Become an AI Builder', to: '/ai-builder' },
              { label: 'Vibe Coding Bootcamp', to: '/vibe-coding' },
              { label: 'Catalog', to: '/catalog' },
              { label: 'Agent Guides', to: '/guides' },
              { label: 'Learning Paths', to: '/paths' },
              { label: 'Pricing', to: '/pricing' },
              { label: 'Home', to: '/' },
            ]}
          />
          <FooterCol
            title="Company"
            links={[
              { label: 'About', to: '/about' },
              { label: 'FAQ', to: '/faq' },
              { label: 'Terms of Service', to: '/legal/terms' },
              { label: 'Privacy Policy', to: '/legal/privacy' },
            ]}
          />
          <div>
            <div className="font-bold text-[13px] text-white mb-3">Connect</div>
            <div className="flex flex-col gap-2.5 text-[13.5px] text-[#B8B0D8]">
              <a href="https://www.linkedin.com/company/social-dev-technologies/" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">LinkedIn</a>
              <a href="https://www.facebook.com/SocialDevTech/" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Facebook</a>
              <a href="https://wa.me/2349066006963" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">WhatsApp</a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto border-t border-white/10 mt-7 pt-4 text-[12.5px] text-[#8A82AD]">
        © <span>{new Date().getFullYear()}</span> Social Dev Technologies. All rights reserved.
      </div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <div className="font-bold text-[13px] text-white mb-3">{title}</div>
      <ul className="flex flex-col gap-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <Link to={link.to} className="text-[13.5px] text-[#B8B0D8] hover:text-white transition-colors">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
