// JavaScript Document

$(document).ready(function () {
  if (sessionStorage.getItem('private_key')) {
    dmx.parse("content.varSession.setValue(" + true + ")");
  } else {
    dmx.parse("content.varSession.setValue(" + false + ")");
  }
})

function validateKey() {
  const keyInput = document.getElementById('txtUploadPublicKey').value;
  let isKeyInvalid = true;

  try {
    const rsaPublicKey = forge.pki.publicKeyFromPem(keyInput);

    // Check if the parsed key has necessary RSA components
    if (rsaPublicKey && rsaPublicKey.n && rsaPublicKey.e) {
      isKeyInvalid = false;
    }
  } catch {
    isKeyInvalid = true;
  }

  dmx.parse("content.varIsKeyInvalid.setValue('" + isKeyInvalid + "')");
}

function downloadPublicKey() {
  // Get the content from the textarea
  const textArea = document.getElementById('txtPublicKey');

  // Create a blob with the content
  const blob = new Blob([textArea.value], { type: 'text/plain' });

  // Create a link element
  const link = document.createElement('a');

  // Create a URL for the blob and set it as the href attribute
  link.href = URL.createObjectURL(blob);

  // Set the download attribute with a filename
  link.download = 'secure_share_public_key.pem';

  // Append the link to the body
  document.body.appendChild(link);

  // Programmatically click the link to trigger the download
  link.click();

  // Remove the link from the document
  document.body.removeChild(link);

}

function downloadPrivateKey() {
  // Get the content from the textarea
  const textArea = document.getElementById('txtPrivateKey');

  // Create a blob with the content
  const blob = new Blob([textArea.value], { type: 'text/plain' });

  // Create a link element
  const link = document.createElement('a');

  // Create a URL for the blob and set it as the href attribute
  link.href = URL.createObjectURL(blob);

  // Set the download attribute with a filename
  link.download = 'secure_share_private_key.pem';

  // Append the link to the body
  document.body.appendChild(link);

  // Programmatically click the link to trigger the download
  link.click();

  // Remove the link from the document
  document.body.removeChild(link);

  dmx.parse("content.varDisabledPubKeyButtons.setValue('false')");
}

async function verifyPrivateKey(inputId, encryptedData, encryptedKey, secretIV) {
  try {
    const privateKeyPEM = await readFile(inputId); // Await the result of readFile

    // Decode encrypted Data
    encryptedData = forge.util.decode64(encryptedData);

    // Convert the PEM formatted private key to a Forge private key object
    const privateKey = forge.pki.privateKeyFromPem(privateKeyPEM);

    // Decode the encrypted AES key
    encryptedKey = forge.util.decode64(encryptedKey);

    // Decrypt the AES key using the RSA private key
    const decryptedAESKey = privateKey.decrypt(encryptedKey);

    // Ensure secretIV is in hex format
    if (!/^[0-9a-fA-F]+$/.test(secretIV)) {
      return { success: false, message: 'Invalid IV format. Expected hexadecimal.' };
    }

    // Create decipher with the decrypted AES key
    const decipher = forge.cipher.createDecipher('AES-CFB', forge.util.hexToBytes(decryptedAESKey));
    decipher.start({ iv: forge.util.hexToBytes(secretIV) });
    decipher.update(forge.util.createBuffer(encryptedData));
    const result = decipher.finish();

    if (!result) {
      dmx.parse("content.varInvalidPrivateKey.setValue('true')");
    }

    const decryptedData = decipher.output.getBytes();

    // If decryption is successful, store the private key in sessionStorage and notify success
    sessionStorage.setItem('private_key', privateKeyPEM);
    dmx.parse("content.varInvalidPrivateKey.setValue('false')");
    location.reload();

    return { success: true, data: decryptedData };
  } catch (error) {
    dmx.parse("content.varInvalidPrivateKey.setValue('true')");
  }
}

