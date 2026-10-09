/**
 * Tailwind CSS Configuration — PodcastCraft AI
 * Compatible con Tailwind Play CDN v3.4.17
 */
tailwind.config = {
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Acento exclusivo de Inteligencia Artificial (violeta / fucsia)
        ai: {
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace']
      },
      boxShadow: {
        // Valor único y consistente de resplandor para elementos IA
        'glow-ai': '0 0 16px 2px rgba(168, 85, 247, 0.25)'
      }
    }
  }
};
