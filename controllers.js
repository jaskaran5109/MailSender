const axios = require("axios"); // Importing the Axios library for making HTTP requests
const { generateConfig } = require("./utils"); // Importing a function from a local file
const nodemailer = require("nodemailer"); // Importing the Nodemailer library for sending emails
const { google } = require("googleapis"); // Importing the Google APIs library

require("dotenv").config(); // Loading environment variables from a .env file

const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
); // Creating an OAuth2 client object for authentication

oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN }); 
// Setting the OAuth2 credentials using the refresh token

async function sendMail(req, res) {
  try {
    const accessToken = await oAuth2Client.getAccessToken(); // Obtaining an access token
    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SENDER_EMAIL, // Sender's email address
        pass: process.env.APP_PASSWORD, // App password for authentication
      },
      tls: {
        rejectUnauthorized: false,
      },
    }); // Creating a Nodemailer transport object for sending emails

    const mailOptions = {
      from: "Jaskaran <js1462@srmist.edu.in>", // Sender's name and email address
      to: "singhjaskaran2810@gmail.com", // Recipient's email address
      subject: "Gmail API NodeJS", // Email subject
      text: "Hello Jaskaran here", // Email body
    }; // Configuring the email options

    const result = await transport.sendMail(mailOptions); // Sending the email
    res.send(result); // Sending the response
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}

async function getUser(req, res) {
  try {
    const url = `https://gmail.googleapis.com/gmail/v1/users/${req.params.email}/profile`;
    const { token } = await oAuth2Client.getAccessToken(); // Obtaining an access token
    const config = generateConfig(url, token); // Generating the request configuration
    const response = await axios(config); // Making the API request using Axios
    res.json(response.data); // Sending the response
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}

async function getDrafts(req, res) {
  try {
    const url = `https://gmail.googleapis.com/gmail/v1/users/${req.params.email}/drafts`;
    const { token } = await oAuth2Client.getAccessToken(); // Obtaining an access token
    const config = generateConfig(url, token); // Generating the request configuration
    const response = await axios(config); // Making the API request using Axios
    res.json(response.data); // Sending the response
  } catch (error) {
    console.log(error);
    return error;
  }
}
async function readMail(req, res) {
  try {
    const url = `https://gmail.googleapis.com/gmail/v1/users/js1462@srmist.edu.in/messages/${req.params.messageId}`;
    const { token } = await oAuth2Client.getAccessToken(); // Obtaining an access token
    const config = generateConfig(url, token); // Generating the request configuration
    const response = await axios(config); // Making the API request using Axios

    let data = await response.data;

    res.json(data); // Sending the response
  } catch (error) {
    res.send(error); // Sending the error response
  }
}

async function fetchEmailsWithoutReplies(req, res) {
  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

  const response = await gmail.users.messages.list({
    userId: "me",
    q: "is:unread -{from:js1462@srmist.edu.in}",
  }); // Fetching unread emails without replies

  const emails = response.data.messages;
  return emails; // Returning all the emails
}

async function processEmails(req, res) {
  const emails = await fetchEmailsWithoutReplies(); // Fetching unread emails without replies
  const responses = [];
  const userEmails = [];

  for (const email of emails) {
    const response = await sendReply(email.threadId); // Sending a reply for each email
    responses.push(response);

    const data = await axios.get(
      `http://localhost:8000/api/mail/read/${email.threadId}`
    ); // Reading the email

    const emailString = data.data.payload.headers.find(
      (header) => header.name === "From"
    )?.value;

    const emailRegex = /<([^>]+)>/;
    const match = emailString !== undefined && emailString.match(emailRegex);

    if (match && match.length > 1) {
      const email = match[1];
      const regex = /^(?!no-reply|noreply).*$(?<!joinsuperset\.com|srmist\.edu\.in)/i;
      if (regex.test(email)) {
        userEmails.push(email); // Storing the user email addresses without "no-reply" or "noreply"
      }
    }
  }

  res.json({ emails: userEmails, responses: responses }); // Sending the response
}

async function sendReply(emailID) {
  const data = await axios.get(
    `http://localhost:8000/api/mail/read/${emailID}`
  ); // Reading the email

  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
  const emailString = data.data.payload.headers.find(
    (header) => header.name === "From"
  )?.value;

  const emailRegex = /<([^>]+)>/;
  const match = emailString !== undefined && emailString.match(emailRegex);

  if (match && match.length > 1) {
    const email = match[1];
    const regex = /^(?!no-reply|noreply).*$(?<!joinsuperset\.com|srmist\.edu\.in)/i;
    if (regex.test(email)) {
      const replyMessage = createReplyMessage(email); // Creating the reply message

      const response = await gmail.users.messages.send({
        userId: "me",
        requestBody: replyMessage,
      }); // Sending the reply email
      if (response.data !== null) {
        modifyLabel(emailID, "Label_1908833631737983333");
      }
      return "Reply sent:", response.data;
    }
  } else {
    console.log("No email found.");
  }
}
async function modifyLabel(emailId, labelId) {
  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

  // Construct the request body
  const requestBody = {
    addLabelIds: [labelId],
  };

  try {
    await gmail.users.messages.modify({
      userId: "me",
      id: emailId,
      requestBody: requestBody,
    });
  } catch (error) {
    console.error("Error adding label to email:", error);
  }
}
function createReplyMessage(email) {
  const reply = {
    raw: Buffer.from(
      `To: ${email}\n` +
        "Subject: Re: Testing Nodejs Gmail Api for Listed" +
        "\n\n" +
        "This is a test email to ensure the functionality of the email system. Please ignore this message. Thank you."
    ).toString("base64"),
  };

  return reply; // Returning the reply message object
}

async function fetchEmailsWithNoReplies(req, res) {
  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

  const response = await gmail.users.messages.list({
    userId: "me",
    q: "is:unread -{from:js1462@srmist.edu.in}",
  }); // Fetching unread emails without replies

  const emails = response.data.messages;
  res.json(emails); // Sending the response
}
async function getLabelId(labelName) {
  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

  try {
    const response = await gmail.users.labels.list({
      userId: "me",
    });

    const labels = response.data.labels;

    // Find the label with the specified name
    const targetLabel = labels.find((label) => label.name === labelName);

    if (targetLabel) {
      const labelId = targetLabel.id;
      console.log(`Label ID for "${labelName}": ${labelId}`);
      return labelId;
    } else {
      console.log(`Label "${labelName}" not found.`);
    }
  } catch (error) {
    console.error("Error retrieving labels:", error);
  }
}
module.exports = {
  getUser,
  sendMail,
  getDrafts,
  readMail,
  fetchEmailsWithNoReplies,
  processEmails,
};
