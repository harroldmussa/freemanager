FreeManager

A free and open-source Trello clone built for seamless project management and collaboration. This application provides a real-time, multi-user experience with intuitive drag-and-drop functionality, allowing teams to organize tasks and workflows effortlessly.

Key Features
Real-time Collaboration: All changes are instantly synchronized across users.

Drag-and-Drop Interface: Easily reorder lists and cards with a fluid, intuitive user experience.

Persistent Storage: All data is securely stored in a Firebase Firestore database.

User Authentication: Simple anonymous sign-in for quick access without a lengthy setup.

Responsive Design: A clean, modern UI built with Tailwind CSS that works great on any device.

Technologies Used
Frontend: React

Styling: Tailwind CSS

State Management: React Hooks (useState, useEffect)

Drag & Drop: @dnd-kit/core

Backend & Database: Firebase Firestore

Getting Started
To get a local copy up and running, follow these simple steps.

Prerequisites
You will need Node.js and npm installed on your machine.

Installation
Clone the repository:

git clone [https://github.com/your-username/open-trello.git](https://github.com/harroldmussa/freemanager.git)

Navigate to the project directory:

cd freemanager

Install NPM packages:

npm install

Configure Firebase:

Create a new Firebase project on the Firebase Console.

Set up a Firestore database.

Go to Project Settings and add a web app to your project.

Copy your Firebase configuration object and add it to your project's .env file (see .env.example).

Start the development server:

npm start

Contributing
We welcome contributions! If you have a bug fix, a new feature, or an idea for an improvement, please feel free to contribute.

Fork the Project.

Create your Feature Branch (git checkout -b feature/AmazingFeature).

Commit your changes (git commit -m 'Add some AmazingFeature').

Push to the Branch (git push origin feature/AmazingFeature).

Open a Pull Request.

License
Distributed under the MIT License. See LICENSE for more information.
