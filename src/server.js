const readline = require('readline');
const os = require('os');
const path = require('path');
const fs = require('fs');
const { dotNotationToObject } = require('@cocreate/utils');

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
                if (!prompt && prompt !== '' || !choices) continue;
                const answer = await promptForInput(prompt || `${key}: `);
                const choice = choices[answer];
                if (choice) {
                    await getConfig(choice);
                }
            } else if (variable) {
                variables[`{{${key}}}`] = value || await promptForInput(prompt || `${key}: `);
            } else {
                // TODO: handle dotnotation
                if (value || value === "") {
                    config[key] = value;
                    if (global)
                        update = true;
                } else if (process.env[key]) {
                    config[key] = process.env[key];
                } else {
                    if (localConfig[key]) {
                        config[key] = localConfig[key];
                    } else if (globalConfig[key]) {
                        config[key] = globalConfig[key];
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

    return config;
}
