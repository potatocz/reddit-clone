/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

//import {onRequest} from "firebase-functions/v2/https";
//import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

admin.initializeApp();
const db = admin.firestore();

export const createUserDocument = functions.auth
    .user()
    .onCreate(async (user) => {

        const newUser = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            providerData: user.providerData
        };

        db.collection("users")
            .doc(user.uid)
            //.set(JSON.parse(JSON.stringify(user)));
            .set(newUser);
    });