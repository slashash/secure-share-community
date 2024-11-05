/**
 * Obfuscates the specified keys in a JavaScript object.
 * @param {Object} obj - The JavaScript object to be obfuscated.
 * @param {...string} keysToReplace - The keys whose values need to be replaced.
 * @returns {Object} The obfuscated JavaScript object.
 */
exports.obfuscateJson = function (obj, keysToReplaceString) {
  try {
    // Split the comma-separated string into an array of keys
    const keysToReplace = keysToReplaceString.split(',');

    // Helper function to obfuscate keys in an object
    function obfuscate(obj, keysToReplace) {
      const stack = [obj];

      while (stack.length) {
        const currentObj = stack.pop();

        for (const key in currentObj) {
          if (currentObj.hasOwnProperty(key)) {
            if (keysToReplace.includes(key)) {
              console.log(`Obfuscating key: ${key}`); // Debug log
              currentObj[key] = 'xxxxxxxxxxxxxxx';
            } else if (typeof currentObj[key] === 'object' && currentObj[key] !== null) {
              stack.push(currentObj[key]);
            }
          }
        }
      }
    }

    // Obfuscate the original object directly
    obfuscate(obj, keysToReplace);

    return obj;

  } catch (error) {
    console.error('Error processing object:', error);
    return null; // Return null if any error occurs
  }
}