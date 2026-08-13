import {
    Sequelize
} from "sequelize";
import config from "./db.config.js";

const env = process.env.NODE_ENV;

const sequelize = new Sequelize(config[env]);

export default sequelize;
