import mongoose from 'mongoose'
import config from '../config'

const { MONGO_URI } = config

const connect = () => {
  mongoose
    .connect(MONGO_URI)
    .then(() => {
      console.log("Successfully connected to db");
    })
    .catch((error) => {
      console.log("DB connection failed");
      console.error(error);
    });
};

export default { connect }