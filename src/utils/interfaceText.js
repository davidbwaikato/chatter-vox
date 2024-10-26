

/**
 * Evaluates a template-like string with variable substitution.
 * @param {string} templateStr - The string with template-like variables (e.g., "${variable}").
 * @param {object} context - An object containing variables to substitute (e.g., { variable: "value" }).
 * @returns {string} - The evaluated string with variables replaced.
 */
    
function evaluateTemplateString(templateStr, context) {
  // Convert the template-like string into a function to evaluate it
  const templateFunction = new Function(...Object.keys(context), `return \`${templateStr}\`;`);
  // Execute the function with context variables
  return templateFunction(...Object.values(context));
}

// Example usage:
/*
  const json = {
  "_statusChatLLMProcessing_": "Recognised text being processed by ${defaultChatLLM} ..."
};

  const defaultChatLLM = "OpenAI";

  const evaluatedText = evaluateTemplateString(json._statusChatLLMProcessing_, { defaultChatLLM });
  console.log(evaluatedText);
*/

// Output: "Recognised text being processed by OpenAI ..."

const selectedChatLLM = "OpenAI";

const interfaceTextResolver = (configOptions,textFragmentKey,lang) => {
    const interfaceText = configOptions.interfaceText;
    
    //console.log(`Looking up '${textFragmentKey}'[${lang}] in: "`, interfaceText);
    const text_frag_lang_value = interfaceText[textFragmentKey][lang];
    
    const evaluated_text = evaluateTemplateString(text_frag_lang_value, { selectedChatLLM });

    return evaluated_text;

};

export { interfaceTextResolver };
