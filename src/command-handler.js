"use strict";

const {webWindowSignin, secretSignin, connect} = require("./signin");
const {runApi} = require("./runapi");
const {downloadResource} = require("./download");
const {uploadResource} = require("./upload");
const {getInfo} = require("./info");
const {runDatabotCommand} = require("./databot");
const {getAliasesArray} = require("./alias");
const {getSecretAliasName} = require("./utils");


class CommandHandler {
  constructor({tdxConfig, secret, token, timeout}) {
    this.tokenHref = tdxConfig.tokenHref || "";
    this.config = tdxConfig.config || {};
    this.timeout = timeout || 5000;
    this.secret = secret || {};
    this.accessToken = token || "";
  }

  getToken() {
    return this.accessToken;
  }

  async connect() {
    const api = await connect({
      config: this.config,
      secret: this.secret,
      token: this.accessToken,
    });

    this.accessToken = api.accessToken;

    return api;
  }

  async signin(secret) {
    const api = (secret.id) ? await this.secretSignin(secret) :
      await this.webSignin();

    this.accessToken = api.accessToken;

    return api;
  }

  async webSignin() {
    const api = await webWindowSignin(this.config, this.tokenHref);
    return api;
  }

  async secretSignin(secret) {
    const api = await secretSignin({
      config: this.config,
      tokenHref: this.tokenHref,
      timeout: this.timeout,
      secret,
    });
    return api;
  }

  async signout() {
    this.accessToken = "";
    this.secret = {};
  }

  async runApi({command, apiArgs, apiArgsStringify}) {
    const api = await this.connect();
    return runApi({command, apiArgs, apiArgsStringify, api});
  }

  async getInfo({id, type}) {
    const api = await this.connect();
    return getInfo({api, type, id});
  }

  async download(id, filepath) {
    const api = await this.connect();
    return downloadResource({id, filepath, api});
  }

  async upload(id, filepath) {
    const api = await this.connect();
    return uploadResource({id, filepath, api});
  }

  async runDatabotCommand({command, id, configJson}) {
    const api = await this.connect();
    return runDatabotCommand({api, command, id, configJson});
  }

  async runTokenCommand(command) {
    await this.connect();
    switch (command) {
      case "get":
        return this.accessToken;
      default:
        throw Error("Invalid token command");
    }
  }

  async getList({alias, type, tdxConfigs, env}) {
    const aliases = getAliasesArray(tdxConfigs);
    switch (type) {
      case "":
      case "aliases":
        return {default: alias, aliases};
      case "secrets":
        return aliases.reduce(
          (result, alias) => {
            result[alias] = env[getSecretAliasName(alias)] || "";
            return result;
          }, {}
        );
      default:
        throw Error("Wrong input list type");
    }
  }
}

module.exports = CommandHandler;
