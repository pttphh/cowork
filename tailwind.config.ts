import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#185FA5',
        'primary-light': '#E6F1FB',
        success: '#085041',
        'success-light': '#E1F5EE',
        warning: '#633806',
        'warning-light': '#FAEEDA',
        danger: '#A32D2D',
        'danger-light': '#FCEBEB',
        'sidebar-bg': '#F5F4F0',
      },
    },
  },
  plugins: [],
} satisfies Config
