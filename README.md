<div id="readme-top" align="center">

  <h1>Fintter</h1>

  <img src="./assets/images/splash_icon.png" alt="HabitVault Logo" width="200" style="border-radius: 10%; margin-bottom: 20px;" />
  
  <p>A beautifully designed, local-first personal finance tracker with gamification, smart SMS scanning, and rich analytics.</p>

</div>

<p align="center">Fintter is a fast, offline-first personal finance application that helps you track your expenses, manage multiple wallets, maintain budgets, and understand your spending habits. It includes unique features like gamification (streaks and milestones), mood vs. spending correlations, and impulse purchase tracking—all wrapped in a stunning AMOLED-friendly dark theme. The entire app was vibecoded in Antigravity IDE.</p>

<br />

<!-- Table of Contents -->
# :notebook_with_decorative_cover: Table of Contents <!-- omit in toc -->

- [:star2: About the Project](#star2-about-the-project)
  - [:camera: Screenshots](#camera-screenshots)
  - [🛠️ Tech Stack](#️-tech-stack)
  - [:dart: Features](#dart-features)
- [:toolbox: Getting Started](#toolbox-getting-started)
  - [:bangbang: Prerequisites](#bangbang-prerequisites)
  - [:gear: Installation](#gear-installation)
  - [:running: Run Locally](#running-run-locally)
- [:eyes: Usage](#eyes-usage)
- [:compass: Roadmap](#compass-roadmap)
- [:wave: Contributing](#wave-contributing)
- [:grey_question: FAQ](#grey_question-faq)
- [:warning: License](#warning-license)
- [:handshake: Contact](#handshake-contact)
- [:gem: Acknowledgements](#gem-acknowledgements)

<!-- About the Project -->
## :star2: About the Project

Managing personal finances shouldn't be boring or overly complex. Fintter brings a fresh, highly responsive, and local-first approach to expense tracking. It's built specifically to understand the psychology of spending by tracking moods and impulse purchases, while keeping you motivated through a gamified streak and milestone system.

### :camera: Screenshots

<div align="center" style="margin-bottom: 80px;">
  <div style="margin-bottom: 40px;">
    <h3>Home & Dashboard</h3>
    <p>
      <img src="./screenshots/home_page.jpeg" alt="Home page screenshot" width="45%" style="margin-right: 5%;" />
      <img src="./screenshots/category_wise_spending.jpeg" alt="Habits page screenshot" width="45%" />
    </p>
  </div>
</div>

> 📁 Screenshots will be available in the [screenshots folder](./screenshots)

### 🛠️ Tech Stack

| Platform       | Technologies Used                                |
|----------------|--------------------------------------------------|
| Framework      | Expo / React Native                              |
| Language       | TypeScript                                       |
| State Mgmt     | Zustand                                          |
| Database       | SQLite (`expo-sqlite`)                           |
| Local Storage  | `react-native-mmkv`                              |
| Charts         | `react-native-gifted-charts`, `react-native-skia`|
| Animations     | `react-native-reanimated` & `expo-haptics`       |

### :dart: Features

- **Dashboard & Wallets**: Manage multiple wallets seamlessly with global filtering and beautiful balance cards.
- **Advanced Analytics**: Interactive pie charts, spending trend line charts, spending heatmaps (42-day grids), top merchants tracking, and deep insights into how your mood correlates with your spending.
- **Budgeting**: Create budgets per category and track your progress with visually striking circular arcs and progress bars.
- **History Timeline**: A rich, scrollable timeline grouped by day that lets you pinpoint exactly when and where you spent money.
- **Gamification**: Build financial discipline with daily streaks, earn milestones, and celebrate your savings with confetti animations.
- **Smart SMS / Notification Scanning**: Automatic transaction detection based on incoming push notifications and SMS regex matching (requires user validation).
- **Security & Backup**: Encrypted JSON backups, restoring via local device, and Biometric / App Password locks.
- **Offline First**: Your financial data never leaves your device thanks to the robust local SQLite database integration.

<!-- Getting Started -->
## 	:toolbox: Getting Started

### :bangbang: Prerequisites

- Node.js (v18 or higher recommended)
- Expo CLI
- Git

### :gear: Installation

Clone the repository to your local machine:

```bash
git clone https://github.com/Adhik-6/Fintter.git
cd Fintter
```

Install dependencies:

```bash
npm install
# or
yarn install
```
   
### :running: Run Locally

Start the Expo development server:

```bash
npx expo start
```

You can then run the app on an Android/iOS emulator, or scan the QR code using the Expo Go app on your physical device.

<!-- Usage -->
## :eyes: Usage

- **Adding an Expense**: Tap the floating `+` button on the dashboard to quickly add a transaction.
- **Reviewing Budgets**: Navigate to the Budgets tab to see how close you are to your limits. Tap any budget to view all related expenses.
- **Analyzing Habits**: Visit the Analytics tab to explore your spending velocity, trend lines, heatmap blocks, category breakdowns, and how your mood affects your wallet.
- **Backing Up**: Visit Settings to securely encrypt and export your data as a JSON payload, or to completely wipe your data with an app password.

<!-- ROADMAP -->
## :compass: Roadmap

- [x] Integrate immersive visual Analytics Charts (Gifted Charts)
- [x] Spending Heatmap generation
- [x] Settings layout and Clear Data functions
- [ ] Smart SMS / Notification parser
- [ ] Encrypted backup/restore functionalities
- [x] App password lock
- [ ] Biometric locks
- [ ] Multi-currency support

<!-- CONTRIBUTING -->
## :wave: Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<!-- FAQ -->
## :grey_question: FAQ

<details>
  <summary>Where is my data stored?</summary>

  All your data is stored locally on your device using an SQLite database. We do not transmit your financial data to any external servers.

</details>

<details>
  <summary>Can I track different currencies?</summary>

  Currently, Fintter is designed around a single base currency format. Multi-currency support is planned for a future release!

</details>

<!-- License -->
## :warning: License

Distributed under the MIT License. See `LICENSE` for more information.

<!-- Contact -->
## :handshake: Contact

Adhik - [GitHub Profile](https://github.com/Adhik-6)

Project Link: [https://github.com/Adhik-6/Fintter](https://github.com/Adhik-6/Fintter)

<!-- Acknowledgments -->
## :gem: Acknowledgements

 - [Expo](https://expo.dev/)
 - [Zustand](https://github.com/pmndrs/zustand)
 - [React Native Gifted Charts](https://gifted-charts.web.app/)
 - [React Native Skia](https://shopify.github.io/react-native-skia/)
 - [Best-README-Template](https://github.com/othneildrew/Best-README-Template)

<p align="right">(<a href="#readme-top">back to top</a>)</p>