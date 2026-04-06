require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const app = require('./src/app');
const connectDB = require('./src/config/database');
const { startCronJob } = require('./src/services/autoEntryService');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
      // Start the daily cron job after DB connection
      startCronJob();
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