function encryptSecretKey(secretKey, pubKey) {
  // Convert PEM keys to Forge key objects
  const publicKey = forge.pki.publicKeyFromPem(pubKey);

  // Encrypt and encode using the public key
  const plaintextBytes = forge.util.encodeUtf8(secretKey);
  const encryptedBytes = publicKey.encrypt(plaintextBytes);
  const encryptedKey = forge.util.encode64(encryptedBytes);

  return encryptedKey;
}

async function encryptData(pubKey, lblShareSecretData, lblShareSecretKey, lblShareSecretIV, uint8Data = null) {
  var dataToEncrypt = uint8Data;

  if (uint8Data == null) {
    const fileInput = document.getElementById('fileData');

    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const arrayBuffer = await file.arrayBuffer();
      dataToEncrypt = new Uint8Array(arrayBuffer);
    } else {
      const textInput = document.getElementById('txtData').value;
      if (textInput.trim() !== '') {
        dataToEncrypt = forge.util.encodeUtf8(textInput);
      }
    }
  }

  // Generate AES secret key and secret IV
  var secretIV = forge.random.getBytesSync(16);
  var secretKey = forge.random.getBytesSync(16);

  var cipher = forge.cipher.createCipher('AES-CFB', secretKey);
  cipher.start({ iv: secretIV });
  cipher.update(forge.util.createBuffer(dataToEncrypt));
  cipher.finish();
  const encryptedData = forge.util.encode64(cipher.output.getBytes());

  var secretIVHex = forge.util.bytesToHex(secretIV);
  var secretKeyHex = forge.util.bytesToHex(secretKey);

  // Encrypt AES secret key
  encryptedKey = encryptSecretKey(secretKeyHex, pubKey);

  document.getElementById(lblShareSecretData).value = encryptedData;
  document.getElementById(lblShareSecretKey).value = encryptedKey;
  document.getElementById(lblShareSecretIV).value = secretIVHex;
}

function decryptData(encryptedData, encryptedKey, secretIV, mimeType, purpose) {
  // Ensure secretIV is in hex format
  if (!/^[0-9a-fA-F]+$/.test(secretIV)) {
    return { success: false, message: 'Invalid IV format. Expected hexadecimal.' };
  }

  // Retrieve the RSA private key from sessionStorage
  const privateKeyPEM = sessionStorage.getItem('private_key');
  if (!privateKeyPEM) {
    return { success: false, message: 'Private key not found in sessionStorage' };
  }

  // Convert the PEM formatted private key to a Forge private key object
  const privateKey = forge.pki.privateKeyFromPem(privateKeyPEM);

  // Decode the encrypted AES key
  let decodedEncryptionKey = forge.util.decode64(encryptedKey);
  const decryptedSecretKey = privateKey.decrypt(decodedEncryptionKey);

  // Decode encrypted Data
  var decodedEncryptedData = forge.util.decode64(encryptedData);

  // Create decipher with the decrypted AES key
  var decipher = forge.cipher.createDecipher('AES-CFB', forge.util.hexToBytes(decryptedSecretKey));
  decipher.start({ iv: forge.util.hexToBytes(secretIV) });
  decipher.update(forge.util.createBuffer(decodedEncryptedData));
  const result = decipher.finish();

  if (!result) {
    // Decryption failed
    return { success: false, message: 'Decryption failed' };
  }

  const decryptedData = decipher.output.getBytes();

  let uint8DecryptedData = forge.util.binary.raw.decode(decryptedData);

  //Check purpose of decrypting the secret and return data if required.
  if (purpose == 'share') {
    return { success: true, data: uint8DecryptedData };
  }

  if ((purpose == 'view' || purpose == 'edit') && mimeType.startsWith('text/')) {
    // Handle text data
    dmx.parse("content.varDecryptedData.setValue('" + decryptedData + "')");
    return;
  }
  else {
    // Handle file data
    const binaryData = forge.util.binary.raw.decode(decryptedData);
    const blob = new Blob([binaryData], { type: mimeType });

    //  Render PDF if MIME type is PDF
    if (mimeType === 'application/pdf' && purpose == 'view') {
      renderPdf(binaryData);
      return;
    }
    else {
      // Create a URL for the Blob
      const blobUrl = URL.createObjectURL(blob);
      dmx.parse("content.varFileURL.setValue('" + blobUrl + "')");
      return { success: true, data: blobUrl };
    }
  }
}

