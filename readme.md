# Secure Share
This self-hosted application is built for a team to selectively share sensetive secrets like keys or environment variables using an end-to-end encrypted pipeline via an RSA key pair.

### Highlights
- Self hosted with complete control over the DB.
- Upload various types of files or plain text, encrypted with your public key.
- Use your private key to decrypt the information on client side. Your key is never sent to the server.
- Invite other users to join your team and access shared information securely.

### Get Started

1. Create a PostgreSQL DB locally or on remote and run the included initialization script (`db-init.sql`). Script contains default admin credentials.
2. Create an ENV file with relevant values. See `sample.env` for reference.
3. An RSA key pair (PEM format, 2048-bit) is required to be specified in ENV. This is used by the app to securely transfer information from client to server side.
    1. You can use any online key generator or run the app without this ENV variable and generate key from the my-key page, to create a new pair.
    2. Remove all line breaks in private key to make it a single line.
    3. Replace all line breaks in public key with \n to make it a single line. See `sample.env`.
    4. **This key should be different from the per-user key.**
4. On login, you will need to first supply the public key of your RSA key pair (PEM format, 2048-bit). You also get an option to generate a key pair in the UI, if you don't have one.
5. Once uploaded, these keys cannot be changed. **Please ensure the keys are stored safely with you.**
6. Once keys are configured, users can add their secrets.
7. Only admins can add other users and share secrets with them. Sharing requires regular users to have a valid public key configured.
8. Regular users can only view secrets they have uploaded or admin has shared. They cannot share their secrets.

### About the Code
- The application is built and tested using Wappler 6.8.0 with AC 2.0.16 framework and Bootstrap 5.3.3 for UI.
- Its a responsive Single Page Application (SPA), with various security measures.
- All data is end-to-end encrypted.
- It uses various custom modules as below:
1. **Cryptography**: Contains modules for encryption and decryption of information.
2. **Generate Key**: Used to generate an RSA key pair.
3. **Logger**: Capture logs at various steps in a SA flow and bulk insert them in the DB.
4. **Theme Changer**: Switch between light/dark/auto modes. Credits: [Ben Pleysier](https://www.npmjs.com/package/@benpley/wappler-theme-changer).
- It uses one custom formatter as well:
1. **Obfuscate JSON**: Used to replace sensitive data sent to logger with `xxxxxx`.
- Email templates and SMTP mailer have been configured to send email when a new account is added, to reset passwords, and when a new item is shared.
- Known limitation: Some PDF files do not render in the UI.