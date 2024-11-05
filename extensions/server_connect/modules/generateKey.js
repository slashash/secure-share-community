const forge = require('node-forge');

exports.generateKey = async function () {
    // Generate a key pair
    const { privateKey, publicKey } = forge.pki.rsa.generateKeyPair(2048);

    // Convert the keys to PEM format
    let privateKeyPem = forge.pki.privateKeyToPem(privateKey);
    let publicKeyPem = forge.pki.publicKeyToPem(publicKey);

    // Return the keys as an object
    return {
        privateKeyPem,
        publicKeyPem
    };
};