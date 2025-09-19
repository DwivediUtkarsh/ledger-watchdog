# Ledger Watchdog

A crowdsourced blockchain transaction monitoring and analysis platform that enables analysts to flag suspicious transactions and earn rewards through gamified participation.

## 🚀 Features

- **Transaction Monitoring**: Real-time blockchain transaction analysis with risk assessment
- **Crowdsourced Analysis**: Community-driven transaction flagging and verification
- **Gamification System**: Points, levels, tiers, and leaderboards to incentivize participation
- **Advanced Filtering**: Filter transactions by risk level, amount, labels, and time periods
- **Analyst Profiles**: Comprehensive user profiles with trust scores and achievement tracking
- **Dark Theme**: Professional dark UI optimized for extended analysis sessions
- **Responsive Design**: Works seamlessly across desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Framework**: Tailwind CSS
- **Component Library**: shadcn/ui with Radix UI primitives
- **Icons**: Lucide React
- **Charts**: Recharts
- **State Management**: React hooks and context
- **Routing**: React Router DOM
- **Form Handling**: React Hook Form with Zod validation

## 📦 Installation

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ledger-watchdog
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

## 🏗️ Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run build:dev` - Build for development environment
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality checks

## 🎮 How It Works

### For Analysts

1. **Sign Up**: Create an analyst account and get verified for higher rewards
2. **Analyze Transactions**: Browse the transaction feed and identify suspicious activity
3. **Flag Transactions**: Submit detailed reports with evidence and categorization
4. **Earn Rewards**: Gain points, level up, and climb the leaderboard
5. **Build Reputation**: Increase your trust score through accurate flagging

### Gamification System

- **Points**: Earned for successful transaction flags and community contributions
- **Levels**: Progress through analyst levels (1-50+) with increasing benefits
- **Tiers**: Bronze → Silver → Gold → Platinum with exclusive perks
- **Trust Score**: Accuracy-based reputation system (0-100%)
- **Leaderboards**: Weekly and all-time rankings

## 🔧 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── layout/         # Header, navigation components
│   ├── transactions/   # Transaction-related components
│   ├── user/          # User profile and stats components
│   └── ui/            # Base UI components (shadcn/ui)
├── hooks/             # Custom React hooks
├── lib/               # Utilities and mock data
├── pages/             # Page components
├── types/             # TypeScript type definitions
└── main.tsx          # Application entry point
```

## 🎨 Design System

The application uses a custom dark theme optimized for security analysts:

- **Colors**: Professional dark palette with accent colors for risk levels
- **Typography**: Inter font family for readability
- **Components**: Consistent design language with glassmorphism effects
- **Responsive**: Mobile-first approach with Tailwind CSS breakpoints

## 🔒 Security Features

- **Risk Assessment**: Automated risk scoring for transactions
- **Verification System**: Multi-level analyst verification
- **Trust Scoring**: Reputation-based accuracy tracking
- **Audit Trail**: Complete history of all flagging activities

## 🚀 Deployment

### Production Build

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=your_api_endpoint
VITE_BLOCKCHAIN_RPC=your_blockchain_rpc_url
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation wiki

## 🔮 Roadmap

- [ ] Real blockchain integration (Solana, Ethereum)
- [ ] Advanced ML-based risk detection
- [ ] Mobile application
- [ ] API for third-party integrations
- [ ] Multi-language support
- [ ] Advanced analytics dashboard

---

Built with ❤️ for the blockchain security community