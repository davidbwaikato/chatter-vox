
// The following function was generated using ChatGPT in response to
// the prompt:
//
//   If I have read in a JSON file and it includes string literals
//   that are really template literals in disguise, how to I
//   'evaluate' them so the variables in my program get substituted
//   in?



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

// ****
//const selectedChatLLM = "OpenAI";

const interfaceTextResolver = (configOptions,textFragmentKey,lang) => {
    const interfaceText = configOptions.interfaceText;
    
    //console.log(`Looking up '${textFragmentKey}'[${lang}] in: "`, interfaceText);
    const text_frag_lang_value = interfaceText[textFragmentKey][lang];

    const params = {};
    for (const key in configOptions.params) {
	params[key] = configOptions.params[key];
    }
    
    const evaluated_text = evaluateTemplateString(text_frag_lang_value,params);

    return evaluated_text;

};

const cssSettingResolver = (configOptions,cssKey) => {

    if (configOptions == null) { return null };
    
    const cssSettings = configOptions.cssSettings;
    
    //console.log(`cssSettingResolver() Looking up '${cssKey}' in: "`, cssSettings);
    const css_value = cssSettings[cssKey];

    const params = {};
    for (const key in configOptions.cssParams) {
	params[key] = configOptions.cssParams[key];
    }

    //console.log(`Resolving css_value = ${css_value} with params: ", params`);
    const evaluated_text = evaluateTemplateString(css_value,params);

    return evaluated_text;    
}
    
export { interfaceTextResolver, cssSettingResolver };
