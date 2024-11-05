const forge = require('node-forge');
const vm = require('vm');

exports.decryptData = async function (options) {
    options = this.parse(options);

    const decryptScript = `
        (function() {
            try {
                // Decode encrypted Data
                const encryptedData = forge.util.decode64(options.encryptedData);

                // Replace newline characters in the PEM formatted private key
                const formattedPrivateKey = options.privateKeyPEM.replace(/\\n/g, '\\n');

                // Convert the PEM formatted private key to a Forge private key object
                const privateKey = forge.pki.privateKeyFromPem(formattedPrivateKey);

                // Decode the encrypted AES key
                const encryptedKey = forge.util.decode64(options.encryptedKey);

                // Decrypt the AES key using the RSA private key
                const decryptedAESKey = privateKey.decrypt(encryptedKey);

                // Create decipher with the decrypted AES key
                const decipher = forge.cipher.createDecipher('AES-CFB', forge.util.hexToBytes(decryptedAESKey));
                decipher.start({ iv: forge.util.hexToBytes(options.secretIV) });
                decipher.update(forge.util.createBuffer(encryptedData));
                const result = decipher.finish();
                if (!result) {
                    throw new Error('Decryption failed');
                }

                const decryptedData = decipher.output.getBytes();
                // const decryptedBase64Data = forge.util.encode64(decryptedData);
                return { decryptedData };
            } catch (error) {
                return { error: error.message };
            }
        })()
    `;

    // Create a sandbox context with necessary variables and modules
    let sandbox = { options, forge, console: console };

    // Create the VM script
    const script = new vm.Script(decryptScript);

    // Create context and run the script in the sandboxed context
    const context = vm.createContext(sandbox);

    try {
        const result = await script.runInContext(context);
        return result;
    } catch (e) {
        console.error('Failed to execute script.', e);
        return { error: e.message };
    }
};

exports.encryptData = async function (options) {
    options = this.parse(options);

    const encryptScript = `
        (function() {
            try {
                function encryptKeys(plainData, pubKey) {
                    // Convert PEM keys to Forge key objects
                    const publicKey = forge.pki.publicKeyFromPem(pubKey);

                    // Encrypt and encode using the public key
                    const plaintextBytes = forge.util.encodeUtf8(plainData);
                    const encryptedBytes = publicKey.encrypt(plaintextBytes);
                    const encryptedKey = forge.util.encode64(encryptedBytes);

                    return encryptedKey;
                }

                const secret_iv = forge.random.getBytesSync(16);
                const secret_iv_hex = forge.util.bytesToHex(secret_iv);
                const secret_key = forge.random.getBytesSync(16);
                const secret_key_hex = forge.util.bytesToHex(secret_key);
                // Encrypt AES key
                const encryptedKey = encryptKeys(secret_key_hex, options.pubKey);

                const cipher = forge.cipher.createCipher('AES-CFB', forge.util.hexToBytes(secret_key_hex));
                cipher.start({ iv: forge.util.hexToBytes(secret_iv_hex) });
                cipher.update(forge.util.createBuffer(options.plainText));
                const result = cipher.finish();
                if (!result) {
                    throw new Error('Encryption failed');
                }
                // Encode encrypted data
                const encryptedData = forge.util.encode64(cipher.output.getBytes());

                return { encryptedData, secretIV: secret_iv_hex, secretKey: secret_key_hex, encryptedKey };
            } catch (error) {
                return { error: error.message };
            }
        })()
    `;

    // Create a sandbox context with necessary variables and modules
    let sandbox = { options, forge, console: console };

    // Create the VM script
    const script = new vm.Script(encryptScript);

    // Create context and run the script in the sandboxed context
    const context = vm.createContext(sandbox);

    try {
        const result = await script.runInContext(context);
        if (result.error) {
            throw new Error(result.error);
        }
        return result;
    } catch (e) {
        // console.error('Failed to execute script.', e);
        return { error: e.message };
    }
};
