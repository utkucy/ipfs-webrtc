import { observable, computed } from "mobx";
import UserStore from "./user";

import { create } from "ipfs";
import * as IPFSClient from "ipfs-http-client";
import OrbitDB from "orbit-db";
import Store from "orbit-db-store";
import DocumentStore from "orbit-db-docstore";
import DatabaseStore from "./database";
// import { Ipfs } from "models/ipfs/index";

export default class AppStore {
  // STORES
  @observable userStore;
  @observable databaseStore;

  @observable isReady = false;

  constructor() {
    this.userStore = new UserStore();
    this.databaseStore = new DatabaseStore();
  }
}

export const store = new AppStore();
