# FreeManager

<p align="center">
  <img src="https://img.shields.io/badge/React-18.x-blue?style=flat-square&logo=react" alt="React">
  <img src="https://img.shields.io/badge/Firebase-9.x-orange?style=flat-square&logo=firebase" alt="Firebase">
  <img src="https://img.shields.io/badge/TailwindCSS-3.x-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License">
</p>

A free and open-source Trello alternative built for seamless project management and collaboration. FreeManager provides a real-time, multi-user experience with intuitive drag-and-drop functionality, allowing teams to organize tasks and workflows effortlessly.

## ✨ Features

- **🚀 Real-time Collaboration**: All changes are instantly synchronized across users
- **🎯 Drag-and-Drop Interface**: Easily reorder lists and cards with fluid, intuitive interactions
- **💾 Persistent Storage**: Secure data storage with Firebase Firestore
- **🔐 Simple Authentication**: Quick anonymous sign-in without lengthy setup
- **📱 Responsive Design**: Clean, modern UI that works perfectly on any device
- **⚡ Fast Performance**: Built with React and optimized for speed

## 🛠️ Technologies Used

| Category | Technology |
|----------|------------|
| **Frontend** | React 18+ |
| **Styling** | Tailwind CSS |
| **State Management** | React Hooks (useState, useEffect) |
| **Drag & Drop** | @dnd-kit/core |
| **Backend & Database** | Firebase Firestore |
| **Build Tool** | Create React App |

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (version 16.0 or higher)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/harroldmussa/freemanager.git
   ```

2. **Navigate to the project directory**
   ```bash
   cd freemanager
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Configure Firebase**
   - Create a new Firebase project in the [Firebase Console](https://console.firebase.google.com/)
   - Set up a Firestore database in production mode
   - Navigate to Project Settings → General → Your apps
   - Add a web app to your project
   - Copy the Firebase configuration object
   - Create a `.env` file in the root directory (use `.env.example` as a template)
   - Add your Firebase configuration:
     ```env
     REACT_APP_FIREBASE_API_KEY=your_api_key
     REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
     REACT_APP_FIREBASE_PROJECT_ID=your_project_id
     REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
     REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
     REACT_APP_FIREBASE_APP_ID=your_app_id
     ```

5. **Start the development server**
   ```bash
   npm start
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application running.

## 📖 Usage

1. **Create Boards**: Start by creating a new board for your project
2. **Add Lists**: Organize your workflow with custom lists (e.g., "To Do", "In Progress", "Done")
3. **Create Cards**: Add tasks as cards within your lists
4. **Drag & Drop**: Easily move cards between lists or reorder them within lists
5. **Real-time Updates**: Watch as changes sync instantly across all connected users

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### How to Contribute

1. **Fork the Project**
2. **Create your Feature Branch**
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Commit your Changes**
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. **Push to the Branch**
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style and conventions
- Write clear, descriptive commit messages
- Test your changes thoroughly before submitting
- Update documentation as needed

## 📝 Available Scripts

In the project directory, you can run:

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - **Note: this is a one-way operation**

## 🐛 Issues and Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/harroldmussa/freemanager/issues) page
2. Create a new issue if your problem isn't already reported
3. Provide as much detail as possible, including steps to reproduce

## 🗺️ Roadmap

- [ ] User accounts and profiles
- [ ] Board sharing and permissions
- [ ] Card due dates and labels
- [ ] File attachments
- [ ] Team management features
- [ ] Mobile app

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Thanks to all contributors who have helped shape this project
- Built with amazing open-source technologies

## 📞 Contact

**Project Maintainer**: [harroldmussa](https://github.com/harroldmussa)

**Project Link**: [https://github.com/harroldmussa/freemanager](https://github.com/harroldmussa/freemanager)
