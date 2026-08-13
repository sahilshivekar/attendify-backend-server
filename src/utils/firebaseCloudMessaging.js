import {
    initializeApp,
    cert,
    getApps
} from 'firebase-admin/app';
import {
    getMessaging
} from 'firebase-admin/messaging';
import fs from 'fs';
import StudentFCMToken from '../db/models/studentFCMToken.model.js';

const serviceAccount = JSON.parse(
    fs.readFileSync(
        new URL('../config/presencify-FCM-sdk-private-key.json', import.meta.url)
    )
);

const getApp = () => {
    if (!getApps().length) {
        initializeApp({
            credential: cert(serviceAccount)
        });
    }
};

const sendNotification = async (fcmToken, title, body, data) => {
    getApp();
    const message = {
        notification: {
            title,
            body
        },
        data: data,
        token: fcmToken
    };
    console.log(message);
    try {
        const response = await getMessaging().send(message);
        console.log('Notification sent:', response);
    } catch (error) {

        if (error.errorInfo && error.errorInfo.code === 'messaging/invalid-argument') {
            await StudentFCMToken.destroy({
                where: {
                    fcmToken: fcmToken
                }
            });
            console.log('Token not registered (hence removed from db):', error.errorInfo.code);
        }
        console.error('Error sending notification:', error);
    }
};

export {
    sendNotification
};