function manageSecret(pubkey, isManageSecretByFile = null) {
  dmx.parse("content.varManageSecretFunction.setValue(1)");

  if (isManageSecretByFile) {
    const isValidFile = checkFileType();
    if (!isValidFile) {
      dmx.parse("content.varManageSecretFunction.setValue(0)");
      return;
    }
  }

  encryptData(pubkey, "lblSecretData", "lblSecretKey", "lblSecretIV").then(() => {
    // Simulate form submission directly after encryption and form updates
    dmx.parse("content.modalManageSecret.formManageSecret.submit()");
  })
    .catch(error => {
      dmx.parse("content.varManageSecretFunction.setValue(0)");
      // dmx.parse("content.modalManageSecret.hide()");
      alert('Encryption failed. Please try again later!');

    })
}

async function renderPdf(pdfData) {
  try {
    // Ensure that the embed element exists
    let pdfEmbed = document.getElementById('pdfEmbed');

    // If the embed element does not exist, recreate it
    if (!pdfEmbed) {
      const parentContainer = document.getElementById('crPDf');
      pdfEmbed = document.createElement('embed');
      pdfEmbed.id = 'pdfEmbed';
      pdfEmbed.type = 'application/pdf';
      pdfEmbed.width = '100%';
      pdfEmbed.height = '600px';
      parentContainer.appendChild(pdfEmbed);
    }

    // Remove any existing object URL to avoid memory leaks
    if (pdfEmbed.src) {
      URL.revokeObjectURL(pdfEmbed.src);
    }

    // Create a Blob from the PDF data and set it as the src
    const pdfBlob = new Blob([pdfData], { type: 'application/pdf' });
    const pdfUrl = URL.createObjectURL(pdfBlob);

    pdfEmbed.src = pdfUrl; // Set the Blob URL as the embed src

  } catch (error) {
    console.error(error);

    // Handle error display
    const errorMessage = document.getElementById('txterrorMessage');
    if (errorMessage) {
      const pdfEmbed = document.getElementById('pdfEmbed');
      if (pdfEmbed) pdfEmbed.style.display = 'none';
      errorMessage.style.display = 'block';
    }
  }
}

function shareSecret(encryptedData, encryptedKey, secretIV, mimeType, pubkey) {
  dmx.parse("content.varShareSecretFunction.setValue(1)");

  decryptedData = decryptData(encryptedData, encryptedKey, secretIV, mimeType, 'share');

  if (!decryptedData.success) {
    dmx.parse("content.varShareSecretFunction.setValue(0)");
    alert('Sharing failed. Please try again later!');
    return;
  }

  encryptData(pubkey, "lblShareSecretData", "lblShareSecretKey", "lblShareSecretIV", decryptedData.data).then(() => {
    // Simulate form submission directly after encryption and form updates
    dmx.parse("content.modalShareSecret.formShareMessage.submit()");
  })
    .catch(error => {
      dmx.parse("content.varShareSecretFunction.setValue(0)");
      // dmx.parse("content.modalShareSecret.hide()");
      alert('Sharing failed. Please try again later!');
    })
}

function downloadSecret(encryptedData, fileName, encryptedKey, secretIV, mimeType) {
  const decryptedData = decryptData(encryptedData, encryptedKey, secretIV, mimeType, 'download');

  if (!decryptedData.success) {
    return;
  }

  const defaultFileName = fileName || "my-secret";

  // Create a temporary link element to trigger the download
  const link = document.createElement('a');
  link.href = decryptedData.data;
  link.download = defaultFileName;
  link.click();
  dmx.parse("content.varRunDownloadFunction.setValue(false)");

  // Clean up by revoking the Blob URL after some time
  setTimeout(() => {
    URL.revokeObjectURL(link.href);
  }, 1000);
}

