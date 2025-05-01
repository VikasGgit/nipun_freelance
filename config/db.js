const mongoose = require('mongoose');
console.log("mg db", process.env.MONGODB_URI)
const connectDB = async () => {
  try {
    console.log("mg db", process.env.MONGODB_URI)
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error("vikas",err.message, err);
  
  }
};

module.exports = connectDB;