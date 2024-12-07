# SplitBuddy

SplitBuddy is a modern, user-friendly expense management application designed to make sharing expenses with friends, roommates, and groups effortless and stress-free.

![SplitBuddy Logo](frontend/public/logo192.png)

## 🌟 Features

### 👥 Group Management
- Create and manage multiple expense groups
- Invite friends via email
- Real-time balance tracking for each group member
- Categorize groups (Trip, Home, Office, etc.)

### 💰 Expense Tracking
- Add expenses with detailed descriptions
- Multiple split options:
  - Equal split
  - Percentage split
  - Custom amount split
- Support for recurring expenses
- Attach receipts and notes

### 💳 Payment Management
- Record payments between users
- Multiple payment methods support
- Payment history tracking
- Settlement suggestions for optimal debt resolution

### 📊 Smart Dashboard
- Overview of total balances
- Recent activity feed
- Group-wise expense breakdown
- Visual expense analytics

### 🔔 Activity Tracking
- Real-time notifications
- Detailed activity history
- Email notifications for important updates

### 👤 User Profile
- Customizable user profiles
- Profile picture support
- Email preferences management
- Account settings

## 🚀 Technology Stack

### Frontend
- React.js with Material-UI
- Redux for state management
- React Router for navigation
- Axios for API communication
- Modern ES6+ JavaScript

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- JWT authentication
- RESTful API architecture

### DevOps & Tools
- Git for version control
- npm for package management
- ESLint for code quality
- Jest for testing

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/splitbuddy.git
   cd splitbuddy
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Setup**
   ```bash
   # In backend directory, create .env file
   PORT=5000
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   ```

4. **Start the application**
   ```bash
   # Start backend server (from backend directory)
   npm start

   # Start frontend development server (from frontend directory)
   npm start
   ```

## 📱 Usage

1. **Registration & Login**
   - Create an account using email
   - Verify email address
   - Log in to access features

2. **Creating Groups**
   - Click "Create Group" button
   - Add group name and category
   - Invite members via email

3. **Adding Expenses**
   - Select a group
   - Click "Add Expense"
   - Enter amount and split details
   - Save and notify members

4. **Making Payments**
   - View balances in dashboard
   - Click "Settle Up"
   - Record payment details
   - Confirm settlement

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Thanks to all contributors who have helped shape SplitBuddy
- Special thanks to the open-source community for the amazing tools and libraries
- Icons and graphics from [Material-UI](https://mui.com/)

## 📞 Contact

For support or queries, please contact us at:
- Email: support@splitbuddy.com
- Twitter: [@splitbuddy](https://twitter.com/splitbuddy)
- Website: [www.splitbuddy.com](https://www.splitbuddy.com)

---

Made with ❤️ by the SplitBuddy Team