function readFile(inputId) {
  return new Promise((resolve, reject) => {
    const fileInput = document.getElementById(inputId);
    const maxPvtKeyFileSize = dmx.parse("content.varMaxPVTKEYFileSize.value.toNumber()")

    const maxPvtKeyFileSizeMB = (maxPvtKeyFileSize / 1000000); // Convert bytes to MB and round to 2 decimal places

    if (fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];

      // Check if file size is greater than our mentioned size
      if (file.size > maxPvtKeyFileSize) {
        const fileSizeError = document.getElementById('pvtKeyFileSizeError')
        fileSizeError.textContent = `Please select a file smaller than ${maxPvtKeyFileSizeMB} MB in size.`;
        fileSizeError.className = 'text-danger';
        // reject(new Error('File size should be less than' + maxPvtKeyFileSize + 'bytes.'));
        return;
      }

      const reader = new FileReader();

      reader.onload = function (event) {
        const contents = event.target.result;
        resolve(contents); // Resolve the promise with the file contents
      };

      reader.onerror = function () {
        reject(new Error('Error reading file')); // Reject the promise on error
      };

      reader.readAsText(file);
    } else {
      reject(new Error('No file selected')); // Reject the promise if no file is selected
    }
  });
}

function checkFileType() {
  const fileInput = document.getElementById('fileData');
  const file = fileInput.files[0];
  const maxFileSize = dmx.parse("content.varMaxFileSize.value.toNumber()")
  const maxFileSizeMB = (maxFileSize / 1000000); // Convert bytes to MB and round to 2 decimal places

  if (!file) {
    alert('Please select a file.');
    return false;
  }

  if (file.size > maxFileSize) {
    const fileSizeError = document.getElementById('fileSizeError')
    fileSizeError.textContent = `Please select a file smaller than ${maxFileSizeMB} MB in size.`;
    fileSizeError.className = 'text-danger';
    return false;
  }

  let fileExt = file.name.split('.').pop();
  if (fileExt == file.name)
    fileExt = 'txt';

  dmx.parse("content.modalManageSecret.formManageSecret.txtFileMimeType.setValue('" + file.type + "')");
  dmx.parse("content.modalManageSecret.formManageSecret.txtFileExtension.setValue('." + fileExt + "')");

  return true; // Return true if the file is valid
}

function removeSession() {
  sessionStorage.removeItem('private_key')
}

/**
 * Function to convert buffer data to base64
 * to be able to compare and debug encryption
 * and decryption function.
 */
function toBase64(bufferView) {
  const base64Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const byteLength = bufferView.length;
  // const bufferView = new Uint8Array(buffer);
  let string = "";

  for (let i = 0; i < byteLength; i += 3) {
    const chunk = (bufferView[i] << 16) | (bufferView[i + 1] << 8) | bufferView[i + 2];
    string += base64Chars[(chunk & 0b111111000000000000000000) >> 18];
    string += base64Chars[(chunk & 0b000000111111000000000000) >> 12];
    string += base64Chars[(chunk & 0b000000000000111111000000) >> 6];
    string += base64Chars[(chunk & 0b000000000000000000111111)];
  }

  const remainingBytesCount = byteLength % 3;
  if (remainingBytesCount === 2) {
    const chunk = (bufferView[byteLength - 2] << 16) | (bufferView[byteLength - 1] << 8);
    string += base64Chars[(chunk & 0b111111000000000000000000) >> 18];
    string += base64Chars[(chunk & 0b000000111111000000000000) >> 12];
    string += base64Chars[(chunk & 0b000000000000111111000000) >> 6];
    string += "=";
  } else if (remainingBytesCount === 1) {
    const chunk = bufferView[byteLength - 1] << 16;
    string += base64Chars[(chunk & 0b111111000000000000000000) >> 18];
    string += base64Chars[(chunk & 0b000000111111000000000000) >> 12];
    string += "==";
  }

  return string;
}

function clearInput() {
  document.getElementById('fileKey').value = '';
  document.getElementById('fileData').value = '';
  document.getElementById('txtData').value = '';
  document.getElementById('fileSizeError').textContent = '';
}