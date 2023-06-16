const readline = require('readline');
const os = require('os');
const path = require('path');
const fs = require('fs');
const { dotNotationToObject, getValueFromObject } = require('@cocreate/utils');

module.exports = async function (items, env = true, global = true) {
    async function promptForInput(question) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise((resolve) => {
            rl.question(question, (answer) => {
                rl.close();
                resolve(answer.trim());
            });
        });
    }

    const filterEmptyValues = (obj) => {
        return Object.fromEntries(
            Object.entries(obj).filter(([_, value]) => {
                if (typeof value === 'object' && !Array.isArray(value)) {
                    return Object.keys(value).length > 0;
                } else if (Array.isArray(value)) {
                    return value.length > 0;
                } else {
                    return value !== '';
                }
            })
        );
    };

    let config = {};
    let update = false;
    let variables = {};

    async function getConfig(items) {
        for (let key of Object.keys(items)) {
            let { value, prompt, choices, variable } = items[key];

            const placeholders = key.match(/{{\s*([\w\W]+?)\s*}}/g);
            if (placeholders && placeholders.length) {
                for (let placeholder of placeholders) {
                    placeholder.trim()
                    if (variables[placeholder])
                        key = key.replace(placeholder, variables[placeholder])
                }
            }

            if (choices) {
                if (!prompt && prompt !== '') continue;

                let isAnswered = false
                for (let choice of Object.keys(choices)) {
                    let isAnsweredChoice = true
                    for (let choicekey of Object.keys(choices[choice])) {
                        let choiceValue = localConfig[choicekey] || globalConfig[choicekey]
                        if (choiceValue) {
                            config[choicekey] = choiceValue
                        } else
                            isAnsweredChoice = false

                    }
                    if (isAnsweredChoice)
                        isAnswered = true
                }

                if (!isAnswered) {
                    const answer = await promptForInput(prompt || `${key}: `);
                    const choice = choices[answer];
                    if (choice) {
                        await getConfig(choice);
                    }
                }
            } else if (variable) {
                let variableValue = localConfig[key] || globalConfig[key]
                if (!variableValue) {
                    variables[`{{${variable}}}`] = value || await promptForInput(prompt || `${variable}: `);
                } else {
                    variables[`{{${variable}}}`] = Object.keys(variableValue)[0]
                }
            } else {
                if (value || value === "") {
                    config[key] = value;
                    if (global)
                        update = true;
                } else if (process.env[key]) {
                    // TODO: if JSON.String object.parse()
                    config[key] = process.env[key];
                } else {
                    let localKey, globalKey
                    if (localKey = getValueFromObject(localConfig, key)) {
                        config[key] = localKey;
                    } else if (globalKey = getValueFromObject(globalConfig, key)) {
                        config[key] = globalKey;
                    } else if (prompt || prompt === '') {
                        config[key] = await promptForInput(prompt || `${key}: `);
                        if (global) update = true;
                    }
                    if (env) {
                        if (typeof config[key] === 'object')
                            process.env[key] = JSON.stringify(config[key]);
                        else
                            process.env[key] = config[key];
                    }
                }
            }
        }
    }

    let localConfig = {};
    const localConfigPath = path.resolve(process.cwd(), 'CoCreate.config.js');
    if (fs.existsSync(localConfigPath)) {
        localConfig = require(localConfigPath);
    }

    let globalConfig = {};
    const globalConfigPath = path.resolve(os.homedir(), 'CoCreate.config.js');
    if (fs.existsSync(globalConfigPath)) {
        globalConfig = require(globalConfigPath);
    }

    if (items) {
        await getConfig(items);

        if (update) {
            let updatedGlobalConfig = filterEmptyValues(
                dotNotationToObject(config, globalConfig)
            );

            const globalConfigString = `module.exports = ${JSON.stringify(updatedGlobalConfig, null, 2)};`;
            fs.writeFileSync(globalConfigPath, globalConfigString);
        }
    } else {
        config = {
            ...filterEmptyValues(globalConfig),
            ...filterEmptyValues(localConfig)
        };
    }

    config = dotNotationToObject(config);
    return config
}
